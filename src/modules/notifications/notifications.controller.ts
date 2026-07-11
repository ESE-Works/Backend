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

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('device-token')
  @ApiOperation({
    summary: 'FCM 디바이스 토큰 등록',
    description:
      '푸시 알림을 받을 기기의 FCM 토큰을 등록합니다. 이미 등록된 토큰이면 소유자/기기 정보만 갱신됩니다.\n' +
      '테스트 방법: 상단 Authorize에 JWT를 넣은 뒤 Try it out → body에 임의의 fcm_token 문자열(실제 기기 토큰이 없다면 아무 문자열)로 호출 가능합니다.',
  })
  @ApiResponse({ status: 201, description: '등록/갱신된 디바이스 토큰 반환' })
  registerDeviceToken(@Request() req, @Body() dto: RegisterDeviceTokenDto) {
    return this.notificationsService.registerDeviceToken(
      req.user.userId,
      dto.fcm_token,
      dto.device_type,
    );
  }

  @Delete('device-token/:fcmToken')
  @ApiOperation({
    summary: 'FCM 디바이스 토큰 삭제',
    description:
      '더 이상 사용하지 않는 디바이스 토큰을 삭제합니다 (로그아웃, 앱 삭제 등).\n' +
      '테스트 방법: 상단 Authorize에 JWT를 넣은 뒤 path parameter에 삭제할 fcm_token 값을 넣어 호출합니다.',
  })
  @ApiResponse({ status: 200, description: '삭제 완료' })
  removeDeviceToken(@Param('fcmToken') fcmToken: string) {
    return this.notificationsService.removeDeviceToken(fcmToken);
  }

  @Get()
  @ApiOperation({
    summary: '내 알림 목록 조회',
    description:
      '현재 로그인한 유저에게 발송된 알림 내역을 최신순으로 조회합니다.\n' +
      '테스트 방법: 상단 Authorize에 JWT를 넣은 뒤 바로 Try it out으로 호출하면 됩니다 (별도 파라미터 없음).',
  })
  @ApiResponse({ status: 200, description: '알림 목록 반환 (최신순)' })
  findMyNotifications(@Request() req) {
    return this.notificationsService.findByUser(req.user.userId);
  }
}
