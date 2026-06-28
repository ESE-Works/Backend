import { UsersService } from './../users/users.service';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

const KAKAO_USER_INFO_URL = 'https://kapi.kakao.com/v2/user/me';
const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
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
    return { accessToken: this.jwtService.sign({ sub: user.id }) };
  }

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
