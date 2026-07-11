import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('kakao')
  @HttpCode(200)
  @ApiOperation({
    summary: '카카오 소셜 로그인',
    description:
      '프론트에서 카카오 SDK로 발급받은 accessToken을 그대로 전달하면, ' +
      '카카오 사용자 정보를 조회해 신규면 가입 후 자체 JWT를 발급하고 기존 유저면 로그인 처리합니다.\n' +
      '테스트 방법: 카카오 로그인으로 발급받은 실제 accessToken이 필요합니다 (자체 발급 불가). ' +
      '응답으로 받은 accessToken(JWT)을 Swagger 상단 Authorize에 넣으면 보호된 API를 테스트할 수 있습니다.',
  })
  @ApiBody({
    schema: {
      properties: {
        accessToken: { type: 'string', description: '카카오 SDK accessToken' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '로그인/가입 성공, JWT 반환' })
  @ApiResponse({ status: 503, description: '카카오 API 통신 실패' })
  kakaoLogin(@Body('accessToken') accessToken: string) {
    return this.authService.kakaoLogin(accessToken);
  }

  @Post('google')
  @HttpCode(200)
  @ApiOperation({
    summary: '구글 소셜 로그인',
    description:
      '프론트에서 구글 OAuth로 발급받은 accessToken을 그대로 전달하면, ' +
      '구글 사용자 정보를 조회해 신규면 가입 후 자체 JWT를 발급하고 기존 유저면 로그인 처리합니다.\n' +
      '테스트 방법: 구글 로그인으로 발급받은 실제 accessToken이 필요합니다 (자체 발급 불가). ' +
      '응답으로 받은 accessToken(JWT)을 Swagger 상단 Authorize에 넣으면 보호된 API를 테스트할 수 있습니다.',
  })
  @ApiBody({
    schema: {
      properties: {
        accessToken: { type: 'string', description: '구글 OAuth accessToken' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '로그인/가입 성공, JWT 반환' })
  @ApiResponse({ status: 503, description: '구글 API 통신 실패' })
  googleLogin(@Body('accessToken') accessToken: string) {
    return this.authService.googleLogin(accessToken);
  }
}
