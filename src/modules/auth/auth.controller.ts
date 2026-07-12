import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

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
  @ApiOperation({
    summary: '카카오 소셜 로그인',
    description: `
카카오 SDK로 발급받은 accessToken을 전달하면 아래 순서로 처리됩니다.

1. 카카오 사용자 정보 조회
2. 신규 유저면 가입, 기존 유저면 조회
3. 자체 JWT 발급 후 반환

**테스트 방법**
1. 카카오 로그인으로 발급받은 실제 accessToken이 필요합니다 (자체 발급 불가)
2. 응답으로 받은 accessToken(JWT)을 Swagger 상단 **Authorize** 버튼에 입력
3. 이후 보호된 API(Users, Notifications 등) 테스트 가능
`,
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

  /**
   * @param accessToken 프론트에서 구글 OAuth로 발급받은 accessToken
   * @returns 자체 발급 accessToken, refreshToken
   */
  @Post('google')
  @HttpCode(200)
  @ApiOperation({
    summary: '구글 소셜 로그인',
    description: `
구글 OAuth로 발급받은 accessToken을 전달하면 아래 순서로 처리됩니다.

1. 구글 사용자 정보 조회
2. 신규 유저면 가입, 기존 유저면 조회
3. 자체 JWT 발급 후 반환

**테스트 방법**
1. 구글 로그인으로 발급받은 실제 accessToken이 필요합니다 (자체 발급 불가)
2. 응답으로 받은 accessToken(JWT)을 Swagger 상단 **Authorize** 버튼에 입력
3. 이후 보호된 API(Users, Notifications 등) 테스트 가능
`,
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

  /**
   * @param refreshToken 로그인 시 발급받은 refresh token 원본 값
   * @returns 새로 발급된 accessToken, refreshToken
   */
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'accessToken 재발급',
    description: `
로그인 시 함께 발급된 refreshToken으로 새로운 accessToken을 재발급합니다.
사용된 refreshToken은 즉시 폐기되고 새로운 refreshToken이 함께 발급됩니다 (재사용 방지, rotation).

**테스트 방법**
1. \`/auth/kakao\` 또는 \`/auth/google\` 로그인 응답에서 받은 refreshToken 준비
2. body에 refreshToken을 넣어 호출
3. 응답으로 받은 새 accessToken/refreshToken으로 교체해서 사용
`,
  })
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
