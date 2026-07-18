import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BenefitsService } from './benefits.service';
import { FilterBenefitsDto } from './dto/filter-benefits.dto';
import { BENEFITS_SWAGGER } from './benefits.swagger';

@ApiTags('Benefits')
@Controller('benefits')
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  /**
   * @param filter 쿼리 파라미터로 전달되는 region/age/incomeRange 필터
   * @returns 조건에 맞는 청년 지원 혜택 목록
   */
  @Get()
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'age', required: false, type: Number })
  @ApiQuery({ name: 'incomeRange', required: false })
  @ApiOperation(BENEFITS_SWAGGER.findAll)
  @ApiResponse({ status: 200, description: '조건에 맞는 혜택 목록 반환' })
  findAll(@Query() filter: FilterBenefitsDto) {
    return this.benefitsService.findAll(filter);
  }

  /**
   * @param req 인증된 요청 (req.user.userId는 JwtStrategy가 주입)
   * @returns 로그인한 유저의 프로필(region/age/income_range)에 맞는 추천 혜택 목록
   */
  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(BENEFITS_SWAGGER.findRecommended)
  @ApiResponse({
    status: 200,
    description: '유저 프로필에 맞는 추천 혜택 목록 반환',
  })
  findRecommended(@Request() req) {
    return this.benefitsService.findRecommendedForUser(req.user.userId);
  }

  /**
   * @param id 조회할 혜택 id
   * @returns 혜택 상세 정보 (마감기한 포함)
   */
  @Get(':id')
  @ApiOperation(BENEFITS_SWAGGER.findOne)
  @ApiResponse({ status: 200, description: '혜택 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '존재하지 않는 혜택 id' })
  findOne(@Param('id') id: string) {
    return this.benefitsService.findOne(id);
  }
}
