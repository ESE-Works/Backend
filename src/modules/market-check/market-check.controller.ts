import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketCheckDto } from './dto/market-check.dto';
import { MarketCheckService } from './market-check.service';
import { MARKET_CHECK_SWAGGER } from './market-check.swagger';

@ApiTags('MarketCheck')
@Controller('market-check')
export class MarketCheckController {
  constructor(private readonly marketCheckService: MarketCheckService) {}

  /**
   * @param dto 거래유형/건물유형/금액/지역
   * @returns 시세 비교 진단 결과
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation(MARKET_CHECK_SWAGGER.diagnose)
  @ApiResponse({ status: 201, description: '시세 진단 결과 반환' })
  @ApiResponse({ status: 400, description: '지원하지 않는 지역' })
  diagnose(@Body() dto: MarketCheckDto) {
    return this.marketCheckService.diagnose(dto);
  }
}
