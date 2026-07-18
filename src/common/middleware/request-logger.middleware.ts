import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * 모든 API 요청을 method/path/상태코드/응답시간/IP와 함께 기록한다.
 * 요청 body는 JWT·비밀번호 등 민감정보가 포함될 수 있어 의도적으로 남기지 않는다.
 * pm2가 stdout을 ~/.pm2/logs/backend-out.log로 그대로 저장하므로 별도 저장소는 두지 않는다.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const ip = req.ip ?? req.socket.remoteAddress ?? '-';
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      this.logger.log(
        `${method} ${originalUrl} ${res.statusCode} ${durationMs}ms - ${ip}`,
      );
    });

    next();
  }
}
