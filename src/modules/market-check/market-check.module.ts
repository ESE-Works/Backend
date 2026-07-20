import { Module } from '@nestjs/common';
import { MarketCheckController } from './market-check.controller';
import { MarketCheckService } from './market-check.service';
import { MolitApiService } from './molit-api.service';

@Module({
  controllers: [MarketCheckController],
  providers: [MarketCheckService, MolitApiService],
})
export class MarketCheckModule {}
