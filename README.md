# 낼름 (Naelum)

냉장고 재료 기반 레시피 추천·공유 웹앱 — https://naelum.app

- **스택**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres·Auth·Storage)
- **다국어**: 8개 로케일(ko·en·ja·zh·es·fr·de·it), 경로 기반(`app/[lang]/…`)
- **프로젝트 규칙·현황의 기준 문서**: [`CLAUDE.md`](CLAUDE.md) — 검증 순서·브랜치 전략·DB/RLS·i18n 규칙

## 시작하기

```bash
npm install
cp env.example .env.local   # 값 채우기 (Supabase URL·키, NEXT_PUBLIC_SITE_URL, CRON_SECRET 등 — 각 항목 주석 참고)
npm run dev                 # http://localhost:3000 → /{lang} 로 리다이렉트
```

홈 화면은 `app/[lang]/page.tsx`(+ `app/[lang]/HomeClient.tsx`)이고, 요청 미들웨어는 `proxy.ts`(Next 16 컨벤션)다.
패키지 매니저는 npm(`package-lock.json`)만 사용한다.

> 브라우저로 직접 확인할 때는 dev 서버가 아니라 `npm run build && npm run start`(프로덕션 빌드) 기준 — 이유는 CLAUDE.md "절대 하지 말 것" 참고.

## 명령어

| 명령 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm run start` | 프로덕션 빌드 / 실행 |
| `npm run lint` | ESLint (CI 는 `--max-warnings=0`) |
| `npx tsc --noEmit` | 타입 체크 |
| `npm test` | 단위 테스트 (vitest) |
| `npx playwright test` | E2E (프로덕션 빌드를 자동으로 띄움) |
| `npm run scan` | god-file 줄 수 + 취약 패턴 스캔 |

## 문서

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 페이지·인증·데이터 페칭 패턴, 안티패턴
- [`docs/DATA_LAYER.md`](docs/DATA_LAYER.md) — 데이터 접근 계층(`lib/queries/`) 점진 이전
- [`docs/GDPR_COMPLIANCE.md`](docs/GDPR_COMPLIANCE.md) — 개인정보 준수 체크리스트
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — 작업 로그
- DB 스키마 변경은 `supabase/migrations/` 에 SQL 로 작성 → dev 적용·검증 → prod (CLAUDE.md "DB 마이그레이션 흐름")

## 배포

Vercel — `develop` 브랜치는 Preview(dev DB), `main` 은 프로덕션(naelum.app). `main` 직접 푸시 금지, `develop` → `main` PR 로 머지.
