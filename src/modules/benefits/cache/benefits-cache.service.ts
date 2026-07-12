import { Injectable } from '@nestjs/common';

/**
 * 외부 API 호출 결과를 짧게 메모리에 캐싱한다.
 * 혜택 데이터는 자주 바뀌지 않으므로, 매 요청마다 외부 API를 호출하지 않도록
 * TTL 동안은 이전 결과를 재사용한다.
 */
const TTL_MS = 10 * 60 * 1000; // 10분

@Injectable()
export class BenefitsCacheService {
  private cache: { value: unknown; expiresAt: number } | null = null;

  /**
   * 캐시가 유효하면 캐시된 값을, 만료됐거나 없으면 fetcher를 호출해 새로 채운 값을 반환한다.
   *
   * @param fetcher 캐시 미스 시 실제 데이터를 가져올 함수
   */
  async getOrFetch<T>(fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.value as T;
    }

    const value = await fetcher();
    this.cache = { value, expiresAt: now + TTL_MS };
    return value;
  }
}
