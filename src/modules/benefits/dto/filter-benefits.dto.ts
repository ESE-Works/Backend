import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterBenefitsDto {
  @ApiPropertyOptional({
    description: '거주 지역으로 필터링',
    example: '서울시',
  })
  region?: string;

  @ApiPropertyOptional({
    description: '나이로 필터링 (해당 나이가 대상 범위에 포함되는 혜택만)',
    example: 28,
  })
  age?: number;

  @ApiPropertyOptional({
    description: '소득 구간으로 필터링',
    example: '3000-4000만원',
  })
  incomeRange?: string;
}
