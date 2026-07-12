import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export interface FcmPushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface FcmSendResult {
  successCount: number;
  invalidTokens: string[];
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 앱 시작 시 Firebase Admin SDK를 서비스 계정 자격증명으로 초기화한다.
   * 이미 초기화된 앱이 있으면(hot reload 등) 중복 초기화하지 않는다.
   */
  onModuleInit() {
    if (getApps().length > 0) return;

    initializeApp({
      credential: cert({
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        // .env에 개행이 \n 문자열로 저장되므로 실제 개행으로 복원
        privateKey: this.configService
          .get<string>('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
      }),
    });
  }

  /**
   * 여러 디바이스 토큰에 동일한 푸시 메시지를 발송한다.
   * 발송 실패 중 토큰 자체가 무효(삭제/미등록)인 경우를 구분해 반환하여,
   * 호출 측(NotificationsService)이 해당 토큰을 DB에서 정리할 수 있게 한다.
   *
   * @param tokens 발송 대상 FCM 토큰 목록
   * @param payload 푸시 제목/본문/부가 데이터
   * @returns 성공 건수와 무효화된 토큰 목록
   */
  async sendToTokens(
    tokens: string[],
    payload: FcmPushPayload,
  ): Promise<FcmSendResult> {
    const stringData = Object.fromEntries(
      Object.entries(payload.data ?? {}).map(([key, value]) => [
        key,
        String(value),
      ]),
    );

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: stringData,
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((result, index) => {
      if (!result.success && this.isInvalidTokenError(result.error?.code)) {
        invalidTokens.push(tokens[index]);
      }
      if (!result.success) {
        this.logger.warn(
          `FCM 발송 실패 (token: ${tokens[index]}): ${result.error?.message}`,
        );
      }
    });

    return { successCount: response.successCount, invalidTokens };
  }

  /**
   * FCM 에러 코드가 "토큰이 더 이상 유효하지 않음"에 해당하는지 판별한다.
   *
   * @param errorCode FCM 응답의 에러 코드
   * @returns 토큰을 DB에서 삭제해야 하는 에러인지 여부
   */
  private isInvalidTokenError(errorCode?: string): boolean {
    return (
      errorCode === 'messaging/registration-token-not-registered' ||
      errorCode === 'messaging/invalid-registration-token'
    );
  }
}
