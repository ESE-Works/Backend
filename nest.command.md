## 전체 명령어 보기

```bash
nest g --help
```

## generate 명령어 목록

- `nest g application` — 새 애플리케이션 워크스페이스 생성
- `nest g class (cl)` — 클래스 생성
- `nest g controller (co)` — 컨트롤러 생성
- `nest g decorator (d)` — 커스텀 데코레이터 생성
- `nest g filter (f)` — 필터 생성
- `nest g guard (gu)` — 가드 생성
- `nest g interceptor (itc)` — 인터셉터 생성
- `nest g interface (itf)` — 인터페이스 생성
- `nest g middleware (mi)` — 미들웨어 생성
- `nest g module (mo)` — 모듈 생성
- `nest g pipe (pi)` — 파이프 생성
- `nest g provider (pr)` — 프로바이더 생성
- `nest g resolver (r)` — GraphQL 리졸버 생성
- `nest g resource (res)` — CRUD 리소스 한번에 생성 (module + controller + service) / ex) nest g resource src/modules/contracts --no-spec
- `nest g service (s)` — 서비스 생성

## 자주 쓰는 옵션

- `--no-spec` — spec(테스트) 파일 생성 안 함
- `--flat` — 하위 폴더 없이 평평하게 생성
- `--skip-import` — module에 자동 import 건너뜀
