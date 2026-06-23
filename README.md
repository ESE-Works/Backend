# 복지/혜택 관리 플랫폼 백엔드

> 계약, 혜택, 사용자 관리를 위한 NestJS 기반 백엔드 서버입니다.

<br/>

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | NestJS 11, TypeScript |
| Database | Supabase |
| Auth | Passport.js (Kakao / Google / Naver) |
| Package Manager | yarn |

<br/>

## 📁 프로젝트 구조

```
src/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/
├── supabase/
└── modules/
    ├── auth/
    ├── users/
    ├── contracts/
    └── benefits/
```

<br/>

## ⚙️ 환경 변수 설정

루트 디렉토리에 `.env` 파일을 생성하고 아래 값을 입력해주세요.

```env
# App
PORT=3000
NODE_ENV=development

# Social Login
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

<br/>

## 🚀 설치 및 실행

### 1. 패키지 설치

```bash
yarn install
```

### 2. 개발 서버 실행

```bash
yarn start:dev
```

### 3. 프로덕션 빌드 및 실행

```bash
# 빌드
yarn build

# 실행
yarn start:prod
```

<br/>

## 🌿 브랜치 전략

| 브랜치 | 설명 |
|--------|------|
| `main` | 프로덕션 배포 브랜치 |
| `develop` | 개발 통합 브랜치 |
| `feat/*` | 기능 개발 |
| `fix/*` | 버그 수정 |

<br/>

## 📌 커밋 컨벤션

| 타입 | 설명 |
|------|------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `refactor` | 코드 리팩토링 |
| `chore` | 빌드, 패키지 설정 변경 |
| `docs` | 문서 수정 |

<br/>

## 🧪 테스트

```bash
# 단위 테스트
yarn test

# e2e 테스트
yarn test:e2e

# 커버리지
yarn test:cov
```

<br/>
