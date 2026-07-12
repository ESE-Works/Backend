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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { NotificationsService } from './notifications.service';
import { NOTIFICATIONS_SWAGGER } from './notifications.swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @param dto 등록할 fcm_token, device_type
   * @returns 등록/갱신된 디바이스 토큰
   */
  @Post('device-token')
  @ApiOperation(NOTIFICATIONS_SWAGGER.registerDeviceToken)
  @ApiResponse({ status: 201, description: '등록/갱신된 디바이스 토큰 반환' })
  registerDeviceToken(@Request() req, @Body() dto: RegisterDeviceTokenDto) {
    return this.notificationsService.registerDeviceToken(
      req.user.userId,
      dto.fcm_token,
      dto.device_type,
    );
  }

  /**
   * @param fcmToken 삭제할 디바이스 토큰 (path parameter)
   */
  @Delete('device-token/:fcmToken')
  @ApiOperation(NOTIFICATIONS_SWAGGER.removeDeviceToken)
  @ApiResponse({ status: 200, description: '삭제 완료' })
  removeDeviceToken(@Param('fcmToken') fcmToken: string) {
    return this.notificationsService.removeDeviceToken(fcmToken);
  }

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @returns 해당 유저의 알림 내역 (최신순)
   */
  @Get()
  @ApiOperation(NOTIFICATIONS_SWAGGER.findMyNotifications)
  @ApiResponse({ status: 200, description: '알림 목록 반환 (최신순)' })
  findMyNotifications(@Request() req) {
    return this.notificationsService.findByUser(req.user.userId);
  }
}
