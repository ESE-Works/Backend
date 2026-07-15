import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

/**
 * 만료된 refresh token을 주기적으로 정리한다.
 * refresh token은 재발급 시 rotation으로 계속 새로 쌓이기만 하고,
 * 만료된 뒤에는 아무도 지우지 않아 테이블이 무한히 커지는 문제를 방지한다.
 */
@Injectable()
export class RefreshTokenCleanupService {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens(): Promise<void> {
    const result = await this.refreshTokenRepository.delete({
      expires_at: LessThan(new Date()),
    });
    if (result.affected) {
      this.logger.log(`만료된 refresh token ${result.affected}개 삭제`);
    }
  }
}
