import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('kakao')
  @HttpCode(200)
  kakaoLogin(@Body('accessToken') accessToken: string) {
    return this.authService.kakaoLogin(accessToken);
  }

  @Post('google')
  @HttpCode(200)
  googleLogin(@Body('accessToken') accessToken: string) {
    return this.authService.googleLogin(accessToken);
  }
}
