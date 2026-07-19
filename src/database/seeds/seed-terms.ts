import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Term } from '../../modules/terms/entities/term.entity';
import { UserConsent } from '../../modules/terms/entities/user-consent.entity';
import { TermType } from '../../modules/terms/term-type.enum';

/**
 * 약관 시드 데이터.
 * content는 아직 placeholder — 법무 검토가 끝나면 실제 문구로 교체하고
 * version을 올려서(v1 → v2) 다시 실행하면 기존 이력을 건드리지 않고 새 버전이 추가된다.
 */
const SEED_TERMS: Array<Omit<Term, 'id' | 'created_at'>> = [
  {
    type: TermType.PRIVACY_REQUIRED,
    version: 'v1',
    title: '개인정보 수집·이용 동의 (필수)',
    content: 'TODO: 법무 검토 완료된 문구로 교체',
    is_required: true,
    effective_date: new Date().toISOString().slice(0, 10),
  },
  {
    type: TermType.PRIVACY_OPTIONAL,
    version: 'v1',
    title: '수집·이용 동의 (선택 항목)',
    content: 'TODO: 법무 검토 완료된 문구로 교체',
    is_required: false,
    effective_date: new Date().toISOString().slice(0, 10),
  },
  {
    type: TermType.UNIQUE_ID,
    version: 'v1',
    title: '고유식별정보 처리 동의',
    content: 'TODO: 법무 검토 완료된 문구로 교체',
    is_required: true,
    effective_date: new Date().toISOString().slice(0, 10),
  },
  {
    type: TermType.THIRD_PARTY,
    version: 'v1',
    title: '제3자 제공 및 처리위탁 동의',
    content: 'TODO: 법무 검토 완료된 문구로 교체',
    is_required: true,
    effective_date: new Date().toISOString().slice(0, 10),
  },
  {
    type: TermType.MARKETING,
    version: 'v1',
    title: '마케팅 정보 수신 동의 (선택)',
    content: 'TODO: 법무 검토 완료된 문구로 교체',
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

  console.log(`약관 시드 완료 — 추가: ${inserted}개, 이미 있어서 건너뜀: ${skipped}개`);
  await dataSource.destroy();
}

main().catch((error) => {
  console.error('약관 시드 실패:', error);
  process.exit(1);
});
