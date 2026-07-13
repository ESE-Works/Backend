import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

/**
 * AI 응답이 JSON으로 파싱되지 않을 때 (1회 재시도 후에도 실패).
 */
export class AiParseFailedException extends ServiceUnavailableException {
  constructor() {
    super({
      errorCode: 'AI_PARSE_FAILED',
      message: 'AI 분석 결과를 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
}

/**
 * 입력이 주거용 임대차 계약서가 아니라고 AI가 판단했을 때 (contract_valid: false).
 */
export class NotContractException extends BadRequestException {
  constructor() {
    super({
      errorCode: 'NOT_CONTRACT',
      message: '주거용 임대차 계약서로 인식되지 않았습니다.',
    });
  }
}
