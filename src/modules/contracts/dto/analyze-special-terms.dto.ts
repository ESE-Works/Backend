import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeSpecialTermsDto {
  @ApiProperty({
    description: '확인하고 싶은 특약 조항 (여러 개면 줄바꿈으로 구분)',
    example: '원상복구 비용은 임차인이 전액 부담한다.',
  })
  text: string;
}
