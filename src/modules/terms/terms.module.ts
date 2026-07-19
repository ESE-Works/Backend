import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermsController } from './terms.controller';
import { PrivacyPolicyController } from './privacy-policy.controller';
import { TermsService } from './terms.service';
import { Term } from './entities/term.entity';
import { UserConsent } from './entities/user-consent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Term, UserConsent])],
  controllers: [TermsController, PrivacyPolicyController],
  providers: [TermsService],
})
export class TermsModule {}
