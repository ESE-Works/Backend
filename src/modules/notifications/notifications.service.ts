import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DeviceToken } from './entities/device-token.entity';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './notification-type.enum';
import { FcmService } from './fcm/fcm.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepository: Repository<DeviceToken>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * FCM 디바이스 토큰을 등록한다. 이미 등록된 토큰이면 소유자/기기 정보만 갱신한다
   * (기기 재로그인, 유저 교체 등으로 같은 토큰이 재등록될 수 있어서).
   *
   * @param userId 토큰을 등록할 유저 id
   * @param fcmToken FCM에서 발급한 디바이스 토큰
   * @param deviceType 기기 종류 (ios/android 등, optional)
   * @returns 등록/갱신된 디바이스 토큰
   */
  async registerDeviceToken(
    userId: string,
    fcmToken: string,
    deviceType?: string,
  ): Promise<DeviceToken> {
    const existing = await this.deviceTokenRepository.findOne({
      where: { fcm_token: fcmToken },
    });

    if (existing) {
      existing.user_id = userId;
      existing.device_type = deviceType ?? existing.device_type;
      return this.deviceTokenRepository.save(existing);
    }

    const deviceToken = this.deviceTokenRepository.create({
      user_id: userId,
      fcm_token: fcmToken,
      device_type: deviceType,
    });
    return this.deviceTokenRepository.save(deviceToken);
  }

  /**
   * @param fcmToken 삭제할 디바이스 토큰
   */
  async removeDeviceToken(fcmToken: string): Promise<void> {
    await this.deviceTokenRepository.delete({ fcm_token: fcmToken });
  }

  /**
   * @param userId 조회할 유저 id
   * @returns 해당 유저의 알림 내역 (최신순)
   */
  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 알림을 DB에 기록하고, 유저가 등록한 모든 기기로 FCM 푸시를 발송한다.
   * 발송 중 무효화된(삭제/미등록) 토큰은 자동으로 device_tokens에서 정리한다.
   *
   * @param userId 알림을 받을 유저 id
   * @param type 알림 종류
   * @param title 푸시 제목
   * @param body 푸시 본문
   * @param data 클라이언트에 함께 전달할 부가 데이터 (optional)
   * @returns 저장된 알림 (is_sent로 발송 성공 여부 확인 가능)
   */
  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.save(
      this.notificationRepository.create({
        user_id: userId,
        type,
        title,
        body,
        data: data ?? null,
        is_sent: false,
      }),
    );

    const deviceTokens = await this.deviceTokenRepository.find({
      where: { user_id: userId },
    });
    if (deviceTokens.length === 0) return notification;

    const result = await this.fcmService.sendToTokens(
      deviceTokens.map((deviceToken) => deviceToken.fcm_token),
      { title, body, data },
    );

    notification.is_sent = result.successCount > 0;
    await this.notificationRepository.save(notification);

    if (result.invalidTokens.length > 0) {
      await this.deviceTokenRepository.delete({
        fcm_token: In(result.invalidTokens),
      });
    }

    return notification;
  }
}
