import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TermsService } from './terms.service';
import { renderPrivacyPolicyPage } from './render-privacy-policy';

/**
 * 앱스토어/플레이스토어 등록, 개인정보보호법상 공개 의무 대응용 공개 페이지.
 * Swagger 문서에는 노출하지 않는다 (API가 아니라 사람이 보는 정적 페이지라서).
 */
@ApiExcludeController()
@Controller('privacy-policy')
export class PrivacyPolicyController {
  constructor(private readonly termsService: TermsService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getPage(): Promise<string> {
    const terms = await this.termsService.findLatestTerms();
    return renderPrivacyPolicyPage(terms);
  }
}
