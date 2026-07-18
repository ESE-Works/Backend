import { ApiOperationOptions } from '@nestjs/swagger';

export const BENEFITS_SWAGGER: Record<
  'findAll' | 'findRecommended' | 'findOne',
  ApiOperationOptions
> = {
  findAll: {
    summary: '청년 지원 혜택 목록 조회',
    description: `
외부 청년 지원 혜택 데이터를 조회합니다.
region/age/incomeRange 쿼리 파라미터로 필터링할 수 있으며, 전달하지 않으면 전체 목록을 반환합니다.

**테스트 방법**
1. 인증 없이 바로 Try it out으로 호출 가능
2. 쿼리 파라미터를 채우면 해당 조건에 맞는 혜택만 반환

현재는 mock 데이터로 동작하며, 실제 외부 API 연동 전까지는 예시 데이터만 반환합니다.
`,
  },
  findRecommended: {
    summary: '내 프로필 기반 추천 혜택 조회',
    description: `
로그인한 유저의 region/age/income_range를 기준으로 맞는 혜택만 필터링해서 반환합니다.
회원가입 추가정보(POST /users/me/profile)를 먼저 입력해야 정확한 추천을 받을 수 있습니다.

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. 별도 파라미터 없이 바로 Try it out으로 호출
`,
  },
  findOne: {
    summary: '혜택 상세 조회',
    description: `
특정 혜택의 상세 정보(마감기한 포함)를 조회합니다. 로그인 없이도 사용 가능합니다.

**테스트 방법**
1. 인증 없이 바로 Try it out으로 호출 가능
2. path parameter에 조회할 혜택 id 입력 (예: mock-1)
`,
  },
};
