/**
 * 약관/동의 종류.
 * PRIVACY_REQUIRED / UNIQUE_ID / THIRD_PARTY는 필수 동의,
 * PRIVACY_OPTIONAL / MARKETING은 선택 동의로 운영한다 (각 Term.is_required로 실제 여부 관리).
 */
export enum TermType {
  PRIVACY_REQUIRED = 'PRIVACY_REQUIRED', // 개인정보 수집·이용 동의 (필수)
  PRIVACY_OPTIONAL = 'PRIVACY_OPTIONAL', // 수집·이용 동의 (선택 항목)
  UNIQUE_ID = 'UNIQUE_ID', // 고유식별정보 처리 동의
  THIRD_PARTY = 'THIRD_PARTY', // 제3자 제공 및 처리위탁 동의 (국외이전 포함)
  MARKETING = 'MARKETING', // 마케팅 정보 수신 동의 (선택)
}
