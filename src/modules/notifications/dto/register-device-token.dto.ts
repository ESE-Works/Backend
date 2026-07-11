import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: 'FCM 디바이스 토큰' })
  fcm_token: string;

  @ApiPropertyOptional({ description: '디바이스 종류 (ios/android 등)' })
  device_type?: string;
}
