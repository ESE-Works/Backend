import { ApiOperationOptions } from '@nestjs/swagger';

export const USERS_SWAGGER: Record<
  'getMe' | 'completeProfile',
  ApiOperationOptions
> = {
  getMe: {
    summary: '내 정보 조회',
    description: `
현재 로그인한 유저의 정보를 조회합니다.

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. 별도 파라미터 없이 바로 Try it out으로 호출
`,
  },
  completeProfile: {
    summary: '회원가입 추가정보 등록 (region/age/income_range)',
    description: `
소셜 로그인으로는 가져올 수 없는 region/age/income_range를 회원가입 추가 화면에서 입력받아 저장합니다.
전달한 필드만 갱신되며, 나머지는 기존 값이 유지됩니다.

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. Try it out → body에 원하는 필드만 채워서 Execute
3. 이후 \`GET /users/me\`로 값이 반영됐는지 확인
`,
  },
};
