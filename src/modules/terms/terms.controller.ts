import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TermsService } from './terms.service';
import { SubmitConsentsDto } from './dto/submit-consents.dto';
import { TERMS_SWAGGER } from './terms.swagger';

@ApiTags('Terms')
@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  /**
   * @returns 약관 종류별 최신 버전 목록
   */
  @Get()
  @ApiOperation(TERMS_SWAGGER.findLatest)
  @ApiResponse({ status: 200, description: '약관 종류별 최신 버전 목록 반환' })
  findLatest() {
    return this.termsService.findLatestTerms();
  }

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @param dto 항목별 동의 목록
   * @returns 저장된 동의 이력
   */
  @Post('consents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(TERMS_SWAGGER.submitConsents)
  @ApiResponse({ status: 201, description: '저장된 동의 이력 반환' })
  @ApiResponse({ status: 400, description: '필수 약관 미동의' })
  submitConsents(@Request() req, @Body() dto: SubmitConsentsDto) {
    const ipAddress = (req.ip as string | undefined) ?? null;
    return this.termsService.submitConsents(
      req.user.userId,
      dto.consents,
      ipAddress,
    );
  }

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @returns 해당 유저의 전체 동의 이력 (최신순)
   */
  @Get('consents/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(TERMS_SWAGGER.myConsents)
  @ApiResponse({ status: 200, description: '동의 이력 목록 반환' })
  myConsents(@Request() req) {
    return this.termsService.findConsentHistory(req.user.userId);
  }
}
