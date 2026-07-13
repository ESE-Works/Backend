import { ContractAnalysisResult } from './analysis.types';

/**
 * 샘플 체험용 캐싱된 분석 결과 (docs/contracts_summation.md 예시 기반).
 * 실제 GPT 호출 없이 즉시 반환한다.
 */
export const SAMPLE_ANALYSIS_RESULT: ContractAnalysisResult = {
  contract_valid: true,
  input_mode: 'full',
  is_truncated: false,
  extraction: {
    lessor_name: '홍길동',
    lessee_name: '김청년',
    property_address: '서울 관악구 봉천동 123-45 201호',
    property_type: 'oneroom',
    contract_type: 'monthly',
    deposit: 5000,
    monthly_rent: 65,
    contract_start: '2026-07-01',
    contract_end: '2028-06-30',
    special_terms: ['원상복구 비용은 임차인이 전액 부담한다.'],
  },
  missing_check: [
    {
      item: '확정일자 관련 특약',
      severity: 'warning',
      description:
        '확정일자 특약이 없어 대항력 확보에 어려움이 있을 수 있습니다.',
    },
  ],
  clauses: [
    {
      id: 'clause_001',
      original_text: '원상복구 비용 일체는 임차인이 전액 부담한다.',
      type: 'danger',
      reason: '통상 마모까지 임차인 부담으로 전가',
      law_reference: '민법 제654조, 제615조',
      suggestion:
        '원상복구는 임차인의 고의·과실로 인한 손상에 한하며, 통상적인 마모는 제외한다.',
      request_guide:
        "서명 전 '통상 마모 제외' 문구 추가를 임대인에게 서면으로 요청하세요.",
    },
  ],
  fraud_risk: {
    detected: false,
    indicators: [],
  },
  summary:
    '보증금 5,000만원, 월세 65만원, 2년 계약. 위험 조항 1개, 누락 항목 1개 확인.',
  risk_score: 22,
  risk_grade: 'safe',
};
