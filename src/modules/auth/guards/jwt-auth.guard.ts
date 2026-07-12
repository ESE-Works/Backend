import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Authorization 헤더의 Bearer JWT를 JwtStrategy로 검증하는 가드.
 * 보호된 엔드포인트에 @UseGuards(JwtAuthGuard)로 적용한다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
