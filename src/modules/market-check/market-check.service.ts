import { BadRequestException, Injectable } from '@nestjs/common';
import { MarketCheckDto } from './dto/market-check.dto';
import { resolveLawdCode } from './lawd-code.const';
import { MolitApiService } from './molit-api.service';

const WARNING_THRESHOLD_PERCENT = 20;

export interface MarketCheckResult {
  available: boolean;
  sampleCount: number;
  marketMedianAmount: number | null;
  marketMedianMonthlyRent: number | null;
  diffPercent: number | null;
  riskLevel: 'safe' | 'warning' | 'unknown';
  message: string;
}

@Injectable()
export class MarketCheckService {
  constructor(private readonly molitApiService: MolitApiService) {}

  /**
   * 거래유형+금액+주소(시/도, 시/군/구)만으로 국토교통부 실거래가와 비교해
   * 입력한 금액이 인근 시세 대비 적정한지 진단한다.
   * 등기부등본 조회 등은 포함하지 않는다 (무료로 가능한 범위만 지원).
   *
   * @param dto 거래유형/건물유형/금액/지역
   * @throws BadRequestException 지원하지 않는 지역인 경우
   */
  async diagnose(dto: MarketCheckDto): Promise<MarketCheckResult> {
    const lawdCd = resolveLawdCode(dto.sido, dto.sigungu);
    if (!lawdCd) {
      throw new BadRequestException(
        '아직 지원하지 않는 지역입니다 (서울/광역시/세종만 지원).',
      );
    }

    const transactions = await this.molitApiService.fetchRecentTransactions(
      dto.propertyType,
      dto.transactionType,
      lawdCd,
    );

    if (transactions.length === 0) {
      return {
        available: false,
        sampleCount: 0,
        marketMedianAmount: null,
        marketMedianMonthlyRent: null,
        diffPercent: null,
        riskLevel: 'unknown',
        message:
          '최근 3개월간 해당 지역의 실거래가 데이터가 없어 시세 비교가 불가능합니다.',
      };
    }

    const marketMedianAmount = this.median(transactions.map((t) => t.amount));
    const diffPercent = this.percentDiff(dto.amount, marketMedianAmount);

    let marketMedianMonthlyRent: number | null = null;
    let monthlyRentDiffPercent: number | null = null;
    if (dto.transactionType === 'monthly' && dto.monthlyRent !== undefined) {
      const monthlyRents = transactions
        .map((t) => t.monthlyRent)
        .filter((v): v is number => v !== null);
      if (monthlyRents.length > 0) {
        marketMedianMonthlyRent = this.median(monthlyRents);
        monthlyRentDiffPercent = this.percentDiff(
          dto.monthlyRent,
          marketMedianMonthlyRent,
        );
      }
    }

    const worstDiffPercent = Math.max(
      diffPercent,
      monthlyRentDiffPercent ?? -Infinity,
    );
    const riskLevel =
      worstDiffPercent >= WARNING_THRESHOLD_PERCENT ? 'warning' : 'safe';

    return {
      available: true,
      sampleCount: transactions.length,
      marketMedianAmount,
      marketMedianMonthlyRent,
      diffPercent,
      riskLevel,
      message: this.buildMessage(riskLevel, diffPercent),
    };
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  }

  private percentDiff(userAmount: number, marketAmount: number): number {
    if (marketAmount === 0) return 0;
    return Math.round(((userAmount - marketAmount) / marketAmount) * 1000) / 10;
  }

  private buildMessage(
    riskLevel: 'safe' | 'warning' | 'unknown',
    diffPercent: number,
  ): string {
    if (riskLevel === 'warning') {
      return `인근 실거래가 중간값보다 ${diffPercent}% 높습니다. 시세 대비 과도하게 책정된 것은 아닌지 확인이 필요합니다.`;
    }
    return `인근 실거래가 중간값과 비교했을 때 (${diffPercent >= 0 ? '+' : ''}${diffPercent}%) 특별히 이상한 수준은 아닙니다.`;
  }
}
