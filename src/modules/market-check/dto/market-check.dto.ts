import { ApiProperty } from '@nestjs/swagger';

export type MarketPropertyType = 'apartment' | 'officetel' | 'villa';
export type MarketTransactionType = 'sale' | 'jeonse' | 'monthly';

export class MarketCheckDto {
  @ApiProperty({
    description: '거래유형',
    enum: ['sale', 'jeonse', 'monthly'],
    example: 'jeonse',
  })
  transactionType: MarketTransactionType;

  @ApiProperty({
    description: '건물유형',
    enum: ['apartment', 'officetel', 'villa'],
    example: 'apartment',
  })
  propertyType: MarketPropertyType;

  @ApiProperty({
    description:
      '보증금 또는 매매가 (만원 단위). 월세(monthly)인 경우 보증금을 입력',
    example: 25000,
  })
  amount: number;

  @ApiProperty({
    description: '월세 (만원 단위, transactionType이 monthly일 때만 사용)',
    example: 50,
    required: false,
  })
  monthlyRent?: number;

  @ApiProperty({ description: '시/도', example: '서울특별시' })
  sido: string;

  @ApiProperty({ description: '시/군/구', example: '관악구' })
  sigungu: string;
}
