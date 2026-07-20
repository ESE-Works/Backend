import { ApiOperationOptions } from '@nestjs/swagger';

export const MARKET_CHECK_SWAGGER: Record<'diagnose', ApiOperationOptions> = {
  diagnose: {
    summary: '거래유형+금액+주소 기반 시세 진단',
    description: `
계약서 원문 없이 거래유형/건물유형/금액/지역만으로 국토교통부 실거래가(data.go.kr)와 비교해
입력한 금액이 인근 시세 대비 적정한지 간단히 진단합니다.

**주의사항**
- 등기부등본 조회, 실제 권리관계 분석은 포함하지 않습니다 (무료로 가능한 범위만 지원).
- 최근 3개월 실거래가 중간값과 비교하는 단순 참고용 지표입니다.
- 현재 서울/6대 광역시/세종만 지원합니다 (그 외 지역은 400 에러).

**테스트 방법**
1. 인증 없이 바로 Try it out으로 호출 가능
2. body에 transactionType, propertyType, amount, sido, sigungu 입력 (월세는 monthlyRent도 입력)
`,
  },
};
