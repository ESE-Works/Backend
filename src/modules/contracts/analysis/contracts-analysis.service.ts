import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AiParseFailedException,
  NotContractException,
} from './contract-analysis.errors';
import { ContractAnalysisResult, InputSource } from './analysis.types';

const MODEL = 'gpt-4o';
const MAX_TOKENS = 4000;
const TEMPERATURE = 0;
const TIMEOUT_MS = 60 * 1000;
const MAX_CONTRACT_TEXT_LENGTH = 10000;
const PAGE_SEPARATOR = '\n\n--- 페이지 구분 ---\n\n';
const SPECIAL_TERMS_TAG = '[특약 조항 입력 모드]';

const SYSTEM_PROMPT = `당신은 한국 주거용 임대차 계약서 전문 분석 AI입니다.
임차인(세입자)의 입장에서 계약서를 검토하고, 아래 지시에 따라 JSON 형식으로만 응답하세요.

[분석 기준 법령]
- 주택임대차보호법 (최신 개정 기준)
- 민법 제609조~제654조 (임대차 관련 조항)
- 전세사기피해자 지원 및 주거안정에 관한 특별법

[지원 계약서 유형]
- 주거용 임대차 계약서만 분석합니다 (원룸·오피스텔·아파트·빌라 월세/전세)
- 상가·사무실·고시원 계약서가 입력된 경우 contract_valid: false로 응답하세요

[입력 모드 구분]
- 텍스트 앞에 [특약 조항 입력 모드] 태그가 있으면:
  → extraction, missing_check, fraud_risk는 분석하지 않습니다
  → clauses 분석과 suggestion만 수행합니다
  → summary에 "특약 조항만 분석된 결과입니다" 문구를 포함하세요

[출력 규칙]
1. 반드시 아래 JSON 스키마를 정확히 따르세요
2. JSON 외 다른 텍스트를 절대 포함하지 마세요
3. 모든 문자열은 한국어로 작성하세요
4. 추출 불가능한 필드는 null, 빈 배열은 []로 표시하세요
5. reason 필드는 30자를 초과하지 마세요
6. suggestion은 실제 계약서에 넣을 수 있는 문구로 작성하세요
7. deposit(보증금)과 monthly_rent(월세)는 반드시 만원 단위 숫자로 표기하세요 (예: 오천만원 → 5000, 육십오만원 → 65)

[면책 원칙]
- 확신할 수 없는 경우 warning으로 분류하고 reason에 "전문가 확인 권장" 명시
- 등기부등본·시세 등 외부 데이터 없이 판단 불가한 항목은 분석 제외

[응답 JSON 스키마]
{
  "contract_valid": boolean,
  "input_mode": "full" | "special_terms",
  "is_truncated": boolean,
  "extraction": { "lessor_name": string|null, "lessee_name": string|null, "property_address": string|null, "property_type": "apartment"|"officetel"|"villa"|"oneroom"|"unknown", "contract_type": "monthly"|"lease"|"semi_lease"|"unknown", "deposit": number|null (만원 단위), "monthly_rent": number|null (만원 단위), "contract_start": string|null, "contract_end": string|null, "special_terms": string[] } | null,
  "missing_check": [{ "item": string, "severity": "danger"|"warning", "description": string }],
  "clauses": [{ "id": string, "original_text": string, "type": "danger"|"warning"|"safe", "reason": string, "law_reference": string, "suggestion": string, "request_guide": string }],
  "fraud_risk": { "detected": boolean, "indicators": [{ "indicator": string, "severity": "danger"|"warning", "description": string }] } | null,
  "summary": string
}`;

