import { Term } from './entities/term.entity';
import { TermType } from './term-type.enum';

const SECTION_ORDER: TermType[] = [
  TermType.PRIVACY_REQUIRED,
  TermType.PRIVACY_OPTIONAL,
  TermType.UNIQUE_ID,
  TermType.THIRD_PARTY,
  TermType.MARKETING,
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 최신 약관 목록(타입별 1개씩)을 하나의 공개 개인정보처리방침 HTML 페이지로 렌더링한다.
 * 앱스토어/플레이스토어 등록, 개인정보보호법상 공개 의무 대응용 정적 페이지로 사용한다.
 *
 * @param terms TermsService.findLatestTerms()의 결과
 */
export function renderPrivacyPolicyPage(terms: Term[]): string {
  const byType = new Map(terms.map((term) => [term.type, term]));
  const orderedTerms = SECTION_ORDER.map((type) => byType.get(type)).filter(
    (term): term is Term => term !== undefined,
  );

  const sections = orderedTerms
    .map(
      (term) => `
    <section>
      <h2>${escapeHtml(term.title)}</h2>
      <p class="meta">시행일 ${escapeHtml(term.effective_date)}${term.is_required ? '' : ' · 선택 항목'}</p>
      <div class="content">${escapeHtml(term.content).replace(/\n/g, '<br />')}</div>
    </section>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>개인정보처리방침</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #222; }
    h1 { font-size: 1.5rem; margin-bottom: 4px; }
    h2 { font-size: 1.1rem; margin-top: 32px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    .meta { color: #888; font-size: 0.85rem; margin: 4px 0 12px; }
    .content { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>개인정보처리방침</h1>
  ${sections}
</body>
</html>`;
}
