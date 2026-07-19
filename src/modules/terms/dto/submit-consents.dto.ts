import { ApiProperty } from '@nestjs/swagger';
import { TermType } from '../term-type.enum';

export class ConsentItemDto {
  @ApiProperty({ enum: TermType, description: '동의할 약관 종류' })
  termType: TermType;

  @ApiProperty({
    description: '동의한 약관 버전 (GET /terms 응답의 version 값)',
  })
  version: string;

  @ApiProperty({ description: '동의 여부 (선택 항목은 false도 가능)' })
  agreed: boolean;
}

export class SubmitConsentsDto {
  @ApiProperty({ type: [ConsentItemDto], description: '항목별 동의 목록' })
  consents: ConsentItemDto[];
}