@Injectable()
export class ContractsAnalysisService {
  private readonly logger = new Logger(ContractsAnalysisService.name);
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      timeout: TIMEOUT_MS,
    });
  }

  /**
   * 계약서 원문(또는 특약 조항)을 분석한다.
   * 전처리(페이지 병합/길이 제한/특약 모드 태그) 후 GPT-4o를 호출하고,
   * 위험도 점수는 응답을 신뢰하지 않고 서버에서 직접 계산해 덧붙인다.
   *
   * @param pages 계약서 원문 페이지 목록 (특약 모드에서는 보통 1개)
   * @param inputSource 입력 방식 (text_paste | text_special_terms 등)
   * @returns 위험도 점수/등급이 포함된 분석 결과
   * @throws NotContractException 주거용 임대차 계약서가 아니라고 판단된 경우 (전체 분석 모드에서만)
   * @throws AiParseFailedException AI 응답을 JSON으로 파싱할 수 없을 때 (1회 재시도 후에도 실패)
   */
  async analyze(
    pages: string[],
    inputSource: InputSource,
  ): Promise<ContractAnalysisResult> {
    const isSpecialTermsMode = inputSource === 'text_special_terms';
    const joined = pages.join(PAGE_SEPARATOR);
    const isTruncated = joined.length > MAX_CONTRACT_TEXT_LENGTH;
    const truncated = isTruncated
      ? joined.slice(0, MAX_CONTRACT_TEXT_LENGTH)
      : joined;
    const contractText = isSpecialTermsMode
      ? `${SPECIAL_TERMS_TAG}\n${truncated}`
      : truncated;

    const userPrompt = this.buildUserPrompt(
      contractText,
      inputSource,
      pages.length,
      isTruncated,
    );

    const raw = await this.callWithRetry([{ type: 'text', text: userPrompt }]);
    return this.finalizeResult(raw, isSpecialTermsMode);
  }

  /**
   * 계약서 사진(1장)을 GPT-4o Vision으로 분석한다. 별도 OCR 없이 이미지를 직접 읽어
   * 텍스트 분석과 동일한 JSON 스키마로 결과를 반환한다. 이미지는 메모리에서만 다루며
   * 디스크/DB에 저장하지 않는다.
   *
   * @param base64Image 이미지 base64 인코딩 문자열
   * @param mimeType 이미지 mime 타입 (image/jpeg, image/png 등)
   * @param inputSource 입력 방식 (image_camera | image_gallery | image_file)
   */
  async analyzeImage(
    base64Image: string,
    mimeType: string,
    inputSource: InputSource,
  ): Promise<ContractAnalysisResult> {
    const userPrompt = `아래 이미지는 계약서 사진입니다. 이미지 속 글자를 읽어 분석하고 JSON 스키마에 맞게 결과를 반환하세요.

[입력 방식: ${inputSource}]
이미지가 흐리거나 일부만 보여 판독이 어려운 항목은 null로 표시하세요.`;

    const raw = await this.callWithRetry([
      { type: 'text', text: userPrompt },
      {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64Image}` },
      },
    ]);
    return this.finalizeResult(raw, false);
  }

  private finalizeResult(
    raw: string,
    isSpecialTermsMode: boolean,
  ): ContractAnalysisResult {
    const result = this.parseResult(raw);

    if (!isSpecialTermsMode && result.contract_valid === false) {
      throw new NotContractException();
    }

    const { score, grade } = this.calculateRiskScore(result);
    return { ...result, risk_score: score, risk_grade: grade };
  }

  private buildUserPrompt(
    contractText: string,
    inputSource: InputSource,
    pageCount: number,
    isTruncated: boolean,
  ): string {
    const truncationNotice = isTruncated
      ? '[주의: 원문이 너무 길어 앞 10,000자만 분석합니다]\n'
      : '';

    return `아래 계약서를 분석하고 JSON 스키마에 맞게 결과를 반환하세요.

[입력 방식: ${inputSource}]
[페이지 수: ${pageCount}]
${truncationNotice}
--- 계약서 원문 시작 ---
${contractText}
--- 계약서 원문 끝 ---`;
  }

  /**
   * GPT 호출 후 JSON 파싱을 시도한다. 파싱 실패 시 한 번 재요청하고,
   * 그래도 실패하면 AiParseFailedException을 던진다.
   */
  private async callWithRetry(
    userContent: OpenAI.Chat.ChatCompletionContentPart[],
  ): Promise<string> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const content = await this.requestCompletion(userContent);
      try {
        JSON.parse(content);
        return content;
      } catch {
        this.logger.warn(`AI 응답 JSON 파싱 실패 (attempt ${attempt + 1})`);
      }
    }
    throw new AiParseFailedException();
  }

  private async requestCompletion(
    userContent: OpenAI.Chat.ChatCompletionContentPart[],
  ): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });

    return completion.choices[0]?.message?.content ?? '';
  }

  private parseResult(raw: string): ContractAnalysisResult {
    return JSON.parse(raw) as ContractAnalysisResult;
  }

  /**
   * 위험도 점수를 서버에서 직접 계산한다 (AI 응답의 점수를 신뢰하지 않음).
   * danger 조항 +15, warning 조항 +7, 누락(danger) +10, 누락(warning) +5,
   * 전세사기 위험 감지 시 (danger 지표 존재 시 +20, 아니면 +10, 최초 1회만).
   */
  private calculateRiskScore(result: ContractAnalysisResult): {
    score: number;
    grade: 'safe' | 'warning' | 'danger' | 'critical';
  } {
    let score = 0;
    score += result.clauses.filter((c) => c.type === 'danger').length * 15;
    score += result.clauses.filter((c) => c.type === 'warning').length * 7;
    score +=
      result.missing_check.filter((m) => m.severity === 'danger').length * 10;
    score +=
      result.missing_check.filter((m) => m.severity === 'warning').length * 5;

    if (result.fraud_risk?.detected) {
      const hasDanger = result.fraud_risk.indicators.some(
        (i) => i.severity === 'danger',
      );
      score += hasDanger ? 20 : 10;
    }

    score = Math.min(score, 100);
    return { score, grade: this.scoreToGrade(score) };
  }

  private scoreToGrade(
    score: number,
  ): 'safe' | 'warning' | 'danger' | 'critical' {
    if (score <= 30) return 'safe';
    if (score <= 60) return 'warning';
    if (score <= 79) return 'danger';
    return 'critical';
  }
}
