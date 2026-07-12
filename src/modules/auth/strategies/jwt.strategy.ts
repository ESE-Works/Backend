import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Authorization: Bearer <JWT> 헤더를 JWT_SECRET으로 검증하는 Passport 전략.
 * JwtAuthGuard가 이 전략을 사용해 요청을 인증한다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  /**
   * 토큰 검증 통과 후 payload를 req.user로 변환한다.
   *
   * @param payload JWT 서명 시 담았던 페이로드 ({ sub: 유저 id })
   * @returns req.user에 주입될 객체 ({ userId })
   */
  validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub };
  }
}
