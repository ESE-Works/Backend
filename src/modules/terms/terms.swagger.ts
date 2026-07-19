import { ApiOperationOptions } from '@nestjs/swagger';

export const TERMS_SWAGGER: Record<
  'findLatest' | 'submitConsents' | 'myConsents',
  ApiOperationOptions
> = {
  findLatest: {
    summary: '최신 약관 목록 조회',
    description: `
각 약관 종류(개인정보 수집·이용, 고유식별정보 처리, 제3자 제공·처리위탁, 마케팅 수신 등)별
가장 최신 버전을 반환합니다. 회원가입/동의 화면에서 이 목록을 그려주면 됩니다.

**테스트 방법**
1. 인증 없이 바로 Try it out으로 호출 가능
`,
  },
  submitConsents: {
    summary: '약관 동의 제출',
    description: `
항목별 동의 여부를 저장합니다. 필수 약관 중 하나라도 동의하지 않으면 400을 반환합니다.
동의 이력은 절대 덮어쓰지 않고 매번 새로 쌓입니다.

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. GET /terms로 받은 version 값을 그대로 사용해 body 구성 후 호출
`,
  },
  myConsents: {
    summary: '내 동의 이력 조회',
    description: `
로그인한 유저의 전체 약관 동의 이력을 최신순으로 반환합니다.

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. 별도 파라미터 없이 바로 Try it out으로 호출
`,
  },
};
