import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('device-token')
  @ApiOperation({ summary: 'FCM 디바이스 토큰 등록' })
  registerDeviceToken(@Request() req, @Body() dto: RegisterDeviceTokenDto) {
    return this.notificationsService.registerDeviceToken(
      req.user.userId,
      dto.fcm_token,
      dto.device_type,
    );
  }

  @Delete('device-token/:fcmToken')
  @ApiOperation({ summary: 'FCM 디바이스 토큰 삭제' })
  removeDeviceToken(@Param('fcmToken') fcmToken: string) {
    return this.notificationsService.removeDeviceToken(fcmToken);
  }

  @Get()
  @ApiOperation({ summary: '내 알림 목록 조회' })
  findMyNotifications(@Request() req) {
    return this.notificationsService.findByUser(req.user.userId);
  }
}
