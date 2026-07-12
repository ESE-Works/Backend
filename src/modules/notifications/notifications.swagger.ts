import { ApiOperationOptions } from '@nestjs/swagger';

export const NOTIFICATIONS_SWAGGER: Record<
  'registerDeviceToken' | 'removeDeviceToken' | 'findMyNotifications',
  ApiOperationOptions
> = {
  registerDeviceToken: {
    summary: 'FCM 디바이스 토큰 등록',
    description: `
푸시 알림을 받을 기기의 FCM 토큰을 등록합니다.
이미 등록된 토큰이면 소유자/기기 정보만 갱신됩니다.

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. Try it out → body의 \`fcm_token\`에 임의 문자열 입력 (실제 기기 토큰이 없어도 테스트 가능)
`,
  },
  removeDeviceToken: {
    summary: 'FCM 디바이스 토큰 삭제',
    description: `
더 이상 사용하지 않는 디바이스 토큰을 삭제합니다 (로그아웃, 앱 삭제 등).

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. path parameter \`fcmToken\`에 삭제할 토큰 값 입력 후 호출
`,
  },
  findMyNotifications: {
    summary: '내 알림 목록 조회',
    description: `
현재 로그인한 유저에게 발송된 알림 내역을 최신순으로 조회합니다.

**테스트 방법**
1. 상단 **Authorize** 버튼에 JWT 입력
2. 별도 파라미터 없이 바로 Try it out으로 호출
`,
  },
};
