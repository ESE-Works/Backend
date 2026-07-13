import {
  Body,
  Controller,
  Get,
  Param,
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
import { AnalyzeTextDto } from './dto/analyze-text.dto';
import { AnalyzeSpecialTermsDto } from './dto/analyze-special-terms.dto';
import { ContractsService } from './contracts.service';
import { CONTRACTS_SWAGGER } from './contracts.swagger';

@ApiTags('Contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @param dto 분석할 계약서 전체 원문
   * @returns 저장된 계약 레코드 (analysis_result 포함)
   */
  @Post('text')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(CONTRACTS_SWAGGER.analyzeText)
  @ApiResponse({
    status: 201,
    description: '분석 결과가 저장된 계약 레코드 반환',
  })
  @ApiResponse({
    status: 400,
    description: '주거용 임대차 계약서가 아님 (NOT_CONTRACT)',
  })
  @ApiResponse({
    status: 503,
    description: 'AI 응답 파싱 실패 (AI_PARSE_FAILED)',
  })
  analyzeText(@Request() req, @Body() dto: AnalyzeTextDto) {
    return this.contractsService.analyzeAndSave(
      req.user.userId,
      dto.text,
      'text_paste',
    );
  }

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @param dto 분석할 특약 조항 텍스트
   * @returns 저장된 계약 레코드 (analysis_result 포함)
   */
  @Post('special-terms')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(CONTRACTS_SWAGGER.analyzeSpecialTerms)
  @ApiResponse({
    status: 201,
    description: '분석 결과가 저장된 계약 레코드 반환',
  })
  @ApiResponse({
    status: 503,
    description: 'AI 응답 파싱 실패 (AI_PARSE_FAILED)',
  })
  analyzeSpecialTerms(@Request() req, @Body() dto: AnalyzeSpecialTermsDto) {
    return this.contractsService.analyzeAndSave(
      req.user.userId,
      dto.text,
      'text_special_terms',
    );
  }

  /**
   * @returns 캐싱된 샘플 분석 결과 (GPT 호출 없음)
   */
  @Get('sample')
  @ApiOperation(CONTRACTS_SWAGGER.sample)
  @ApiResponse({ status: 200, description: '샘플 분석 결과 반환' })
  getSample() {
    return this.contractsService.getSampleAnalysis();
  }

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @returns 해당 유저의 계약 분석 이력 (최신순)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(CONTRACTS_SWAGGER.findAll)
  @ApiResponse({ status: 200, description: '계약 분석 이력 목록 반환' })
  findAll(@Request() req) {
    return this.contractsService.findAllForUser(req.user.userId);
  }

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @param id 조회할 계약 id
   * @returns 계약 분석 결과
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(CONTRACTS_SWAGGER.findOne)
  @ApiResponse({ status: 200, description: '계약 분석 결과 반환' })
  @ApiResponse({
    status: 404,
    description: '본인 소유가 아니거나 존재하지 않음',
  })
  findOne(@Request() req, @Param('id') id: string) {
    return this.contractsService.findByIdForUser(id, req.user.userId);
  }
}
