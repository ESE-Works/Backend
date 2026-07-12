import { Injectable } from '@nestjs/common';
import { Benefit } from './interfaces/benefit.interface';

/**
 * 청년 지원 혜택 데이터의 실제 출처(외부 API)를 감싸는 서비스.
 *
 * TODO: 연동할 외부 API(예: 온통청년 공공데이터 API)가 확정되면
 * fetchAll()의 mock 데이터를 실제 HTTP 호출로 교체한다.
 * 반환 타입(Benefit[])만 유지하면 BenefitsService 이하 로직은 변경할 필요 없다.
 */
@Injectable()
export class BenefitsProviderService {
  fetchAll(): Promise<Benefit[]> {
    return Promise.resolve(MOCK_BENEFITS);
  }
}

const MOCK_BENEFITS: Benefit[] = [
  {
    id: 'mock-1',
    title: '청년 월세 지원 (예시)',
    description:
      '무주택 청년의 월세 부담을 완화하기 위한 지원 제도 (mock 데이터)',
    region: '서울시',
    minAge: 19,
    maxAge: 34,
    incomeRange: null,
    url: 'https://example.com/benefits/mock-1',
    source: 'mock',
  },
  {
    id: 'mock-2',
    title: '청년 도약계좌 (예시)',
    description: '청년의 자산 형성을 지원하는 정책성 금융상품 (mock 데이터)',
    region: null,
    minAge: 19,
    maxAge: 34,
    incomeRange: '3000-4000만원',
    url: 'https://example.com/benefits/mock-2',
    source: 'mock',
  },
  {
    id: 'mock-3',
    title: '청년 전세자금대출 (예시)',
    description: '청년 무주택 세대주를 위한 저금리 전세자금대출 (mock 데이터)',
    region: null,
    minAge: 19,
    maxAge: 39,
    incomeRange: null,
    url: 'https://example.com/benefits/mock-3',
    source: 'mock',
  },
];
