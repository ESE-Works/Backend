import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { resolveRegionName } from '../market-check/lawd-code.const';
import { Benefit } from './interfaces/benefit.interface';

const YOUTH_POLICY_LIST_URL = 'https://www.youthcenter.go.kr/go/ythip/getPlcy';
// 전체 정책이 3천 건 미만이라 페이지네이션 없이 한 번에 전량 조회한다 (10분 캐시로 호출 빈도는 낮음).
const PAGE_SIZE = 5000;

// 실제 응답(2026-07-21 라이브 호출)으로 확인된 필드명.
const TITLE_KEYS = ['plcyNm'];
const DESCRIPTION_KEYS = ['plcyExplnCn'];
const ID_KEYS = ['plcyNo'];
const MIN_AGE_KEYS = ['sprtTrgtMinAge'];
const MAX_AGE_KEYS = ['sprtTrgtMaxAge'];
const APPLY_PERIOD_KEYS = ['aplyYmd'];
const URL_KEYS = ['refUrlAddr1', 'refUrlAddr2'];
const EARN_MIN_KEYS = ['earnMinAmt'];
const EARN_MAX_KEYS = ['earnMaxAmt'];
const EARN_ETC_KEYS = ['earnEtcCn'];
// 단일 지역(법정동코드 1개)만 대상인 정책만 region을 채우고, 그 외(전국/다수 지역)는 null로 둔다.
const ZIP_CODE_KEY = 'zipCd';

/**
 * 온통청년(youthcenter.go.kr) 청년정책 목록조회 API를 감싸는 서비스.
 */
@Injectable()
export class BenefitsProviderService {
  private readonly logger = new Logger(BenefitsProviderService.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchAll(): Promise<Benefit[]> {
    try {
      const { data } = await axios.get<unknown>(YOUTH_POLICY_LIST_URL, {
        params: {
          apiKeyNm: this.configService.get<string>(
            'YOUTH_CENTER_POLICY_API_KEY',
          ),
          pageNum: 1,
          pageSize: PAGE_SIZE,
          rtnType: 'json',
        },
      });

      const items = this.findPolicyItems(data);
      if (items.length === 0) {
        this.logger.warn(
          '온통청년 API 응답에서 정책 목록을 찾지 못했습니다 (응답 구조 확인 필요)',
        );
      }
      return items.map((item) => this.toBenefit(item));
    } catch (error) {
      this.logger.error(`온통청년 API 호출 실패: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * 응답 객체를 재귀 탐색해 정책 항목이 담긴 첫 번째 배열을 찾는다.
   * 최상위 wrapper 키 이름(result.youthPolicyList 등)이 문서와 다를 가능성에 대비한 방어 로직.
   */
  private findPolicyItems(data: unknown, depth = 0): Record<string, unknown>[] {
    if (depth > 4 || data === null || typeof data !== 'object') return [];

    if (Array.isArray(data)) {
      const objectItems = data.filter(
        (v): v is Record<string, unknown> =>
          typeof v === 'object' && v !== null,
      );
      return objectItems.length === data.length ? objectItems : [];
    }

    for (const value of Object.values(data as Record<string, unknown>)) {
      const found = this.findPolicyItems(value, depth + 1);
      if (found.length > 0) return found;
    }
    return [];
  }

  private toBenefit(item: Record<string, unknown>): Benefit {
    const minAge = this.parseNumber(item, MIN_AGE_KEYS);
    const maxAge = this.parseNumber(item, MAX_AGE_KEYS);
    const earnMin = this.parseNumber(item, EARN_MIN_KEYS);
    const earnMax = this.parseNumber(item, EARN_MAX_KEYS);
    const earnEtc = this.pickString(item, EARN_ETC_KEYS);

    return {
      id: this.pickString(item, ID_KEYS) ?? '',
      title: this.pickString(item, TITLE_KEYS) ?? '',
      description: this.pickString(item, DESCRIPTION_KEYS) ?? '',
      region: this.resolveRegion(item),
      minAge,
      maxAge,
      incomeRange: this.buildIncomeRange(earnMin, earnMax, earnEtc),
      applicationDeadline: this.parseDeadline(item),
      url: this.pickString(item, URL_KEYS) ?? '',
      source: 'youthcenter',
    };
  }

  /**
   * zipCd는 콤마로 구분된 법정동코드 목록이다 (예: "11110,11140,...").
   * 전국 대상 정책은 수백 개 코드가 나열되어 하나의 지역명으로 요약할 수 없으므로,
   * 코드가 정확히 1개일 때만 region을 채우고 그 외는 null(전국/다수 지역)로 둔다.
   */
  private resolveRegion(item: Record<string, unknown>): string | null {
    const raw = item[ZIP_CODE_KEY];
    if (typeof raw !== 'string' || raw.trim() === '') return null;

    const codes = raw.split(',').map((c) => c.trim());
    if (codes.length !== 1) return null;

    return resolveRegionName(codes[0]);
  }

  private buildIncomeRange(
    earnMin: number | null,
    earnMax: number | null,
    earnEtc: string | null,
  ): string | null {
    if (earnMin !== null || earnMax !== null) {
      return `${earnMin ?? 0}-${earnMax ?? ''}만원`;
    }
    return earnEtc;
  }

  /**
   * aplyYmd는 "20260101 ~ 20261231" 또는 "상시" 형태로 내려온다고 알려져 있다.
   * 마감일(종료일)만 뽑아 YYYY-MM-DD로 변환하고, 상시/파싱 불가는 null로 둔다.
   */
  private parseDeadline(item: Record<string, unknown>): string | null {
    const raw = this.pickString(item, APPLY_PERIOD_KEYS);
    if (!raw) return null;

    const dates = raw.match(/\d{8}/g);
    if (!dates || dates.length === 0) return null;

    const endDate = dates[dates.length - 1];
    return `${endDate.slice(0, 4)}-${endDate.slice(4, 6)}-${endDate.slice(6, 8)}`;
  }

  private pickString(
    item: Record<string, unknown>,
    candidateKeys: string[],
  ): string | null {
    for (const key of candidateKeys) {
      const raw = item[key];
      if (typeof raw === 'string' && raw.trim() !== '') return raw.trim();
    }
    return null;
  }

  private parseNumber(
    item: Record<string, unknown>,
    candidateKeys: string[],
  ): number | null {
    for (const key of candidateKeys) {
      const raw = item[key];
      if (typeof raw !== 'string' && typeof raw !== 'number') continue;
      const parsed = Number(String(raw).replace(/[,\s]/g, ''));
      if (!Number.isNaN(parsed) && parsed !== 0) return parsed;
    }
    return null;
  }
}
