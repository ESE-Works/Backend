# 계약서 분석 API 테스트 가이드

전체 텍스트 분석(`POST /contracts/text`)과 특약 조항 분석(`POST /contracts/special-terms`)을 테스트하는 방법입니다.

---

## 0. 사전 준비

### 서버 실행

```bash
yarn dev
```

### 테스트용 JWT 발급

프론트 없이 테스트하려면 로컬에서 직접 JWT를 서명해서 만들 수 있습니다 (`.env`의 `JWT_SECRET` 값을 그대로 사용).

```bash
node -e "
const jwt = require('jsonwebtoken');
console.log(jwt.sign({ sub: '11111111-1111-1111-1111-111111111111' }, process.env.JWT_SECRET || 'estate_ontract', { expiresIn: '1h' }));
"
```

출력된 문자열을 복사해두세요. 아래 예시에서 `$TOKEN`으로 표기합니다.

```bash
export TOKEN="여기에_발급받은_토큰_붙여넣기"
```

> 참고: 아래 두 API는 실제로 OpenAI GPT-4o를 호출하므로 소액이지만 비용이 발생합니다. 비용 없이 응답 형태만 보고 싶으면 `GET /contracts/sample`을 먼저 호출해보세요 (섹션 4 참고).

---

## 1. 전체 텍스트 분석 — `POST /contracts/text`

계약서 전체 원문을 넣으면 핵심 정보 추출, 필수 기재사항 누락, 위험 조항, 전세사기 위험 지표, 위험도 점수까지 전부 분석합니다.

### Swagger로 테스트

1. `http://localhost:4000/api-docs` 접속
2. 우측 상단 **Authorize** 클릭 → `$TOKEN` 값 입력
3. `Contracts` 태그 → `POST /contracts/text` → **Try it out**
4. body에 아래 예시 입력 → **Execute**

```json
{
  "text": "임대인 홍길동과 임차인 김청년은 서울시 관악구 봉천동 123-45 201호에 대해 다음과 같이 월세 임대차 계약을 체결한다. 보증금은 오천만원, 월세는 육십오만원이며 계약기간은 2026년 7월 1일부터 2028년 6월 30일까지이다. 원상복구 비용 일체는 임차인이 부담한다. 임대인의 동의 없이 임차인은 계약을 해지할 수 없다."
}
```

### curl로 테스트

```bash
curl -X POST http://localhost:4000/contracts/text \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "임대인 홍길동과 임차인 김청년은 서울시 관악구 봉천동 123-45 201호에 대해 다음과 같이 월세 임대차 계약을 체결한다. 보증금은 오천만원, 월세는 육십오만원이며 계약기간은 2026년 7월 1일부터 2028년 6월 30일까지이다. 원상복구 비용 일체는 임차인이 부담한다. 임대인의 동의 없이 임차인은 계약을 해지할 수 없다."
  }' | jq
```

### 확인할 포인트

- `analysis_result.extraction.deposit`가 `5000` (만원 단위, 원 단위 `50000000` 아님)
- `analysis_result.extraction.contract_type`가 `"monthly"`
- `analysis_result.clauses`에 "임대인의 동의 없이 계약 해지 불가" 관련 `danger` 조항이 감지되는지
- `analysis_result.risk_score` / `risk_grade`가 조항 개수에 맞게 계산되는지
- `status`가 `"COMPLETED"`, `input_source`가 `"text_paste"`인지

### 실패 케이스 테스트 (선택)

주거용 임대차와 무관한 텍스트를 넣으면 400(`NOT_CONTRACT`)이 나오는지 확인:

```bash
curl -s -X POST http://localhost:4000/contracts/text \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "오늘 점심 메뉴는 김치찌개였다."}' | jq
```

---

## 2. 특약 조항만 분석 — `POST /contracts/special-terms`

계약서 원문 없이 특정 특약 문구만 넣고 위험 여부 + 수정 제안을 받습니다.

### Swagger로 테스트

1. `Contracts` 태그 → `POST /contracts/special-terms` → **Try it out**
2. body에 아래 예시 입력 → **Execute**

```json
{
  "text": "원상복구 비용은 임차인이 전액 부담한다."
}
```

### curl로 테스트

```bash
curl -X POST http://localhost:4000/contracts/special-terms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "원상복구 비용은 임차인이 전액 부담한다."}' | jq
```

### 확인할 포인트

- `analysis_result.input_mode`가 `"special_terms"`
- `analysis_result.extraction`, `analysis_result.fraud_risk`가 `null` (특약 모드에서는 분석 안 함)
- `analysis_result.clauses`에 해당 조항의 위험도(`danger`/`warning`/`safe`)와 `suggestion`, `request_guide`가 채워져 있는지
- `analysis_result.summary`에 "특약 조항만 분석된 결과입니다" 문구 포함 여부
- `input_source`가 `"text_special_terms"`인지

### 여러 특약을 한 번에 넣어보기

```bash
curl -X POST http://localhost:4000/contracts/special-terms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "원상복구 비용은 임차인이 전액 부담한다.\n관리비 항목은 별도 협의한다.\n확정일자를 받는 것에 협조한다."
  }' | jq
```

---

## 3. 분석 이력 조회

```bash
# 목록 (최신순)
curl -s http://localhost:4000/contracts -H "Authorization: Bearer $TOKEN" | jq

# 단건 조회 (위 응답의 id 값 사용)
curl -s http://localhost:4000/contracts/<id> -H "Authorization: Bearer $TOKEN" | jq
```

다른 유저의 토큰으로 남의 `id`를 조회하면 404가 나오는지도 확인해보면 좋습니다 (`sub` 값을 다른 uuid로 바꿔서 새 토큰 발급 후 테스트).

---

## 4. 샘플 결과 (비용 없음)

GPT를 호출하지 않고 미리 준비된 결과를 즉시 반환합니다. 인증도 필요 없습니다.

```bash
curl -s http://localhost:4000/contracts/sample | jq
```

---

## 5. 참고 — 위험도 점수 계산 방식

서버가 GPT 응답을 그대로 신뢰하지 않고 직접 계산합니다 (`contracts-analysis.service.ts`).

| 항목 | 점수 |
| --- | --- |
| `clauses` 중 `danger` 1개당 | +15 |
| `clauses` 중 `warning` 1개당 | +7 |
| `missing_check` 중 `danger` 1개당 | +10 |
| `missing_check` 중 `warning` 1개당 | +5 |
| `fraud_risk.detected: true` (danger 지표 포함) | +20 (최초 1회) |
| `fraud_risk.detected: true` (warning 지표만) | +10 (최초 1회) |

등급: 0~30 `safe` / 31~60 `warning` / 61~79 `danger` / 80~100 `critical` (최대 100점)
