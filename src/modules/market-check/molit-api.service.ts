import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  MarketPropertyType,
  MarketTransactionType,
} from './dto/market-check.dto';

const BASE_URL = 'http://apis.data.go.kr/1613000';

/**
 * (건물유형, 거래유형) → data.go.kr 서비스/오퍼레이션 이름.
 * 매매는 XxxTrade, 전월세는 XxxRent 계열 API를 사용한다.
 */
const OPERATION_TABLE: Record<
  MarketPropertyType,
  Record<'trade' | 'rent', string>
> = {
  apartment: {
    trade: 'RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade',
    rent: 'RTMSDataSvcAptRent/getRTMSDataSvcAptRent',
  },
  officetel: {
    trade: 'RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade',
    rent: 'RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent',
  },
  villa: {
    trade: 'RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade',
    rent: 'RTMSDataSvcRHRent/getRTMSDataSvcRHRent',
  },
};

// 거래금액(매매) / 보증금액(전월세)에 해당하는 응답 필드 후보 (데이터셋 버전에 따라 다를 수 있어 여러 개를 시도한다)
const TRADE_AMOUNT_KEYS = ['거래금액', 'dealAmount'];
const DEPOSIT_AMOUNT_KEYS = ['보증금액', 'deposit', '보증금'];
const MONTHLY_RENT_KEYS = ['월세금액', 'monthlyRent', '월세'];

export interface MolitTradeItem {
  amount: number;
  monthlyRent: number | null;
}

interface MolitApiResponse {
  response?: {
    body?: {
      items?: {
        item?: Record<string, unknown> | Record<string, unknown>[];
      };
    };
  };
}

@Injectable()
export class MolitApiService {
  private readonly logger = new Logger(MolitApiService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 최근 3개월(이번 달 포함) 실거래가 목록을 조회해 거래금액(또는 보증금/월세)만 추출한다.
   * data.go.kr 응답 필드명이 데이터셋별로 조금씩 달라, 여러 후보 키를 순서대로 시도한다.
   *
   * @param propertyType 건물유형
   * @param transactionType 거래유형 (sale이면 매매 API, 그 외는 전월세 API)
   * @param lawdCd 법정동코드 앞 5자리
   */
  async fetchRecentTransactions(
    propertyType: MarketPropertyType,
    transactionType: MarketTransactionType,
    lawdCd: string,
  ): Promise<MolitTradeItem[]> {
    const operation =
      OPERATION_TABLE[propertyType][
        transactionType === 'sale' ? 'trade' : 'rent'
      ];
    const dealYmds = this.recentDealYmds(3);

    const results = await Promise.all(
      dealYmds.map((dealYmd) =>
        this.fetchOneMonth(operation, lawdCd, dealYmd, transactionType),
      ),
    );
    return results.flat();
  }

  private async fetchOneMonth(
    operation: string,
    lawdCd: string,
    dealYmd: string,
    transactionType: MarketTransactionType,
  ): Promise<MolitTradeItem[]> {
    try {
      const { data } = await axios.get<MolitApiResponse>(
        `${BASE_URL}/${operation}`,
        {
          params: {
            serviceKey: this.configService.get<string>('DATA_GO_KR_API_KEY'),
            LAWD_CD: lawdCd,
            DEAL_YMD: dealYmd,
            numOfRows: 1000,
            pageNo: 1,
            _type: 'json',
          },
        },
      );

      const rawItems = data?.response?.body?.items?.item;
      if (!rawItems) return [];
      const items = Array.isArray(rawItems) ? rawItems : [rawItems];

      return items
        .map((item) => this.extractTradeItem(item, transactionType))
        .filter((item): item is MolitTradeItem => item !== null)
        .filter((item) => this.matchesTransactionType(item, transactionType));
    } catch (error) {
      this.logger.warn(
        `국토부 실거래가 조회 실패 (${operation}, ${lawdCd}, ${dealYmd}): ${(error as Error).message}`,
      );
      return [];
    }
  }

  private extractTradeItem(
    item: Record<string, unknown>,
    transactionType: MarketTransactionType,
  ): MolitTradeItem | null {
    const amount =
      transactionType === 'sale'
        ? this.parseAmount(item, TRADE_AMOUNT_KEYS)
        : this.parseAmount(item, DEPOSIT_AMOUNT_KEYS);
    if (amount === null) return null;

    // 전월세 API는 전세/월세 매물이 함께 내려오므로, 거래유형과 무관하게 항상 월세 필드를 읽어둔다
    // (0 또는 필드 없음 = 전세, 0보다 큼 = 월세로 판단해 이후 matchesTransactionType에서 걸러낸다).
    const monthlyRent =
      transactionType === 'sale' ? null : this.parseAmount(item, MONTHLY_RENT_KEYS);

    return { amount, monthlyRent };
  }

  /**
   * 전월세 API 응답에는 전세/월세 매물이 섞여 있어, 요청한 거래유형과 일치하는 것만 남긴다.
   * jeonse: 월세금액이 없거나 0인 매물만 / monthly: 월세금액이 0보다 큰 매물만.
   */
  private matchesTransactionType(
    item: MolitTradeItem,
    transactionType: MarketTransactionType,
  ): boolean {
    if (transactionType === 'sale') return true;
    const isMonthly = (item.monthlyRent ?? 0) > 0;
    return transactionType === 'monthly' ? isMonthly : !isMonthly;
  }

  private parseAmount(
    item: Record<string, unknown>,
    candidateKeys: string[],
  ): number | null {
    for (const key of candidateKeys) {
      const raw = item[key];
      if (typeof raw !== 'string' && typeof raw !== 'number') continue;
      const parsed = Number(String(raw).replace(/[,\s]/g, ''));
      if (!Number.isNaN(parsed)) return parsed;
    }
    return null;
  }

  /**
   * @returns 이번 달부터 과거로 count개월치 YYYYMM 목록
   */
  private recentDealYmds(count: number): string[] {
    const now = new Date();
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}${month}`;
    });
  }
}
