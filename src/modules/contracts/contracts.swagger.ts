import { ApiOperationOptions } from '@nestjs/swagger';

export const CONTRACTS_SWAGGER: Record<
  'analyzeText' | 'analyzeSpecialTerms' | 'sample' | 'findOne' | 'findAll',
  ApiOperationOptions
> = {
  analyzeText: {
    summary: '계약서 전체 텍스트 분석',
    description: `
계약서 전체 원문을 GPT-4o로 분석합니다 (핵심 정보 추출, 필수 기재사항 누락, 위험 조항, 전세사기 위험 지표, 위험도 점수 전부 포함).
주거용 임대차 계약서가 아니라고 판단되면 400(NOT_CONTRACT)을 반환합니다.

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. body에 계약서 전체 텍스트를 넣어 호출 (최대 10,000자, 초과 시 앞부분만 분석)
`,
  },
  analyzeSpecialTerms: {
    summary: '특약 조항만 분석',
    description: `
계약서 원문 없이 특약 조항 텍스트만으로 위험 조항 감지 + 수정 제안을 받습니다.
핵심 정보 추출/필수 기재사항 누락/전세사기 지표는 분석되지 않습니다 (원문 맥락이 없어서).

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. body에 확인하고 싶은 특약 조항 텍스트를 넣어 호출
`,
  },
  sample: {
    summary: '샘플 분석 결과 체험',
    description: `
실제 GPT 호출 없이, 미리 준비된 샘플 계약서 분석 결과를 즉시 반환합니다.
계약서를 올리기 전에 앱이 어떻게 동작하는지 미리 보여주기 위한 용도입니다.

**테스트 방법**
1. 인증 없이 바로 Try it out으로 호출 가능
`,
  },
  findOne: {
    summary: '계약 분석 결과 단건 조회',
    description: `
본인이 요청한 계약 분석 결과를 조회합니다. 다른 유저의 결과는 조회할 수 없습니다 (404).

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. path parameter에 조회할 계약 id 입력
`,
  },
  findAll: {
    summary: '내 계약 분석 이력 조회',
    description: `
로그인한 유저가 지금까지 분석 요청한 계약 목록을 최신순으로 반환합니다.

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. 별도 파라미터 없이 바로 Try it out으로 호출
`,
  },
};
