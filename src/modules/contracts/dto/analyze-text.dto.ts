import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeTextDto {
  @ApiProperty({
    description: '계약서 전체 원문 (카카오톡/이메일 등에서 복사한 텍스트)',
    example:
      '임대인 홍길동과 임차인 김청년은 다음과 같이 임대차 계약을 체결한다...',
  })
  text: string;
}
