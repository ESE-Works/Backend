import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { BenefitsController } from './benefits.controller';
import { BenefitsProviderService } from './benefits-provider.service';
import { BenefitsService } from './benefits.service';
import { BenefitsCacheService } from './cache/benefits-cache.service';

@Module({
  imports: [UsersModule],
  controllers: [BenefitsController],
  providers: [BenefitsService, BenefitsProviderService, BenefitsCacheService],
})
export class BenefitsModule {}
