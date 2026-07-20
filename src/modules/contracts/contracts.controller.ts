import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyzeTextDto } from './dto/analyze-text.dto';
import { AnalyzeSpecialTermsDto } from './dto/analyze-special-terms.dto';
import { ContractsService } from './contracts.service';
import { CONTRACTS_SWAGGER } from './contracts.swagger';
import { InputSource } from './analysis/analysis.types';

const IMAGE_INPUT_SOURCES: InputSource[] = [
  'image_camera',
  'image_gallery',
  'image_file',
];
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

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
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @param file 업로드된 계약서 사진 (jpeg/png/webp, 최대 10MB)
   * @param source 사진 획득 경로 (image_camera | image_gallery | image_file, 기본값 image_file)
   * @returns 저장된 계약 레코드 (analysis_result 포함)
   */
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation(CONTRACTS_SWAGGER.analyzeImage)
  @ApiResponse({
    status: 201,
    description: '분석 결과가 저장된 계약 레코드 반환',
  })
  @ApiResponse({
    status: 400,
    description: '이미지 형식/크기 오류이거나 주거용 임대차 계약서가 아님',
  })
  @ApiResponse({
    status: 503,
    description: 'AI 응답 파싱 실패 (AI_PARSE_FAILED)',
  })
  analyzeImage(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('source') source?: string,
  ) {
    if (!file) {
      throw new BadRequestException('이미지 파일이 없습니다.');
    }
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'jpeg, png, webp 형식의 이미지만 업로드할 수 있습니다.',
      );
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException('이미지 크기는 10MB를 초과할 수 없습니다.');
    }

    const inputSource = IMAGE_INPUT_SOURCES.includes(source as InputSource)
      ? (source as InputSource)
      : 'image_file';

    return this.contractsService.analyzeImageAndSave(
      req.user.userId,
      file.buffer,
      file.mimetype,
      inputSource,
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
