import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteProfileDto {
  @ApiPropertyOptional({ description: '거주 지역', example: '서울시 강남구' })
  region?: string;

  @ApiPropertyOptional({ description: '나이', example: 28 })
  age?: number;

  @ApiPropertyOptional({ description: '소득 구간', example: '3000-4000만원' })
  income_range?: string;
}
