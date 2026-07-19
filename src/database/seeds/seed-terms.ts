import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Term } from '../../modules/terms/entities/term.entity';
import { UserConsent } from '../../modules/terms/entities/user-consent.entity';
import { TermType } from '../../modules/terms/term-type.enum';

/**
 * 약관 시드 데이터.
 * 개인정보보호위원회 「표준 개인정보 보호지침」의 조항 구성(제N조 형식)을 참고해 작성한 초안이며,
 * 개인 서비스 단계에서 사용하는 임시 문구다. 실제 사용자를 받기 시작하기 전에는
 * 반드시 변호사 등 법률 전문가의 검토를 받아야 한다.
 * 문구가 개정되면 version을 올려서(1.0 → 1.1) 다시 실행 — 기존 이력은 건드리지 않고 새 버전만 추가된다.
 */
const SEED_TERMS: Array<Omit<Term, 'id' | 'created_at'>> = [
  {
    type: TermType.PRIVACY_REQUIRED,
    version: '1.0',
    title: '개인정보 수집·이용 동의 (필수)',
    content: `제1조 (수집 목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다.
1. 회원 가입 및 본인 확인 (소셜 로그인)
2. 임대차 계약서 분석 서비스 제공
3. 청년 지원 혜택 추천
4. 서비스 관련 문의 응대 및 공지사항 전달

제2조 (수집 항목)
1. 소셜 로그인 정보: 닉네임, 프로필 사진, 로그인 제공자(카카오/구글) 및 제공자 식별값
2. 회원가입 추가정보: 거주지역, 나이, 소득구간
3. 서비스 이용 중 입력하는 계약서 원문 (임대인·임차인 성명, 부동산 주소, 보증금·월세 등이 포함될 수 있음)

제3조 (보유 및 이용 기간)
회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에 따라 보존이
필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.

제4조 (동의 거부 권리 및 불이익)
귀하는 본 동의를 거부할 권리가 있습니다. 다만 필수 항목에 동의하지 않을 경우
회원가입 및 서비스 이용이 제한됩니다.`,
    is_required: true,
    effective_date: new Date().toISOString().slice(0, 10),
  },
  {
    type: TermType.PRIVACY_OPTIONAL,
    version: '1.0',
    title: '수집·이용 동의 (선택 항목)',
    content: `제1조 (수집 목적)
서비스 이용 품질 개선 및 통계 분석을 위하여 개인정보를 처리합니다.

제2조 (수집 항목)
서비스 이용 기록 (접속 로그, 이용 빈도, 기능별 사용 패턴)

제3조 (보유 및 이용 기간)
회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다.

제4조 (동의 거부 권리 및 불이익)
본 항목은 선택 사항으로, 동의하지 않으셔도 서비스 이용에 제한이 없습니다.`,
    is_required: false,
    effective_date: new Date().toISOString().slice(0, 10),
  },
  {
    type: TermType.UNIQUE_ID,
    version: '1.0',
    title: '고유식별정보 처리 동의',
    content: `제1조 (처리 목적)
이용자가 계약서 분석을 위해 입력하는 계약서 원문에 주민등록번호 등 고유식별정보가
포함될 수 있으며, 계약서 위험 조항 분석을 위해 원문 그대로 처리합니다.
(회사는 고유식별정보를 별도로 수집·요구하지 않으며, 이용자가 입력하는 원문에
포함될 수 있는 경우에 한해 처리합니다.)

제2조 (처리 항목)
계약서 원문에 포함된 주민등록번호 등 고유식별정보

제3조 (보유 및 이용 기간)
분석 완료 후 별도 요청이 없는 한 회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다.

제4조 (동의 거부 권리 및 불이익)
동의하지 않을 경우 계약서 분석 서비스 이용이 제한될 수 있습니다.`,
    is_required: true,
    effective_date: new Date().toISOString().slice(0, 10),
  },
  {
    type: TermType.THIRD_PARTY,
    version: '1.0',
    title: '제3자 제공 및 처리위탁 동의',
    content: `제1조 (처리위탁 받는 자 및 위탁 업무 내용)
1. OpenAI, L.L.C. (미국) — 계약서 텍스트 AI 분석
2. Google LLC / Firebase (미국) — 푸시 알림(FCM) 발송
3. Supabase Inc. (해외 리전) — 데이터베이스 호스팅
4. Google Cloud Platform (미국/해외 리전) — 서버 인프라 호스팅

제2조 (이전되는 개인정보 항목)
각 위탁 업무 수행에 필요한 최소한의 정보 (계약서 원문 일부, 디바이스 토큰,
회원 식별 정보 등)

제3조 (이전되는 국가, 이전 일시 및 방법)
위 각 업체의 서버가 위치한 국가로, 서비스 이용 시점에 네트워크를 통해 전송됩니다.

제4조 (이전받는 자의 개인정보 보유·이용 기간)
위탁 업무 수행 목적 달성 시 또는 위탁 계약 종료 시까지

제5조 (동의 거부 권리 및 불이익)
동의하지 않을 경우 계약서 분석, 푸시 알림 등 해당 기능 이용이 제한됩니다.`,
    is_required: true,
    effective_date: new Date().toISOString().slice(0, 10),
  },
  {
    type: TermType.MARKETING,
    version: '1.0',
    title: '마케팅 정보 수신 동의 (선택)',
    content: `제1조 (수집 목적)
이벤트, 혜택, 서비스 소식 등 마케팅 정보 안내

제2조 (수집 항목)
연락처(이메일/전화번호 수집 시), 푸시 알림 토큰

제3조 (보유 및 이용 기간)
동의 철회 시 또는 회원 탈퇴 시까지

제4조 (동의 거부 권리 및 불이익)
본 항목은 선택 사항으로, 동의하지 않거나 철회하셔도 서비스 이용에 제한이 없습니다.
철회는 앱 설정 화면에서 언제든 가능합니다.`,
    is_required: false,
    effective_date: new Date().toISOString().slice(0, 10),
  },
];

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Term, UserConsent],
    ssl: { rejectUnauthorized: false },
  });
  await dataSource.initialize();

  const repository = dataSource.getRepository(Term);
  let inserted = 0;
  let skipped = 0;

  for (const seed of SEED_TERMS) {
    const existing = await repository.findOne({
      where: { type: seed.type, version: seed.version },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await repository.save(repository.create(seed));
    inserted++;
  }

  console.log(
    `약관 시드 완료 — 추가: ${inserted}개, 이미 있어서 건너뜀: ${skipped}개`,
  );
  await dataSource.destroy();
}

main().catch((error) => {
  console.error('약관 시드 실패:', error);
  process.exit(1);
});
