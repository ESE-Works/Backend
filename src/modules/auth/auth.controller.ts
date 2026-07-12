import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AUTH_SWAGGER } from './auth.swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * @param accessToken 프론트에서 카카오 SDK로 발급받은 accessToken
   * @returns 자체 발급 accessToken, refreshToken
   */
  @Post('kakao')
  @HttpCode(200)
  @ApiOperation(AUTH_SWAGGER.kakaoLogin)
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

  /**
   * @param accessToken 프론트에서 구글 OAuth로 발급받은 accessToken
   * @returns 자체 발급 accessToken, refreshToken
   */
  @Post('google')
  @HttpCode(200)
  @ApiOperation(AUTH_SWAGGER.googleLogin)
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

  /**
   * @param refreshToken 로그인 시 발급받은 refresh token 원본 값
   * @returns 새로 발급된 accessToken, refreshToken
   */
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation(AUTH_SWAGGER.refresh)
  @ApiBody({
    schema: {
      properties: {
        refreshToken: {
          type: 'string',
          description: '로그인 시 발급받은 refreshToken',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '재발급 성공, 새 accessToken/refreshToken 반환',
  })
  @ApiResponse({
    status: 401,
    description: 'refreshToken이 유효하지 않거나 만료됨',
  })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }
}
