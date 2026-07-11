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

  onModuleInit() {
    if (getApps().length > 0) return;

    initializeApp({
      credential: cert({
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        privateKey: this.configService
          .get<string>('FIREBASE_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'),
      }),
    });
  }

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

  private isInvalidTokenError(errorCode?: string): boolean {
    return (
      errorCode === 'messaging/registration-token-not-registered' ||
      errorCode === 'messaging/invalid-registration-token'
    );
  }
}
