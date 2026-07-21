import { UsersService } from './../users/users.service';
import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import axios from 'axios';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

const KAKAO_USER_INFO_URL = 'https://kapi.kakao.com/v2/user/me';
const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일
const TEST_LOGIN_PROVIDER_ID = 'judge-test-account';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * refresh token을 SHA-256으로 해시한다.
   * DB에는 이 해시값만 저장하므로, DB가 유출되어도 원본 토큰은 복구할 수 없다.
   *
   * @param token 해시할 원본 refresh token 문자열
   * @returns 64자리 hex 해시값
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * 새 refresh token을 발급한다.
   * 1. 무작위 바이트로 원본 토큰 생성
   * 2. 원본은 클라이언트에 반환하고, 해시값만 DB에 저장 (만료일 포함)
   *
   * @param userId 토큰을 발급할 유저의 id
   * @returns 클라이언트에 내려줄 원본 refresh token
   */
  private async issueRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(64).toString('hex');
    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        user_id: userId,
        token_hash: this.hashToken(token),
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      }),
    );
    return token;
  }

  /**
   * 소셜 로그인 공통 처리: 최초 로그인이면 가입, 이미 가입된 계정이면 조회 후
   * accessToken과 refreshToken을 함께 발급한다.
   *
   * @param provider 소셜 로그인 제공자 ('kakao' | 'google')
   * @param providerId 제공자 쪽 고유 유저 식별자
   * @param nickname 유저 닉네임 (제공자에서 못 가져오면 기본값 '사용자')
   * @param profileImage 프로필 이미지 URL (없을 수 있음)
   * @returns 로그인/가입된 유저의 accessToken, refreshToken
   */
  private async findOrCreateUser(
    provider: string,
    providerId: string,
    nickname: string,
    profileImage: string | undefined,
  ) {
    let user = await this.usersService.findByProviderId(provider, providerId);
    if (!user) {
      user = await this.usersService.create({
        provider,
        provider_id: providerId,
        nickname,
        profile_image_url: profileImage,
      });
    }

    return {
      accessToken: this.jwtService.sign({ sub: user.id }),
      refreshToken: await this.issueRefreshToken(user.id),
    };
  }

  /**
   * refresh token으로 accessToken을 재발급한다.
   * 1. 전달받은 토큰의 해시로 DB에서 조회, 없거나 만료됐으면 401
   * 2. 탈취 후 재사용을 막기 위해 사용한 토큰은 즉시 폐기 (rotation)
   * 3. 새로운 accessToken과 refreshToken을 함께 발급
   *
   * @param refreshToken 로그인 시 발급받은 refresh token 원본 값
   * @returns 새로 발급된 accessToken, refreshToken
   */
  async refreshAccessToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const existing = await this.refreshTokenRepository.findOne({
      where: { token_hash: tokenHash },
    });

    if (!existing || existing.expires_at < new Date()) {
      throw new UnauthorizedException(
        '유효하지 않거나 만료된 refresh token입니다.',
      );
    }

    await this.refreshTokenRepository.delete({ id: existing.id });

    return {
      accessToken: this.jwtService.sign({ sub: existing.user_id }),
      refreshToken: await this.issueRefreshToken(existing.user_id),
    };
  }

  /**
   * 심사위원 등 외부 테스트용 로그인. 소셜 로그인 없이 공유된 비밀키만 맞으면
   * 고정된 테스트 계정으로 로그인 처리한다 (최초 호출 시 계정 자동 생성).
   *
   * @param secretKey 발급자가 심사위원에게 공유한 비밀키
   * @throws UnauthorizedException 비밀키가 설정값과 다르거나, 서버에 비밀키가 설정되지 않은 경우
   */
  async testLogin(secretKey: string) {
    const expected = this.configService.get<string>('ADMIN_LOGIN_SECRET');
    if (!expected || secretKey !== expected) {
      throw new UnauthorizedException('비밀키가 올바르지 않습니다.');
    }

    return this.findOrCreateUser(
      'test',
      TEST_LOGIN_PROVIDER_ID,
      '심사위원 테스트 계정',
      undefined,
    );
  }

  /**
   * 카카오 소셜 로그인.
   * 카카오 accessToken으로 사용자 정보를 조회한 뒤 가입/로그인 처리한다.
   *
   * @param accessToken 프론트에서 카카오 SDK로 발급받은 accessToken
   * @returns 자체 발급 accessToken, refreshToken
   */
  async kakaoLogin(accessToken: string) {
    try {
      const { data } = await axios.get<{
        id: number;
        kakao_account?: {
          profile?: { nickname?: string; profile_image_url?: string };
        };
      }>(KAKAO_USER_INFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return this.findOrCreateUser(
        'kakao',
        String(data.id),
        data.kakao_account?.profile?.nickname ?? '사용자',
        data.kakao_account?.profile?.profile_image_url,
      );
    } catch {
      throw new ServiceUnavailableException(
        '카카오 로그인 처리 중 오류가 발생했습니다.',
      );
    }
  }

  /**
   * 구글 소셜 로그인.
   * 구글 accessToken으로 사용자 정보를 조회한 뒤 가입/로그인 처리한다.
   *
   * @param accessToken 프론트에서 구글 OAuth로 발급받은 accessToken
   * @returns 자체 발급 accessToken, refreshToken
   */
  async googleLogin(accessToken: string) {
    try {
      const { data } = await axios.get<{
        sub: string;
        name?: string;
        picture?: string;
      }>(GOOGLE_USER_INFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return this.findOrCreateUser(
        'google',
        data.sub,
        data.name ?? '사용자',
        data.picture,
      );
    } catch {
      throw new ServiceUnavailableException(
        '구글 로그인 처리 중 오류가 발생했습니다.',
      );
    }
  }
}
