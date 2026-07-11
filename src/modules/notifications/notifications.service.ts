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

  async removeDeviceToken(fcmToken: string): Promise<void> {
    await this.deviceTokenRepository.delete({ fcm_token: fcmToken });
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

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
