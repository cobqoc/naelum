# 낼름 Naelum (Recipe Sharing Web App) - 프로젝트 요구사항 명세서

## 📋 운영 체크리스트

- **GDPR·개인정보 준수** → [`docs/GDPR_COMPLIANCE.md`](docs/GDPR_COMPLIANCE.md) 참조
  - 현재 85~90% 실무 준수. 사용자 100명+·1000명+·수익화 시점별 trigger·action 정리됨
  - 월 1회 확인 권장. 새 기능 런칭 시 privacy impact 체크

## 💻 기술 스택 (현재 프로젝트 기준)

### Frontend
- **Framework**: Next.js 16.2.3 (App Router)
- **Library**: React 19.2.3
- **Styling**: Tailwind CSS 4 (@tailwindcss/postcss)
- **Language**: TypeScript 5.x

## 🗄️ Supabase 환경 분리

| 환경 | 브랜치 | Supabase 프로젝트 | 용도 |
|---|---|---|---|
| 로컬 개발 | — | `naelum-dev` (`jmyrdoguxlizvajfcwep`) | `.env.local` |
| Vercel Preview | `develop` | `naelum-dev` (`jmyrdoguxlizvajfcwep`) | Preview URL |
| Vercel Production | `main` | `naelum` (`rgnlgpfazxgwsnkgrhzs`) | naelum.app |

### DB 마이그레이션 흐름
```
1. supabase/migrations/ 에 SQL 파일 작성
2. naelum-dev에 먼저 apply → 검증
3. 문제 없으면 naelum(prod)에 apply
```

> MCP로 DB 작업 시 항상 dev(`jmyrdoguxlizvajfcwep`) 먼저, 검증 후 prod(`rgnlgpfazxgwsnkgrhzs`) 순서로 진행

### dev DB 현황 (2026-05-13 기준)
- `recipes`: 100개 (published; MAFF 2,050개 2026-05-13 삭제됨)
- `ingredients_master`: 1,953개
- 함수·트리거·뷰 프로덕션과 동기화 완료

### 주의사항
- **로컬/dev에서 절대 prod DB 직접 수정 금지**
- dev에 유저 없음 → 유저 관련 기능 테스트 시 dev에서 직접 회원가입 필요
- Google OAuth 로그인 안 될 경우: naelum-dev → Authentication → URL Configuration에서 `http://localhost:3000` 등록 확인

---

## 🌿 브랜치 전략

```
main      → 프로덕션 (naelum.app) — 직접 푸시 금지
develop   → 스테이징 (Vercel Preview URL) — 기본 작업 브랜치
feature/* → 기능 단위 브랜치 (선택)
```

### 작업 흐름
```
1. develop 브랜치에서 작업
2. git push origin develop
3. Vercel Preview URL에서 프로덕션 환경 테스트
4. 문제 없으면 GitHub에서 develop → main PR 생성 후 머지
5. naelum.app 자동 배포
```

### 주의사항
- **main에 직접 푸시 금지** — 반드시 develop에서 테스트 후 PR로 머지
- 서비스 워커, 캐시 관련 변경은 반드시 Preview URL에서 검증 (dev 서버에서 재현 안 됨)
- 대규모 페이지 구조 변경 시 `public/sw.js`의 `CACHE_VERSION` 함께 올릴 것

---

## 🛠 개발 명령어
- **개발 서버**: `npm run dev`
- **프로젝트 빌드**: `npm run build`
- **코드 린트**: `npm run lint`
- **프로덕션 시작**: `npm run start`
- **E2E 테스트**: `npx playwright test` (프로덕션 빌드 자동 실행)
- **특정 테스트**: `npx playwright test e2e/auth.spec.ts --reporter=list`

---

## 🚨 코드 수정 후 필수 검증 순서 (절대 생략 금지)

> **이 순서를 지키지 않으면 반드시 문제가 반복된다. 예외 없음.**

```
1. npm run lint        → 경고 0개 확인
2. npm run build       → 빌드 성공 확인
3. npx playwright test → E2E 전체 통과 확인
```

### ❌ 절대 하지 말 것

- **`npm run dev`로 브라우저 직접 클릭 테스트 금지**
  - Next.js dev 오버레이가 클릭을 가로채서 "버튼이 안 눌린다"는 착각을 유발함
  - 브라우저 확인은 반드시 `npm run start` (프로덕션 빌드) 기준으로 할 것
  - Playwright는 자동으로 프로덕션 빌드를 사용함 (`playwright.config.ts` 참고)

- **windows-mcp로 브라우저 테스트 금지**
  - 웹 앱 테스트는 Playwright (`npx playwright test`)가 유일한 정답
  - windows-mcp는 OS 데스크톱 GUI 조작 전용 (파일 탐색기, 윈도우 앱 등)

- **증상 은폐(timeout, try-catch로 에러 묻기) 금지**
  - 근본 원인을 먼저 파악하고 제거할 것
  - `Promise.race(..., setTimeout)` 같은 우회책은 임시방편이며 반드시 실제 문제가 남는다

- **in-memory 상태로 서버리스 기능 구현 금지**
  - Vercel 서버리스 환경에서 `Map`, `Set` 등 모듈 레벨 변수는 요청 간 공유되지 않음
  - rate limiting, session 등 지속 상태가 필요한 기능은 반드시 Supabase DB 사용

- **클라이언트에서 미들웨어 역할 중복 금지**
  - 인증 체크, 리다이렉트 등 미들웨어(`proxy.ts`)가 담당하는 것을 클라이언트에서 다시 하지 말 것
  - 중복 `getUser()` 호출은 응답 속도 저하 및 무한 로딩의 원인

## 🔍 claude-in-chrome 으로 브라우저 검증하기 (배경 탭 우회)

> **2026-05-15에 잡힌 함정.** claude-in-chrome MCP 자동화 탭은 항상 `document.hidden=true` 상태(사용자가 다른 탭을 보고 있어서 background). 이 때문에:
> - `requestAnimationFrame`이 throttle/정지
> - Next.js 16 React streaming SSR의 final swap이 `requestAnimationFrame` 안에서 실행
> - 결과: `app/loading.tsx`의 "로딩 중" splash에서 영원히 hang
>
> 사용자 일반 Chrome으로는 정상 동작. claude-in-chrome 환경 한정 문제.

### 우회 — 페이지 로드/reload마다 적용

```js
// 1. Page Visibility mock (hidden → false)
Object.defineProperty(document, 'hidden',         { configurable: true, get: () => false });
Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });

// 2. requestAnimationFrame을 setTimeout으로 polyfill (throttle 회피)
window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);

// 3. React streaming의 boundary swap이 raf 대기 중이면 강제 실행
if (window.$RB?.length === 2) window.$RV(window.$RB);
```

페이지 reload·navigate 직후마다 위 3개 한 세트로 호출. `$RB`/`$RV`는 React가 streaming SSR 응답 끝에 정의하는 swap helper (B = body, S = suspense fallback, V = visit/swap).

### 인증 검증

`/api/test/signin` route는 `TEST_SIGNIN_ALLOW=1` + 비-Vercel 환경에서만 동작 (`.env.local`에 이미 설정). 테스트 user 생성은 `e2e/helpers/auth.ts`의 `ensureTestUser` 그대로 활용 — `auth_provider: 'email'`, `onboarding_completed: true` 등 필수 필드 다 채워줌. 자체 upsert로 만든 user는 미들웨어 redirect loop 위험.

### 절대 잊지 말 것

- **인증 자체는 정상** — 미들웨어 user 인식, API 호출 200 모두 OK
- **SSR 응답에 "로그인/가입" 텍스트 보이는 건 정상** — `Header`가 클라이언트 컴포넌트라 SSR 시점엔 항상 user=null. 클라이언트 hydration 후 `useAuth`가 user 채우면 로그인 헤더로 바뀜
- 페이지가 splash에서 멈춰 있어 보이면 **무조건** 위 3-line 우회 코드부터 시도. "claude-in-chrome 한계"라고 결론짓지 말 것

### 한계

- 연속 인터랙션은 timing 민감. 모달 추가 사이에 충분한 wait (1.5~2.5초) 필요
- 페이지 reload 시 patch가 사라짐 → reload 직후 즉시 재적용
- 시각·동작 검증 모두 안정성 떨어지면 Playwright e2e가 가장 정확

## 📜 개발 규칙
- **컴포넌트**: 모든 새로운 컴포넌트는 `app/` 디렉토리 내의 App Router 컨벤션을 따릅니다.
- **TypeScript**: `any` 타입은 **기본 지양**하고 인터페이스/타입을 명확히 정의합니다. 단 불가피한 경우 `// eslint-disable-next-line @typescript-eslint/no-explicit-any`로 **범위를 한 줄에 한정**하여 허용합니다. 타입 완벽주의(perfectionism)를 위한 리팩터는 하지 않습니다 — 실용성 > 엄격성. (상세: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) "Anti-goal" 절. 두 문서는 **동일 정책**입니다.)
- **Client/Server**: 기본적으로 Server Components를 사용하며, 인터랙션이 필요한 경우에만 `'use client'`를 사용합니다.
- **스타일링**: Tailwind CSS 4의 유틸리티 클래스를 우선적으로 사용하며, 변수는 `globals.css`의 CSS 변수를 활용합니다.
- **데이터 무결성**: DB 또는 파일에 데이터를 삽입할 때, 출처에서 확인되지 않은 가짜 데이터나 추정 데이터를 절대 삽입하지 않습니다. 확인할 수 없는 값은 NULL 또는 빈 값으로 남겨둡니다.

---

## 📋 프로젝트 개요

**프로젝트명**: 낼름 (Naelum)  
**목적**: 글로벌 요리 레시피 공유 및 스마트 재료 기반 추천 플랫폼  
**타겟 사용자**: 전 세계 요리 애호가, 홈쿡, 초보 요리사

---

## 🎯 핵심 기능 요구사항

### 1. 레시피 관리 기능
- **레시피 작성 및 공유**
  - 레시피 제목, 설명, 조리시간, 난이도, 인분 수 입력
  - 단계별 조리 과정 (사진/동영상 첨부 가능)
  - 재료 목록 (재료명, 양, 단위)
  - 요리 팁 및 주의사항
  - 태그 기능 (국가, 요리 종류, 식단 유형 등)
  
- **레시피 저장 및 북마크**
  - 개인 레시피 북 생성
  - 폴더별 정리 기능 (예: 아침 메뉴, 디저트 등)
  - 오프라인 접근을 위한 다운로드 옵션

- **레시피 따라하기 모드**
  - 스텝 바이 스텝 쿠킹 모드
  - 타이머 기능
  - 음성 안내 옵션
  - 완료 체크리스트

### 2. 스마트 검색 및 추천 시스템

#### 2.1 통합 검색바
- **검색 가능 항목**
  - 요리 이름 (예: "김치찌개", "Pasta Carbonara")
  - 재료 (예: "닭고기", "토마토")
  - 국가/지역 (예: "한국", "이탈리아", "Asian")
  - 요리 종류 (예: "디저트", "메인 요리")
  - 조리 시간 (예: "30분 이내")
  - 난이도 (예: "초급", "중급", "고급")
  - 식단 유형 (예: "비건", "저탄수화물", "글루텐프리")

- **검색 기능**
  - 자동완성 기능
  - 오타 자동 교정
  - 다국어 검색 지원
  - 필터링 옵션 (조리시간, 난이도, 칼로리 등)
  - 최근 검색어 히스토리 (로컬 저장)
  - 인기 검색어 표시

#### 2.2 재료 기반 레시피 추천
- **보유 재료 입력**
  - 자동완성 재료 입력
  - 재료 카테고리별 선택 (채소, 육류, 해산물 등)
  - 사진 인식을 통한 재료 자동 감지 (선택 기능)

- **매칭 알고리즘**
  - 보유 재료로 만들 수 있는 레시피 우선 표시
  - 부족한 재료 1-2개인 레시피도 제안
  - 재료 대체 옵션 제공

#### 2.3 식사 시간별 추천
- **저장된 재료 기반 추천**
  - 아침/점심/저녁 시간대별 맞춤 추천
  - 계절 및 날씨 고려 (선택 기능)
  - 사용자 취향 학습 및 개인화 추천

- **알림 기능**
  - 식사 시간 알림 (선택 가능)
  - 새로운 추천 레시피 알림

### 3. 소셜 기능
- **레시피 댓글/공유**
  - 댓글을 통한 질문 및 팁 공유
  - SNS 공유 기능

- **"만들어봤어요" 시스템**
  - 실제 조리 완료 기록
  - 5점 평점 시스템 (⭐⭐⭐⭐⭐)
  - 만든 후기 사진 업로드 (선택)
  - 간단한 후기 텍스트 작성
  - "이번 주 많이 만들어진 레시피" 통계 활용

- **레시피 저장/북마크** (핵심 기능)
  - 개인 레시피 북 폴더별 정리
  - 빠른 저장 버튼
  - 저장한 레시피 쉬운 접근

- **기타 소셜 기능**
  - 다른 사용자 팔로우
  - 레시피 리믹스 (타인 레시피 수정하여 새로 작성)

---

## 🎨 UI/UX 디자인 요구사항

### 색상 팔레트 (다크 모드 기반)
```css
/* Primary Colors */
--background-primary: #1a1a1a;
--background-secondary: #2d2d2d;
--background-tertiary: #3a3a3a;

/* Accent Colors (Warm Tone) */
--accent-warm: #ff9966;
--accent-glow: rgba(255, 153, 102, 0.3);
--accent-hover: #ffaa77;

/* Text Colors */
--text-primary: #e8e8e8;
--text-secondary: #b8b8b8;
--text-muted: #888888;

/* Status Colors */
--success: #4caf50;
--error: #f44336;
--warning: #ff9800;
--info: #2196f3;
```

### 헤더 (Header) 구조

#### 스크롤 전 (초기 상태)
```
┌─────────────────────────────────────────────┐
│ [낼름 아이콘]              [로그인/프로필] │
└─────────────────────────────────────────────┘
```

#### 스크롤 후
```
┌─────────────────────────────────────────────┐
│ [낼름]  [────검색바────]  [로그인/프로필] │
└─────────────────────────────────────────────┘
```

**헤더 기능 명세**
- 좌측: 낼름 로고/아이콘 (클릭 시 홈으로)
- 중앙: 검색바 (스크롤 시 헤더로 이동, 부드러운 애니메이션)
- 우측: 로그인 아이콘 / 프로필 이미지 (드롭다운 메뉴)
- 헤더 고정 (sticky header)
- 스크롤 시 약간의 투명도 효과

### 메인 페이지 (홈)

#### 검색바 디자인
```
화면 중앙 상단 배치
┌────────────────────────────────────────────┐
│                                            │
│    ┌──────────────────────────────────┐   │
│    │  🔍 재료, 요리, 국가 검색... ▼  │   │
│    └──────────────────────────────────┘   │
│           (웜톤 글로우 효과)               │
│                                            │
└────────────────────────────────────────────┘
```

**검색바 상세 기능**
- 웜톤 글로우 효과 (`box-shadow: 0 0 20px var(--accent-glow)`)
- 포커스 시 글로우 강도 증가
- 우측 하단 화살표 아이콘 (▼) - 검색 히스토리 드롭다운
- 최근 검색어 최대 10개 표시
- 검색어 삭제 옵션 (X 버튼)
- 플레이스홀더 텍스트 다국어 지원

#### 메인 콘텐츠 섹션
1. **추천 레시피 섹션**
   - 오늘의 추천
   - 인기 레시피 (주간/월간)
   - 트렌딩 레시피

2. **카테고리 탐색**
   - 국가별 (한국, 중국, 일본, 이탈리아, 프랑스 등)
   - 요리 종류별 (메인, 사이드, 디저트, 음료)
   - 식단별 (비건, 케토, 저칼로리 등)

3. **최근 업로드 레시피**
   - 무한 스크롤 또는 페이지네이션
   - 카드 형식의 레시피 프리뷰

---

## 🔐 인증 및 사용자 관리

### 로그인 페이지

**레이아웃**
```
┌──────────────────────────────┐
│                              │
│      [낼름 로고]            │
│                              │
│  ┌─ Google로 로그인 ────┐   │
│  └───────────────────────┘   │
│                              │
│         또는                 │
│                              │
│  이메일                      │
│  [____________________]      │
│  ❌ 이메일 형식 오류          │
│                              │
│  비밀번호                    │
│  [____________________] 👁   │
│  ❌ 비밀번호가 틀렸습니다     │
│                              │
│  ☐ 아이디 저장               │
│  ☐ 자동 로그인               │
│                              │
│  [─── 로그인 ───]            │
│                              │
│  아이디 찾기 | 비밀번호 찾기  │
│                              │
│  계정이 없으신가요? 회원가입  │
│                              │
└──────────────────────────────┘
```

**기능 명세**
- Google OAuth 2.0 로그인
- 이메일 유효성 실시간 검증 (정규표현식)
- 비밀번호 보이기/숨기기 토글
- 실시간 오류 메시지 표시
- 로그인 실패 시 3회 제한 (보안)
- Remember Me 기능 (쿠키 저장, 30일)
- 자동 로그인 (JWT 토큰)

### 회원가입 페이지

**레이아웃**
```
┌──────────────────────────────┐
│      회원가입                 │
│                              │
│  ┌─ Google로 가입하기 ───┐   │
│  └───────────────────────┘   │
│                              │
│         또는                 │
│                              │
│  이메일 *                    │
│  [____________________] ✓    │
│  ✓ 사용 가능한 이메일입니다   │
│                              │
│  인증코드 [─ 전송 ─]         │
│  [______] (5분 내 입력)      │
│                              │
│  비밀번호 *                  │
│  [____________________] 👁   │
│  보안 강도: ████░░ 강함       │
│  ℹ️ 대소문자/특수문자/8자 이상 │
│                              │
│  비밀번호 확인 *             │
│  [____________________] 👁   │
│  ✓ 비밀번호가 일치합니다      │
│                              │
│  ☐ 이용약관 동의 (필수)       │
│  ☐ 개인정보처리방침 동의      │
│  ☐ 마케팅 수신 동의 (선택)    │
│                              │
│  [───── 가입하기 ─────]      │
│                              │
│  이미 계정이 있으신가요? 로그인│
│                              │
└──────────────────────────────┘
```

**기능 명세**
- **이메일 검증**
  - 실시간 중복 체크 (API 디바운싱 500ms)
  - 형식 검증 (RFC 5322 표준)
  - 인증코드 이메일 발송
  - 5분 제한시간 카운트다운

- **비밀번호 보안**
  - 최소 8자, 대문자/소문자/특수문자 포함
  - 실시간 보안 강도 측정 (zxcvbn 라이브러리 사용 권장)
  - 일반적인 비밀번호 차단 (예: password123)
  - 비밀번호 일치 여부 실시간 확인

- **약관 동의**
  - 전체 동의 체크박스
  - 개별 약관 모달로 상세 내용 표시
  - 필수 동의 항목 미체크 시 가입 불가

### 온보딩 플로우 (가입 후)

**Step 1: 프로필 설정**
```
┌──────────────────────────────┐
│   프로필을 설정해주세요       │
│   (1/4)                      │
│                              │
│   [  프로필 사진 업로드  ]    │
│      (선택사항)               │
│                              │
│   닉네임 *                   │
│   [____________________]     │
│   ✓ 사용 가능한 닉네임        │
│                              │
│   생년월일                   │
│   [YYYY] [MM] [DD]           │
│                              │
│   성별                       │
│   ○ 남성  ○ 여성  ○ 기타     │
│                              │
│   [다음] [나중에 하기]        │
└──────────────────────────────┘
```

**Step 2: 관심사 선택**
```
┌──────────────────────────────┐
│   관심 있는 요리를 선택하세요  │
│   (2/4)                      │
│                              │
│   [한식] [중식] [일식]        │
│   [양식] [이탈리안] [프렌치]  │
│   [멕시칸] [인도] [태국]      │
│   [비건] [디저트] [베이킹]    │
│                              │
│   최소 3개 이상 선택          │
│                              │
│   [이전] [다음] [나중에]      │
└──────────────────────────────┘
```

**Step 3: 식단 선호도**
```
┌──────────────────────────────┐
│   식단 선호도를 알려주세요     │
│   (3/4)                      │
│                              │
│   ☐ 채식주의자               │
│   ☐ 비건                     │
│   ☐ 락토 베지테리언           │
│   ☐ 글루텐 프리              │
│   ☐ 저탄수화물               │
│   ☐ 저칼로리                 │
│   ☐ 없음                     │
│                              │
│   알레르기 재료               │
│   [____________________]     │
│   (예: 땅콩, 새우, 우유)      │
│                              │
│   [이전] [다음] [나중에]      │
└──────────────────────────────┘
```

**Step 4: 완료**
```
┌──────────────────────────────┐
│   환영합니다! 🎉              │
│   (4/4)                      │
│                              │
│   프로필이 생성되었습니다     │
│   /@사용자닉네임             │
│                              │
│   맞춤 추천을 받으려면        │
│   보유 재료를 등록해보세요    │
│                              │
│   [재료 등록하기]             │
│   [메인으로 가기]             │
│                              │
└──────────────────────────────┘
```

**온보딩 처리 로직**
- "나중에 하기" 선택 시: 임시 사용자명 자동 생성 (/@user12345)
- 프로필 URL: `/@{닉네임}` (중복 방지)
- 온보딩 진행률 저장 (중간 이탈 후 재접속 시 이어하기)
- 스킵 가능하지만 추천 시스템 정확도 저하 안내

---

## 🔒 보안 요구사항

### 1. 인증 보안
- **비밀번호 보안**
  - bcrypt 해싱 (최소 12 rounds)
  - Salt 추가
  - 비밀번호 재사용 방지 (최근 5개)
  - 비밀번호 변경 주기 권장 (90일)

- **세션 관리**
  - JWT (JSON Web Token) 사용
  - Access Token (15분), Refresh Token (7일)
  - HttpOnly, Secure 쿠키
  - CSRF 토큰 구현

- **계정 보호**
  - 로그인 시도 제한 (5회 실패 시 15분 잠금)
  - 2단계 인증 (2FA) 옵션 제공
  - 의심스러운 로그인 감지 및 이메일 알림
  - 세션 관리 페이지 (모든 기기에서 로그아웃)

### 2. 데이터 보안
- HTTPS 전용 (TLS 1.3)
- 개인정보 암호화 (AES-256)
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (입력 sanitization)
- CORS 정책 설정
- Rate Limiting (API 요청 제한)

### 3. 파일 업로드 보안
- 파일 타입 검증 (화이트리스트)
- 파일 크기 제한 (이미지: 5MB, 동영상: 50MB)
- 바이러스 스캔
- 파일명 sanitization
- CDN을 통한 이미지 제공

### 4. GDPR 및 개인정보 보호
- 데이터 수집 동의 관리
- 개인정보 다운로드 기능
- 계정 삭제 및 데이터 완전 제거 옵션
- 쿠키 동의 배너
- 개인정보 처리 방침 페이지

---

## 🌍 다국어 지원 (i18n)

### 지원 언어 (우선순위)
1. 한국어 (ko)
2. 영어 (en)
3. 일본어 (ja)
4. 중국어 간체 (zh-CN)
5. 스페인어 (es)
6. 프랑스어 (fr)
7. 독일어 (de)
8. 이탈리아어 (it)

### 구현 현황 (2026-05-10 기준) ✅

- **파일 위치**: `lib/i18n/locales/{ko,en,ja,zh,es,fr,de,it}.ts`
- **컨텍스트**: `lib/i18n/context.tsx` — `useI18n()` 훅
- **타입 안전성**: `TranslationKeys = typeof ko` — 8개 locale 모두 같은 key shape 필수
- **전 페이지·컴포넌트 처리 완료** — 하드코딩 한글 없음

### 🚨 i18n 개발 규칙

- 새 컴포넌트에서 `'한글 텍스트'` 직접 작성 금지 → 반드시 `t.namespace.key` 사용
- 새 키 추가 시 **8개 locale 모두** 동시에 추가 (TypeScript 타입 오류 방지)
- DB 저장 값(냉장/냉동/상온 등)은 한글 그대로 유지 — locale key와 혼동 금지

### 다국어 처리
- **자동 언어 감지**
  - 브라우저 언어 설정 우선
  - IP 기반 국가 감지 (보조)
  - 사용자 수동 선택 옵션

- **번역 범위**
  - UI 텍스트 전체 ✅
  - 에러 메시지 ✅
  - 이메일 템플릿
  - 푸시 알림

- **레시피 콘텐츠**
  - 사용자가 작성한 언어로 저장
  - AI 번역 옵션 제공 (선택 기능)
  - 다국어 레시피 검색 지원

- **날짜/시간 형식**
  - 지역별 형식 자동 적용
  - 시간대 (Timezone) 처리

- **단위 변환**
  - 미터법 ↔ 야드파운드법
  - 섭씨 ↔ 화씨
  - ml/g ↔ cup/oz

---

## 💻 기술 스택 권장사항

### Frontend
```yaml
Framework: Next.js 14+ (React 18)
  - App Router 사용
  - Server Components 활용
  - ISR/SSR for SEO

Styling:
  - Tailwind CSS (다크모드 지원)
  - Framer Motion (애니메이션)
  - CSS Modules (컴포넌트별)

State Management:
  - Zustand (경량 상태 관리)
  - React Query (서버 상태)
  - Context API (테마, 언어 등)

UI Component Library:
  - Radix UI (헤드리스 컴포넌트)
  - Headless UI
  - React Hook Form (폼 관리)

Image/Video:
  - Next.js Image 컴포넌트
  - React Player
  - Image Upload: react-dropzone

Search:
  - Algolia 또는 MeiliSearch
  - Elasticsearch (자체 구축 시)

i18n:
  - next-intl 또는 next-i18next
  - Format.js (날짜/숫자 형식)
```

### Backend
```yaml
Runtime: Node.js 20+ (LTS)

Framework:
  - Next.js API Routes (간단한 경우)
  - NestJS (복잡한 비즈니스 로직)
  - Express.js (레거시 호환)

Database:
  - PostgreSQL (메인 데이터)
  - Redis (캐싱, 세션)
  - MongoDB (레시피 콘텐츠, 유연한 스키마)

ORM:
  - Prisma (타입 안전)
  - TypeORM (대안)

Authentication:
  - NextAuth.js
  - Passport.js
  - OAuth 2.0 (Google, Facebook)

File Storage:
  - AWS S3 또는 Cloudflare R2
  - CDN: CloudFront, Cloudflare

Search Engine:
  - Algolia (추천)
  - Typesense (오픈소스)

Email:
  - SendGrid
  - AWS SES
  - Resend (개발자 친화적)
```

### DevOps & Infrastructure
```yaml
Hosting:
  - Vercel (Next.js 최적화) — 현재 사용 중
  - Cloudflare — Vercel 앞단 CDN/보안 레이어 (현재 연결됨)
  - AWS (확장성, 향후 이전 예정)

CI/CD:
  - GitHub Actions
  - Vercel Auto Deploy

Monitoring:
  - Sentry (에러 추적)
  - Google Analytics / Mixpanel
  - Vercel Analytics

Testing:
  - Jest (유닛 테스트)
  - Playwright (E2E)
  - React Testing Library

Code Quality:
  - ESLint
  - Prettier
  - Husky (pre-commit hooks)
  - TypeScript (강력한 타입 체크)
```

### AI/ML (추천 시스템)
```yaml
Recommendation Engine:
  - TensorFlow.js (클라이언트 사이드)
  - Python + FastAPI (서버 사이드)
  - Collaborative Filtering
  - Content-based Filtering

Image Recognition:
  - Google Cloud Vision API
  - AWS Rekognition
  - TensorFlow (커스텀 모델)

NLP (검색 개선):
  - OpenAI GPT API (레시피 생성/변환)
  - Sentence Transformers (유사도)
```

---

## 📱 반응형 디자인

### 브레이크포인트
```css
/* Mobile First Approach */
/* Mobile: 320px ~ 767px */
@media (max-width: 767px) { ... }

/* Tablet: 768px ~ 1023px */
@media (min-width: 768px) and (max-width: 1023px) { ... }

/* Desktop: 1024px ~ 1439px */
@media (min-width: 1024px) and (max-width: 1439px) { ... }

/* Large Desktop: 1440px+ */
@media (min-width: 1440px) { ... }
```

### 모바일 최적화
- **터치 제스처**
  - 스와이프로 레시피 카드 넘기기
  - 핀치 줌 (레시피 이미지)
  - Pull to Refresh

- **네비게이션**
  - 하단 탭 바 (홈, 검색, 추가, 저장, 프로필)
  - 햄버거 메뉴 (추가 옵션)

- **성능**
  - 이미지 지연 로딩
  - 무한 스크롤 가상화
  - PWA (Progressive Web App) 지원
  - 오프라인 모드

---

## 📊 추가 기능 제안

### 1. 소셜 기능 확장
- **커뮤니티**
  - 요리 챌린지 이벤트
  - 주간/월간 테마 레시피
  - 사용자 랭킹 시스템

- **라이브 쿠킹**
  - 실시간 방송 기능
  - 채팅 및 Q&A

### 2. 스마트 기능
- **AI 레시피 생성**
  - 재료만 입력하면 AI가 레시피 생성
  - 영양소 자동 계산

- **음성 제어**
  - 요리 중 음성으로 레시피 단계 제어
  - "다음 단계"로 핸즈프리 조작

- **AR 기능**
  - AR로 완성 요리 미리보기
  - 재료 계량 AR 가이드

### 3. 쇼핑 기능
- **장보기 리스트**
  - 레시피에서 자동 생성
  - 마트별 재료 위치 안내 (제휴 시)
  - 온라인 장보기 연동

- **가격 비교**
  - 재료 가격 비교
  - 세일 알림

### 4. 건강 관리
- **영양 정보**
  - 칼로리, 탄수화물, 단백질, 지방 등
  - 1일 영양 섭취 트래킹

- **식단 관리**
  - 주간 식단 플래너
  - 목표 칼로리 설정

### 5. 게임화 요소
- **배지 시스템**
  - 첫 레시피 작성 배지
  - 100번 요리 배지
  - 국가별 마스터 배지

- **레벨 시스템**
  - 경험치 획득 (레시피 작성, 요리 완료)
  - 레벨업 보상

---

## 🚀 개발 로드맵

### Phase 1: MVP (3-4개월)
- [x] 사용자 인증 시스템
- [x] 기본 레시피 CRUD
- [x] 검색 기능 (기본)
- [x] 반응형 UI
- [x] 다국어 지원 (8개 언어, 2026-05-10 완료)

### Phase 2: 핵심 기능 (2-3개월)
- [x] 재료 기반 추천 (ingredient_id FK 매칭, 2026-05-10)
- [x] 저장/북마크 기능 (낼름함)
- [ ] 레시피 따라하기 모드
- [x] 소셜 기능 (만들어봤어요, 댓글, 공유)
- [ ] 알림 시스템

### Phase 3: 고급 기능 (3-4개월)
- [ ] AI 추천 시스템
- [ ] 이미지 인식
- [ ] 음성 제어
- [ ] 라이브 쿠킹
- [ ] 쇼핑 연동

### Phase 4: 최적화 & 확장 (계속)
- [ ] 성능 최적화
- [ ] SEO 개선
- [ ] 모바일 앱 (KMP - Kotlin Multiplatform + SwiftUI/Compose)
- [ ] 파트너십 확대
- [ ] 인프라 마이그레이션 (Supabase + Vercel → AWS, 사용자 규모에 따라)

---

## 📈 성공 지표 (KPI)

### 사용자 지표
- DAU/MAU (일간/월간 활성 사용자)
- 사용자 유지율 (Retention Rate)
- 평균 세션 시간
- 회원가입 전환율

### 콘텐츠 지표
- 레시피 작성 수
- 레시피 저장/공유 수
- "만들어봤어요" 완료 수
- 평균 레시피 평점 (만들어봤어요 기반)
- 댓글/리뷰 수

### 비즈니스 지표
- 검색 성공률 (검색 후 레시피 선택)
- 재료 추천 정확도
- 추천 시스템 CTR
- 프리미엄 전환율 (수익화 시)

---

## 🛡️ 법적 고려사항

### 1. 저작권
- 레시피 저작권 정책 명시
- 사용자가 업로드한 콘텐츠에 대한 권리
- DMCA 준수

### 2. 개인정보
- GDPR (유럽)
- CCPA (캘리포니아)
- 개인정보보호법 (한국)

### 3. 이용약관
- 서비스 이용 규칙
- 금지 행위 명시
- 책임 제한 조항

### 4. 쿠키 정책
- 필수/선택 쿠키 구분
- 쿠키 동의 관리

---

## 📝 API 엔드포인트 예시

### 인증
```
POST   /api/auth/register          # 회원가입
POST   /api/auth/login             # 로그인
POST   /api/auth/logout            # 로그아웃
POST   /api/auth/refresh           # 토큰 갱신
POST   /api/auth/forgot-password   # 비밀번호 찾기
POST   /api/auth/reset-password    # 비밀번호 재설정
GET    /api/auth/verify-email      # 이메일 인증
```

### 사용자
```
GET    /api/users/:username        # 프로필 조회
PUT    /api/users/:username        # 프로필 수정
DELETE /api/users/:username        # 계정 삭제
GET    /api/users/:username/recipes # 사용자 레시피
POST   /api/users/:username/follow  # 팔로우
GET    /api/users/:username/followers # 팔로워 목록
```

### 레시피
```
GET    /api/recipes                # 레시피 목록
GET    /api/recipes/:id            # 레시피 상세
POST   /api/recipes                # 레시피 작성
PUT    /api/recipes/:id            # 레시피 수정
DELETE /api/recipes/:id            # 레시피 삭제
POST   /api/recipes/:id/save       # 저장/북마크
DELETE /api/recipes/:id/save       # 저장 취소
POST   /api/recipes/:id/cooked     # 만들어봤어요 (평점 포함)
GET    /api/recipes/:id/cooked     # 만들어봤어요 목록
POST   /api/recipes/:id/comment    # 댓글 작성
GET    /api/recipes/:id/comments   # 댓글 조회
```

### 검색
```
GET    /api/search                 # 통합 검색
GET    /api/search/autocomplete    # 자동완성
GET    /api/search/suggestions     # 검색 제안
```

### 추천
```
POST   /api/recommendations/ingredients  # 재료 기반 추천
GET    /api/recommendations/personalized # 개인화 추천
GET    /api/recommendations/trending     # 트렌딩 레시피
GET    /api/recommendations/meal-time    # 식사 시간별 추천
```

### 재료
```
GET    /api/ingredients            # 재료 목록
POST   /api/ingredients/recognize  # 이미지 인식
GET    /api/user/ingredients       # 보유 재료 조회
POST   /api/user/ingredients       # 보유 재료 추가
DELETE /api/user/ingredients/:id   # 보유 재료 삭제
```

---

## 🎯 성능 목표

### 페이지 로드
- First Contentful Paint (FCP): < 1.5초
- Largest Contentful Paint (LCP): < 2.5초
- Time to Interactive (TTI): < 3.5초
- Cumulative Layout Shift (CLS): < 0.1

### API 응답
- 검색 API: < 200ms (95th percentile)
- 레시피 조회: < 300ms
- 이미지 업로드: < 2초

### 가용성
- Uptime: 99.9%
- 에러율: < 0.1%

---

## 📚 참고 사료

### 디자인 참고
- Allrecipes.com
- Tasty by BuzzFeed
- Yummly
- Cookpad
- 만개의레시피

### 기술 문서
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)

---

## ✅ 체크리스트

### 개발 전
- [ ] 와이어프레임 작성
- [ ] DB 스키마 설계
- [ ] API 명세서 작성
- [ ] 디자인 시스템 구축
- [ ] 개발 환경 세팅

### 개발 중
- [ ] 코드 리뷰 프로세스
- [ ] 테스트 커버리지 > 80%
- [ ] 문서화
- [ ] 접근성 (WCAG 2.1 AA)

### 배포 전
- [ ] 보안 감사
- [ ] 성능 테스트
- [ ] SEO 최적화
- [ ] 법적 검토
- [ ] 베타 테스팅

---

## 💡 추가 고려사항

### 접근성 (a11y)
- ARIA 레이블
- 키보드 네비게이션
- 스크린 리더 지원
- 색상 대비율 (WCAG AA)
- 포커스 인디케이터

### SEO
- 메타 태그 최적화
- Open Graph 태그
- 구조화된 데이터 (Schema.org)
- Sitemap & robots.txt
- 정적 페이지 생성 (SSG)

### 애널리틱스
- 사용자 행동 추적
- 전환 퍼널 분석
- A/B 테스팅
- 히트맵 (Hotjar)

---

## 📱 모바일 앱 (KMP)

- **프로젝트 위치**: `../naelum-app/` (별도 저장소)
- **기술 스택**: Kotlin Multiplatform + SwiftUI (iOS) + Jetpack Compose (Android)
- **백엔드**: 웹앱과 동일한 Supabase 인스턴스 사용 (향후 AWS 이전 예정)
- **기획서**: `../naelum-app/KMP_PROJECT_PLAN.md` 참조
- **기존 Expo 코드**: 삭제 예정, KMP로 전면 재개발

---

**이 문서는 살아있는 문서입니다. 프로젝트 진행에 따라 지속적으로 업데이트됩니다.**

**작성일**: 2026-02-02  
**버전**: 1.2.0  
**최종 수정일**: 2026-05-15  
**작성자**: 낼름 개발팀

---

## 📌 데이터 현황 (2026-05-16 기준)

### 기능 구현 현황
- **장보기(cart) UX 개선 + 공유 cart + 가격 인프라** — 완료 (2026-05-16)
  - cart 모달 PC width `26rem → 30rem`, recipe chip `max-w 10rem → 15rem` (잘림 해소)
  - 레시피 chip 클릭 → 레시피 페이지 navigate + `sessionStorage` `naelum_cart_restore` 플래그 → 뒤로가기 시 Header·BottomNav 양쪽에서 cart 자동 재오픈
  - 항목 스테퍼+단위 통합 `[−|수량|단위 ▾|+]` (DetailFields 패턴 일관), 입력창 단위 select도 동일 패턴 (`▾` 명시, placeholder "단위")
  - quick-add chip 컴팩트화 + starred yellow tint + 긴 이름 `max-w`·truncate
  - **공유 cart Phase 1 (read-only)**: `shopping_list_shares` 테이블(token PK, owner, expires/revoked, 사용자당 활성 1개 partial unique idx). `POST/DELETE /api/cart/share`(토큰 재사용·revoke), `GET /api/cart/share/[token]`(비로그인, admin client RLS 우회, 만료/취소 404). `/[lang]/cart/share/[token]` Server Component read-only 페이지(noindex). cart 모달 🔗 공유 버튼. **dev+prod 적용 완료**. read-write 협업은 사용자 100명+ 이후 Phase 2
  - **재료 다 먹음 → 장보기 제안**: 냉장고 삭제 확정 시 한 토스트에 `[실행 취소][장보기에 추가]` 동시 노출. `useToast`에 `actions?: ToastAction[]` + `variant`(primary/secondary) 추가(백워드 컴팩트, 기존 `action` 단일 그대로). 비로그인/데모 skip
  - **가격 파싱·저장 인프라 Phase 1**: `match-receipt`가 가격 버리던 것(route.ts:33) 수정 → `RawProduct[]`(name+price/quantity/unit). `stores`+`ingredient_price_reports` 테이블(price_per_unit 정규화: g/kg→100g, ml/l→100ml, 개수→개당). `POST /api/ingredients/price-report`(인증·price>0). **dev+prod 적용 완료**. 영수증 OCR UI 미연결 상태라 endpoint까지 사전 빌드(연결만 하면 가격 축적 시작)
  - **트래킹 추가**: `cart_add_via_{chip,autocomplete,manual}`(카테고리 탭 추가 결정용), `cart_share_created`, `used_up_toast_shown`/`used_up_to_cart`(전환율 분모/분자)
  - e2e: `cart-share.spec.ts`(6) + `price-report.spec.ts`(8) 전부 통과
  - PR #48·#50·#52 (develop→main) 머지 완료
- **배달 시스템 (음식 완제품 배달)** — 구현 완료 (2026-05-16), prod DB 미적용
  - **진입 통제**: `/admin` 사이드바·quick actions에서만 진입. Header/홈/BottomNav/Footer 노출 X. 직접 URL은 인증만 거치면 접근 (RLS로 데이터 보안). 검색엔진 `robots: noindex`
  - **소비자** (`app/[lang]/delivery/*`): 식당 리스트(검색·카테고리 필터) → 식당 상세·메뉴 → 카트 → 주문 확정(주소·mock 결제) → 주문 상세·상태 추적 → 주문 내역. cart는 localStorage(비로그인 OK), checkout부터 인증 필요(미인증 시 `/login` redirect)
  - **사장님 어드민** (`app/[lang]/merchant/*`): 대시보드(오늘 주문·매출·영업토글) / onboarding(식당 등록) / 가게 정보 수정 / 메뉴 CRUD(카테고리·항목·품절) / 주문 칸반(결제완료→접수→조리→픽업대기, 30초 polling)
  - **라이더** (`app/[lang]/rider`): 차량 선택 → online/offline → 배차 대기 주문(`ready`+미배차) 수락 → 픽업 → 배달 완료. PWA·네이티브 앱 아님 (prototype/MVP·운영 모니터링 용도). 실 라이더 앱은 향후 KMP 모바일
  - **배차 모니터링** (`app/[lang]/admin/dispatch`): 운영팀용. 라이더 현황(온라인/배달중/오프라인)·활성 주문 테이블
  - **상태 머신**: `delivery_order_status` enum 9개. 전환 검증 트리거(`delivery_validate_status_transition`)로 잘못된 전이 차단. 소비자 추적은 `inferStatus` 시간 기반 가상 진행 + 사장님 명시 status가 더 진행됐으면 우선
  - **lib**: `lib/delivery/{api,cart,hooks,orders,storage,types}.ts`. `useSyncExternalStore` snapshot은 모듈 캐시로 안정 reference 유지(React error #185 회피 — [[feedback-use-sync-external-store-snapshot]])
  - **`app/[lang]/error.tsx` 추가**: `app/error.tsx`가 I18nProvider 바깥이라 useI18n throw → 진짜 에러 가림. `[lang]/error.tsx`가 우선 적용돼 raw error 노출
  - **i18n**: 8 locale에 `delivery`(cart/checkout/order/status 서브네임스페이스 포함)·`merchant`·`rider`. merchant/rider는 admin 전용이라 비-ko/en은 영어 폴백
  - **e2e**: `e2e/delivery.spec.ts`(8) + `e2e/merchant-rider.spec.ts`(8) + `e2e/delivery-full-flow.spec.ts`(1, 한 유저 3역할 주문→조리→배달). 17개 전부 통과
  - **미구현 (출시 전 필요)**: 메뉴 옵션(사이즈·맵기) / 결제 PG(현재 mock 즉시 paid) / 카카오 우편번호 / 메뉴 이미지 업로드 / 영업시간 UI / 푸시 알림(현재 polling) / 식당명·메뉴명 다국어
  - **미구현 (출시 후)**: 실시간 위치 추적 / 리뷰 / 쿠폰 / 배차 매칭 알고리즘(현재 전체 노출) / 라이더 정산 / 주문 환불 UI / 다중 식당 / 카카오 지도
  - PR #49 (develop→main) 머지 완료
- **배달 지도 / 푸드트럭 위치공개 Phase 1** — 구현·검증 완료 (2026-05-16), prod DB 미적용
  - **식당 좌표 입력**: `components/Merchant/PlaceLocationPicker.tsx`(지도 핀 드래그 + 주소·장소 검색 + 클릭 좌표) → merchant onboarding·가게정보 수정에서 `delivery_restaurants.lat/lng` 저장. 기존엔 푸드트럭만 지도에 뜰 수 있던 갭 해소
  - **소비자 지도** (`app/[lang]/delivery/map`): `GET /api/delivery/nearby`(bbox/place_type/open 필터, ±5° 검증, 비활성 제외), `robots: noindex`. admin 사이드바에서만 진입
  - **사장님 위치공개** (`app/[lang]/merchant/location`): 푸드트럭 live 위치 공개/재공개(항상 1개만 live)/영업종료. place_type 토글은 가게정보 수정에 통합
  - **map 인프라**: `components/map/*` MapLibre 래퍼(WebGL 미지원 시 fallback 박스 — 폼 등 나머지 UI 생존), `lib/delivery/places.ts` VWorld(국토지리정보원) 검색. 카카오 미사용
  - **i18n**: 8 locale에 `merchant`(place_type·location 공개) + map UI 키 추가
  - **next.config CSP**: VWorld/Carto/OSM/OSRM 타일 `connect-src` 허용
  - **e2e**: `e2e/delivery-map.spec.ts` 18개(API 검증·place_type DB반영·live row 1개유지·anon RLS·noindex). `describe` serial + `seedRestaurant` 단일왕복 self-verify로 격리 flaky 수정 — fresh-build 18×2 전부 통과·0 flaky
  - **flaky 조사 부산물**: cart/favorites e2e 빨강은 flaky 아니라 2026-05-16 cart 개편 vs 옛 셀렉터(별도 수정됨). reuseExistingServer가 stale 빌드 재사용 → 결정적 회귀는 :3000 죽이고 fresh build로
  - PR #54 (develop→main). prod DB(`20260516→17→18`) 미적용이라 머지해도 배달은 prod 휴면(admin 전용·noindex라 일반 사용자 무영향), 점등은 prod 마이그레이션 시점
- **인증 페이지 UX 개선 및 버그 수정** — 완료 (2026-05-15)
  - `login/page.tsx`: 아이디 찾기·비밀번호 찾기 모달 열릴 때 input 자동 포커스, ESC 키 닫기
  - `login/page.tsx`: 아이디 찾기 성공 화면에 "비밀번호 찾기" 바로가기 버튼 추가
  - `login/page.tsx`: 비밀번호 재설정 Step 3에 비밀번호 강도 텍스트 표시
  - `signup/SignupClient.tsx`: Google 버튼 공식 브랜드 컬러 적용 (로그인 페이지와 통일)
  - `signup/set-password/page.tsx`: "전체 동의" 마스터 체크박스 추가, 비밀번호 강도 텍스트, confirm placeholder
  - `auth/terms-agreement/page.tsx`: "전체 동의" 마스터 체크박스 추가, provider 아이콘 범용화
  - `auth/duplicate-email/content.tsx`: 하드코딩 한글 3곳 → i18n 키 교체
  - `auth/reset-password/page.tsx`: 중복 CSS 클래스 제거, 비밀번호 강도 텍스트 표시
  - i18n: 8개 locale에 `dupEmailRegistered`, `dupEmailCheckMethod`, `dupEmailMethodDesc`, `authVerifiedColon`, `agreeAll`, `passwordStrengthWeak/Fair/Strong/VeryStrong` 키 추가
- **유통기한 알림 토글 서버 연동** — 완료 (2026-05-15)
  - `NotificationPanel`: localStorage 제거 → 설정 패널 열릴 때 `profiles.push_notifications` DB에서 로드
  - 토글 변경 시 `supabase.from('profiles').update({ push_notifications })` 즉시 저장
  - `send-expiry` 크론: 발송 전 `push_notifications = true` 유저만 필터링 → 토글 off 시 실제 미발송
  - 미구현 "식사 추천 알림" 토글 제거 (알림 설정 UI에서)
- **E2E 테스트 6개 수정** — 완료 (2026-05-15)
  - `logged-in-home.spec.ts` 시나리오 E·F: `purchase_date` 기대값 `null` → 오늘 날짜 (구매일 자동입력 기능 반영)
  - `logged-in-home.spec.ts` 시나리오 G: 만료일 수정 전 "직접 입력" 버튼 클릭 추가 (유통기한 프리셋 UI 전환 반영)
  - 결과: **288 passed, 2 skipped, 0 failed** 유지
- **재료 상세 설정(DetailFields) UX 전면 개선** — 완료 (2026-05-15)
  - 수량 입력 스핀 화살표 제거 (`[appearance:textfield]` Tailwind arbitrary CSS)
  - 스테퍼 + 단위 드롭다운 통합: `[−][수량 | 단위 ▾][+]` 한 덩어리 레이아웃
  - 수량/용량 동적 레이블: `VOLUME_UNITS` Set 기반 — 단위 미선택 시 "수량 또는 용량", g/ml 등 → "용량", 개/장 등 → "수량"
  - 카테고리 양방향 `<` `>` 화살표 + 마우스 휠 수평 스크롤 (non-passive wheel handler)
  - 구매일 오늘 자동 채우기: `createPendingItem`에서 `new Date().toISOString().slice(0, 10)`
  - 유통기한 프리셋 버튼: 상대 레이블(오늘/3일 후 등) + 실제 날짜(M/D) 표시
  - 유통기한 ↔ 직접 입력 인플레이스 전환: 프리셋 모드 ↔ 구매일+유통기한 양옆 2열 입력
  - "직접 입력" 버튼: 오렌지 아웃라인 pill 스타일 (시인성 개선)
  - "빠른 선택"(backToPresets) 용어 정립: 직접 입력 모드에서 프리셋으로 복귀 버튼
  - `directInputDate` / `backToPresets` i18n 키 8개 locale 추가
  - PR #45 (develop → main) 머지 완료
- **재료 모달 UX 전면 개선** — 완료 (2026-05-15)
  - 비로그인 + 버튼: 데모 추가 → `AuthPromptSheet` (Google/Kakao/이메일 가입 유도 시트)
  - `IngredientForm`: `isSubmitting` 상태 추가 → ghost state 버그 수정, `Promise.all` 병렬 저장
  - `IngredientBrowser` 탭 이름 i18n: 전체·자주·카테고리명 8개 locale 적용
  - `Autocomplete` 검색창: 홈 SearchBar와 동일한 오렌지 글로우 디자인
  - `isSelected` 칩: 연한 테두리+작은✓ → 오렌지 솔리드 배경+SVG 체크 (가시성 향상)
  - 데스크톱 자동 포커스: `pointer: fine` 환경에서만 모달 열릴 때 검색창 자동 포커스
- **데모 재료 글로벌화** — 완료 (2026-05-15)
  - `demoItems.ts` v4: 김치·콩나물·부침가루·간장·참기름 등 한식 특화 → 토마토·버섯·밀가루·파스타·올리브유 등 글로벌 공통 재료
  - `quickAddList.ts`: 두부🟦→🫘, 식용유🛢️→🧴, 후추⚫→🌶️
  - `helpers.ts`: `getEmoji` fallback을 `getIngredientEmoji`로 교체 (정확한 이모지 반환)
  - `POPULAR_ITEMS`: 한국 특화 20개 → 전 세계 공통 16개 (마늘·양파·계란·토마토 등)
- **saves_count 음수 버그 수정** — 완료 (2026-05-14)
  - 트리거(`update_recipe_saves_count`)를 `COUNT(*)` 방식으로 교체 → 정확한 집계
  - `increment_saves_count` / `decrement_saves_count` RPC를 no-op으로 변환 (트리거와 이중 적용 방지)
  - 마이그레이션: `20260514_fix_saves_count_negative.sql` + `20260514_fix_saves_count_rpc.sql` dev+prod 적용 완료
- **레시피 편집 페이지 수정** — 완료 (2026-05-14)
  - `app/[lang]/recipes/[id]/edit/page.tsx`: 하드코딩 한글 7곳 → i18n 키 교체
  - `PUT /api/recipes/[id]`: 태그·재료·단계 전부 삭제 시 빈 배열(`[]`) 미처리 버그 수정 (`Array.isArray()` 패턴)
- **SEO / 퍼포먼스 최적화** — 완료 (2026-05-14)
  - `app/[lang]/recipes/page.tsx`: `export const revalidate = 3600` (ISR 정적 셸 캐시)
  - `AllRecipesClient`: 첫 4장 `priority={index < 4}` (LCP 최적화)
  - `app/[lang]/[username]/layout.tsx` 신규 생성: 프로필 페이지 Server Component `generateMetadata` (OG/Twitter 메타 서버사이드)
  - `app/[lang]/recipes/[id]/page.tsx`: `title.absolute`로 `"레시피명 | 낼름"` 명시
    (`[lang]/layout.tsx`의 `title.absolute`가 root template을 자식에게 전달하지 않는 Next.js 동작 우회)
- **E2E 테스트 전면 정비** — 완료 (2026-05-14)
  - 결과: 48 skipped → **2 skipped**, **288 passed** / 0 failed
  - `auth-fixtures.ts`: `res.status()` → `res.status` 타입 오류 수정
  - `ingredient-autocomplete.spec.ts` / `ingredient-picker-modal.spec.ts`: `auth-fixtures` 사용, 실제 UI(plain text input)에 맞게 재작성
  - `recipe-detail-ssr.spec.ts`: `getPublicRecipeId` href 패턴 `a[href^="/recipes/"]` → `a[href*="/recipes/"]` (i18n `/ko/recipes/` 경로 대응)
  - 전체 E2E spec: i18n lang prefix 경로 호환
  - 잔여 2 skipped: 요리 팁 스크롤 복원 — dev DB에 팁 데이터 없음 (코드 정상, 데이터 환경 문제)
- **자체 행동 분석(Analytics)** — 구현 완료 (2026-05-14)
  - `events` 테이블 dev+prod 적용 (id, user_id?, session_id, event_type, payload jsonb, page, viewport_w/h, ua, created_at + 인덱스 4)
  - RLS: `anon, authenticated` insert / `admin role` select
  - 클라이언트: `lib/analytics/track.ts` — `navigator.sendBeacon` 우선(networkidle 영향 0), `fetch keepalive` fallback
  - **GDPR 게이트**: `CookieConsent.analytics` 동의한 사용자만 트래킹 (미동의 시 `track()` no-op)
  - 자동 페이지뷰: `components/Analytics/PageViewTracker.tsx`가 layout에서 mount, pathname 변경 시 `page_view` 전송
  - 핵심 클릭 트래킹: 펜던트, 만료 배너, FAB(+), 빈 가이드 CTA, 추천 pill, BottomNav 검색, 검색 오버레이 pill, 재료 추가/삭제
  - 수집 API: `POST /api/events` — rate limit 60/분 (user.id 또는 IP), payload 2KB 제한, `event_type` snake_case 검증, user_id 사칭 차단
  - 대시보드 API: `GET /api/admin/analytics/events?days=N` — admin role 확인 후 raw events 반환 (최대 10000행)
  - 대시보드 UI: `/[lang]/admin/analytics/events` — recharts 기반 페이지뷰 추이·Top events·Top pages·디바이스 분포·홈 인터랙션 카운트
  - 기존 `search_history`·`recommendation_history`와 별개 유지 (충돌 없음)
  - 2026-05-16 추가 이벤트: `cart_add_via_{chip,autocomplete,manual}`(cart 카테고리 탭 추가 결정용 — chip vs 검색 비율), `cart_share_created`(공유 실사용), `used_up_toast_shown`/`used_up_to_cart`(다 먹음 토스트 전환율 = 분자/분모). 1~2주 데이터 보고 결정할 보류 이슈용
- **낼름함 (레시피 저장)** — 구현 완료
  - 레시피 카드의 👅 낼름 버튼으로 저장
  - 저장된 레시피는 `/@username` 프로필의 낼름함 탭에서 확인
- **재료 기반 레시피 추천** — 구현 완료 (2026-05-10)
  - `ingredient_id` FK 매칭(정확도 최우선) + 텍스트 매칭 fallback 하이브리드
  - `/recommendations?type=ingredients&mode=ready|almost|all` — 3가지 모드
  - 홈 냉장고 → "🔥 바로 만들 수 있는 레시피 N개" pill → `/recommendations` 연결
- **냉장고 재료 등록 → 추천 플로우** — 구현 완료 (2026-05-10)
  - 재료 추가 시 `ingredient_id` (ingredients_master FK) DB 저장
  - 쇼핑 리스트 → 냉장고 추가 시도 ingredient_id 자동 조회 저장
  - `user_ingredients.ingredient_id` 컬럼 활용으로 추천 정확도 향상
- **다국어 지원 (i18n)** — 전 페이지·컴포넌트 완료 (2026-05-10)
  - 8개 언어 (ko/en/ja/zh/es/fr/de/it) — `lib/i18n/locales/` 각 파일
  - `useI18n()` 훅 패턴으로 전 UI 처리. 하드코딩 문자열 없음
- **비로그인 홈 UX 정비** — 완료 (2026-05-13)
  - 헤더 구조 재정렬: ⋯ 메뉴 좌측(로고 옆), 우측은 [언어][로그인/가입]만 (`t.common.loginOrSignup`)
  - 데모 영역 한 줄 pill 통합 — outlined orange + 펄스, `t.home.demoBadge`/`demoCta`로 정체성("예시 재료로 체험 중") + 가입 CTA 동시 노출
  - 모바일 pill을 fridge container 안 absolute로 → fridge 크기 영향 없음 (모든 viewport overflow 0)
  - 비로그인 시 펜던트(전체 재료 목록) hide → pill과 시각적 겹침 자체 제거
  - 펜던트 cream/wood 톤 (`#f4d8a0` + dark brown) — 빈티지 명패, 노끈/썸택과 색감 통일
  - 데모 칩 신선도 시각화 — 위험(빨강 tint+펄스) / 주의(노랑 tint) / 신선(흰)
  - 데모 시드 v3: `LS_KEY_DEMO_ITEMS = 'naelum_demo_items_v3'` — 냉동 칩에 닭고기 추가(20→21개)
  - AddIngredientModal 비로그인 안내 배너 (`t.ingredient.signupBanner`) — 재료 추가 시 가입 후 저장 가능함을 모달 상단에 명시
  - BottomNav 비로그인 프로필 슬롯 hide — 헤더 [로그인/가입]이 대체, 향후 아이콘 2개 슬롯 확보
  - SearchBar 좌측 돋보기 제거 + placeholder("재료, 요리 검색...") 노출
  - Footer i18n 적용 (`t.footer.copyright`) — 8개 locale
  - 첫 방문 풍선 제거 — pill 자체로 인지 가능 (`firstVisitTip` 키·상수·코드 모두 정리)
  - 키보드 접근성 — chip X 버튼에 `group-focus-within:opacity-100` 추가 (WCAG 2.1)
  - 신규 컴포넌트 작성 시 반드시 `useI18n()` 사용, 한글 하드코딩 금지
  - 네임스페이스: `common`, `auth`, `recipe`, `ingredient`, `comments`, `writeModal`, `tipForm`, `settings`, `nutrition`, `cart`, `cookMode`, `contact` 등

### 이메일 설정 현황
- **도메인 이메일**: `hello@naelum.app` — Cloudflare Email Routing으로 `cobqoc@gmail.com`에 포워딩
- **문의 메일 발신**: Resend 사용, 발신자 `Naelum(낼름) <hello@naelum.app>`
- **문의 수신**: `cobqoc@gmail.com` (`DEVELOPER_NOTIFY_EMAIL`)
- **Gmail 발송 설정**: `cobqoc@gmail.com`에서 `hello@naelum.app`으로 발송 가능

### 관리자 계정
- **이메일**: `cobqoc@gmail.com`
- **사용자명**: `Naelum(낼름)` (프로덕션 DB 기준)

### 보안 / 봇 차단 구현 현황
- **Cloudflare** — naelum.app 앞단에 연결 완료 (무료 플랜)
  - Bot Fight Mode ON, SSL Full (strict), 서울 CDN
- **AI 크롤러 차단** (`proxy.ts`) — GPTBot, ClaudeBot, CCBot, Bytespider, AhrefsBot 등 14종 전체 경로 차단
- **robots.txt** — AI/SEO 봇 명시적 Disallow, 검색엔진(Google/Bing)만 허용
- **Rate Limiting** — Supabase DB 기반 (`lib/ratelimit.ts`, `supabase/migrations/20260411_rate_limits.sql`)
  - 검색: 30회/분 (IP), 추천: 20회/분 (IP), 업로드: 10회/분 (유저ID), 로그인: 5회/15분 (IP+email)
  - Cloudflare IP: `CF-Connecting-IP` 헤더 우선 사용
  - 활성화: Vercel 환경변수 `ENABLE_RATE_LIMITING=true` 설정됨
- **Rate limits 테이블 정리** — 매시간 cron 실행 (`/api/cron/cleanup-rate-limits`)

### 농사로 Open API 현황 (2026-05-08)

> **✅ 승인 완료** — API 키 등록됨 (`.env.local` `NONGSARO_API_KEY`)

- **신청일**: 2026-05-08 / **승인일**: 2026-05-08
- **신청 계정**: 농사로(nongsaro.go.kr) — 개인: 낼름
- **API 기본 URL**: `https://api.nongsaro.go.kr/service/`
- **라이선스**: 공공누리 3유형 (출처표시 + 변경금지) — 원문 그대로 저장, 가공 최소화

#### 신청한 서비스 17개

| 분류 | 서비스 ID | 내용 |
|------|-----------|------|
| **레시피** | `monthFd` | 이달의 음식 정보 (식재료 상세 포함) — **핵심** |
| **레시피** | `nvpcFdCkry` | 향토 음식 |
| **레시피** | ~~`headFamilyFood`~~ (❌ 사용 금지) | ~~종가음식~~ — 데이터 품질 불량으로 폐기. 재임포트 금지 |
| **레시피** | `delicacyKimchi30` | 별미 김치 30선 |
| **레시피** | ~~`gnsnRecipe`~~ (❌ 사용 금지) | ~~인삼레시피~~ — 데이터 품질 불량으로 폐기. 재임포트 금지 |
| **레시피** | `trditAchlqrMnfcturLaw` | 전통주 제조법 |
| **레시피** | `orientalMedicineAlcohol` | 한방약술 |
| **레시피** | `insectFood` | 식용 곤충요리 |
| **식단** | `todayDiet` | 추천 식단 |
| **식단** | `recomendDiet` | 추천식단정보 |
| **재료 백과** | `prvateTherpy` | 약초정보 |
| **재료 백과** | `varietyInfo` | 품종 정보 |
| **재료 백과** | ~~`localSpcprd`~~ (⚠️ 재료 마스터 부적합) | ~~지역특산물~~ — 브랜드/지역명이라 부적합. dev 임포트 후 삭제. 재임포트 금지 |
| **재료 백과** | `foodCommonCode` | 음식 기본 정보 |
| **재료 백과** | `foodbyprdNtrinfo` | 농식품 부산물 영양정보 |
| **i18n** | `korEngDictionary` | 향토음식 한영대역사전 |
| **공통** | `commonCode` | 농사로 공통코드 |

#### 🚫 농사로 폐기된 레시피 API 목록 (재임포트 금지)

`gnsnRecipe`(인삼레시피)와 `headFamilyFood`(종가음식)는 **데이터 품질 불량으로 폐기**. 다시 가져오지 말 것. 같은 문제가 재발한다.

##### `gnsnRecipe` — 인삼레시피 (2026-05-11 폐기, 100개 삭제)
- **재료 파싱 불가능** — 양념장이 `불고기양념장 (간장 5큰술, 배 1/4개, 인삼뿌리 80g, ...)` 식으로 한 줄에 통합돼 있어 콤마 split이 깨짐. 10개 샘플 중 6개에서 `불고기양념장 (간장`, `후춧가루 약간)` 같은 토막 토큰 발생
- **메타데이터 결손** — 원문에 `servings`, `cook_time`, `description`이 아예 없음 (CLAUDE.md 데이터 무결성 규칙상 NULL 유지밖에 못함)
- **이미지 외부 호스팅** — `http://www.nongsaro.go.kr/...` URL이 한국 외 IP(Vercel)에서 502 반환. mixed content 이슈도 있음
- **단계별 사진 없음** — 썸네일 1장이 전부

##### `headFamilyFood` — 종가음식 (2026-05-11 폐기, 257개 삭제)
- **단계(steps) 100% 빈 데이터** — 10개 샘플 모두 `recipe_steps`에 row 0개. 조리법은 `description`에 산문 한 단락 형태로만 들어 있음 ("황태를 갈아서 손으로 보슬보슬 비벼서 보푸리를 만든다..." 식)
- **재료 분량 100% null** — 모든 재료가 `quantity = null, unit = null`. 종가음식 원문 자체가 분량을 명시하지 않는 향토 음식 소개체
- **재료 자체가 없는 경우도** — 예: 쌀뜨물 미역국 `ingredients = null`
- **인삼레시피와 동일한 괄호 파싱 깨짐** — `양념장(간장`, `깨소금)` 같은 토막
- **본질적으로 "레시피"가 아니라 "음식 유래·소개"** — description은 가치 있지만 검색·추천에 쓸 구조화된 데이터가 없음

##### 정상 농사로 API
`korEngDictionary`(한영사전)는 정상. 농사로 API 전체를 막는 것이 아니라 위 두 레시피 API만 사용 금지.

##### ⚠️ `localSpcprd` 주의 — 재료 마스터 임포트 부적합
지역특산물 API 응답은 `K-FOOD`, `㈜한국바이오케미칼`, `강화섬쌀` 같은 **브랜드명·지역명**이라 표준 재료 마스터에 부적합. 2026-05-08에 dev에 976개 임포트했으나 자동완성·영양정보 매칭에 노이즈로 판단되어 **2026-05-11 dev에서 전량 삭제**. prod에는 처음부터 적용 안 됨. 재임포트 금지.

#### 서비스별 임포트 현황 (2026-05-11 기준)

| 서비스 ID | 내용 | 건수 | 스크립트 | 상태 |
|-----------|------|------|----------|------|
| ~~`headFamilyFood`~~ | ~~종가음식~~ | ~~257개~~ | — (스크립트 삭제됨) | 🚫 **2026-05-11 dev+prod 전량 삭제. 재임포트 금지** ([사유](#-농사로-폐기된-레시피-api-목록-재임포트-금지)) |
| ~~`gnsnRecipe`~~ | ~~인삼레시피~~ | ~~100개~~ | — (스크립트 삭제됨) | 🚫 **2026-05-11 dev+prod 전량 삭제. 재임포트 금지** ([사유](#-농사로-폐기된-레시피-api-목록-재임포트-금지)) |
| ~~`localSpcprd`~~ | ~~지역특산물~~ | ~~1,747개 (고유 1,080개)~~ | `scripts/import-nongsaro-locspc.ts` | ⚠️ **2026-05-11 dev에서 976개 삭제** (재료 마스터에 부적합 — 브랜드/지역명). prod 미적용. 재임포트 금지 |
| `korEngDictionary` | 향토음식 한영대역사전 | 5,641개 | `scripts/import-nongsaro-koreng.ts` | ✅ dev+prod 완료 — name_en 업데이트 (식재료명 카테고리만 필터) |
| `foodbyprdNtrinfo` | 농식품 부산물 영양정보 | 34개 | — | 스크립트 미작성 |
| `monthFd` | 이달의 음식 | — | — | ⚠️ API 응답 빈 데이터 (원인 불명, 별도 확인 필요) |
| `nvpcFdCkry`, `todayDiet` 등 | 향토음식·추천식단 등 | — | — | ❌ code 13 (엔드포인트 오류) |

#### prod 적용 명령어
```bash
# 지역특산물 (신규 재료 추가)
npx tsx scripts/import-nongsaro-locspc.ts --import --prod

# 한영사전 (name_en 업데이트)
npx tsx scripts/import-nongsaro-koreng.ts --import --prod
```

---

### 배달 DB (2026-05-16)
- **dev 적용 완료 / prod 미적용** — 출시 결정 시 prod 적용 필요
- 적용된 테이블 7개 (`naelum-dev` jmyrdoguxlizvajfcwep):
  - `delivery_restaurants` / `delivery_menu_categories` / `delivery_menu_items` (`20260516_delivery_schema.sql`, 샘플 식당 6개)
  - `delivery_addresses` / `delivery_orders` / `delivery_order_items` / `delivery_rider_profiles` (`20260517_delivery_orders.sql`)
  - `delivery_truck_locations` + `delivery_restaurants.place_type`(restaurant|food_truck) (`20260518_delivery_food_truck.sql`, 푸드트럭 위치공개). dev 적용·e2e 검증 완료, prod 미적용
  - + `delivery_order_status` enum, 상태 전환 검증 트리거, RLS (소비자·식당owner·라이더·admin 권한 분리)
- **마이그레이션 파일명·순서 주의**: prod 적용 시 `20260516_delivery_schema.sql` → `20260517_delivery_orders.sql` → `20260518_delivery_food_truck.sql` 순서 준수 (orders가 restaurants FK 참조, food_truck이 둘 위에 빌드). 배달 prod 점등 = 이 3개 순서 적용이 선행 조건
- **프로덕션 추가 스키마 문서**: `docs/db/delivery-production-schema.sql` — 미적용 10개 테이블(rider_locations·order_status_history·payment_records·promotions·reviews·notifications·dispatch_log·settlements·business_hours_overrides·device_tokens). 출시 trigger별 적용 가이드 포함. **절대 자동 apply 금지**
- ⚠️ `delivery_restaurants.owner_id`는 `ON DELETE SET NULL` — testUser 삭제 시 식당이 owner_id=NULL orphan으로 남음. e2e beforeEach에서 `name LIKE 'E2E%'` orphan 정리. 향후 `ON DELETE CASCADE` 검토(실 사용자 식당 데이터 손실 위험 있어 보류)
- **cart는 DB 아님** — localStorage 유지 (구매 전 의도, 비로그인 OK). orders/addresses만 DB

### 레시피 DB
- **prod: 1,443개** (published 1,408 + private 35) / **dev: 100개** (published)
- 최종 수정일: 2026-05-13 (MAFF 일본 향토요리 2,050개 dev+prod 전량 삭제)

#### 출처별 구성 (2026-05-13 기준)
| 출처 | 건수 | 상태 | 라이선스 | 임포트 스크립트 | 조건 |
|------|------|------|----------|----------------|------|
| 식품의약품안전처 (COOKRCP01) | ~1,146개 | published | 공공누리 1유형 | `scripts/import-recipes.ts` | 출처 표시 |
| 농림수산식품교육문화정보원 | 537개 | published | 공공누리 1유형 | `scripts/import-mafra-recipes.ts` | 출처 표시, 태그: `농림수산식품교육문화정보원` |
| 한식진흥원 아카이브 | ~70개 | draft | 공공누리 | `scripts/import-hansik-recipes.ts` | 출처 표시 |
| ~~농림수산성 うちの郷土料理 (MAFF)~~ | ~~2,050개~~ | 🚫 **2026-05-13 전량 삭제** | ~~PDL1.0~~ | — | 재임포트 금지 |

> **주의**: 이 레시피들은 한국 공공데이터(data.go.kr) 기반이며, 상업적 이용 시 "출처: 식품의약품안전처" 등 출처 표시 의무 있음.  
> 재임포트 시 스크립트 주석 참고 — 기존 데이터 삭제 후 재삽입 방식.

#### 🚫 MAFF 레시피 폐기 (2026-05-13 DB / 2026-05-16 자료 일괄 정리)

농림수산성(MAFF) 일본 향토요리 2,050개를 **2026-05-13 dev+prod 전량 삭제**. **재임포트 금지** — 일본 레시피는 서비스에서 제외.

**폐기 사유**: 1,365개 번역본 통계 — 단계 평균 4.9개(중앙 4), description 평균 140자. "레시피"보다 "음식 유래·소개" 성격이라 따라하기 부실 (폐기된 농사로 `headFamilyFood`와 동일 패턴). 도감용 글로벌 식재료 보강 가치도 한·일 공통 일부(유자·표고 등)에 한정되고 분량이 비정량.

**삭제 SQL** (참고용):
```sql
DELETE FROM recipes WHERE source_url ILIKE '%maff.go.jp%';
```
CASCADE FK로 recipe_ingredients/steps/tags/comments/likes/saves/views 등 모든 연관 데이터 자동 정리됨 (meal_plan_items·notifications·shopping_list_items은 SET NULL).

**2026-05-16 후속 정리**: 로컬 데이터 `data/maff-*.json` (8.1MB) + 스크립트 6종 (`import-maff-recipes`, `scrape-maff-recipes`, `translate-maff-{batch,gemini,ingredients-db}`, `maff-translations-manual`) 전부 삭제. `ING_MAP` 일본어 재료 번역 사전 포함. 일본 콘텐츠 서비스 제외 결정 확정.

### 재료 DB
- **prod: 2,126개** / **dev: 958개** (`ingredients_master`, 2026-05-11 기준 — dev에서 nongsaro_localSpcprd 976개 + 노이즈/토막 19개 정리, prod에서 노이즈 15개 정리)
- `recipe_ingredients.ingredient_id` 커버리지: **prod 89.7%** (31,957/35,641) / **dev 82.4%** (17,114/20,760)
- name_en 보유: 342개

#### 출처별 구성 (2026-05-10 기준, prod 기준)
| 출처 | 건수 | 라이선스 | 임포트 스크립트 |
|------|------|----------|----------------|
| 레시피 재료 자동 추출 (`recipe_extract`) | 1,423개 | — | `scripts/extract-recipe-ingredients.ts` (dev) / MCP SQL (prod) |
| 한식진흥원 아카이브 (`hansik_api`) | 366개 | 공공누리 | `scripts/import-hansik-ingredients.ts` |
| 수동 입력 / 기타 (`null`) | 154개 | — | — |
| 농촌진흥청 수동 (`rda_manual`) | 143개 | 공공누리 | — |
| Open Food Facts 글로벌 재료 (`open_food_facts`) | 55개 | ODbL | `scripts/import-off-ingredients.ts` |

#### 영양정보 채우기 (2026-05-11 기준)
| 환경 | 영양정보 보유 | 출처 |
|------|--------------|------|
| **prod** | 152개 / 2,141 (7.1%) | rda_manual 143 + open_food_facts 9 |
| **dev** | 173개 / 977 (17.7%) | rda_manual 135 + open_food_facts 38 |

#### 🚫 폐기된 영양정보 자동 sync 스크립트 (2026-05-11)

`sync-ingredient-nutrition.ts`(식약처 I2790)·`sync-ingredient-nutrition-rda.ts`(농촌진흥청) **둘 다 폐기**. 다시 만들거나 같은 패턴으로 시도하지 말 것.

**폐기 사유 — 두 스크립트 공통 결함**
- 매칭 로직이 너무 느슨 (`food_Nm.includes(name)` 단순 부분 포함)
- 재료명 정규화 부재 → `간 장`이 `장문볼락(생선)`에 매칭되는 등 광범위 오매칭
- `(옥수수가루/물 =`, `고추5g`, `감자 찌는 물` 같은 토막 재료명을 그대로 매칭 시도
- 결과: dev에서 **136개**, prod에서 **240개**의 잘못된 영양정보 오염 → 전량 NULL 처리

**현재 신뢰 영양정보**
- `rda_manual` (수동 입력) — 100% 신뢰. 표본 검증 완료
- `open_food_facts` (글로벌 영양 데이터) — 표본 검증 완료
- 그 외 자동 매칭으로 들어간 영양정보는 모두 폐기됨

**향후 영양정보 확장 방향**
- 자동 매칭 sync **금지**. 정확도 보장 안 됨 (검증된 SDK도 80% 정확도 이하)
- 표준 재료(쌀·간장·두부 등) 200개 단위로 **수동 입력** (`rda_manual` 방식)
- 또는 검증된 외부 데이터(Open Food Facts API 등) 직접 매핑

**RDA API 캐시**: `scripts/cache/rda-food-list.json` (2,765개 A~T 그룹 전체 — 완전). 향후 수동 매핑 시 참고 자료로 보존 가능

### 요리 팁
- 10건 (`tip` 테이블)

---

## 🚧 홈페이지에서 임시 제거된 기능 (배포 후 추가 예정)

페이지 자체는 존재하며 URL 직접 접근 가능. 홈 빠른 링크에서만 제거한 상태.

| 기능 | 라우트 | 제거 위치 | 복구 방법 |
|------|--------|-----------|-----------|
| 요리 도감 | `/[lang]/ingredients` | `app/page.tsx` 빠른 링크 | `{ icon: '📚', label: '요리 도감', href: '/ingredients' }` 추가 |

---

## 📚 요리 도감 (Cook's Guide) — 로드맵

**기존 "재료 백과사전"을 "요리 도감"으로 확장.** 재료에서 시작해 데이터가 쌓이는 단계별로 콘텐츠를 추가하는 방향.

### 구조: 허브 + 서브페이지

```
/[lang]/ingredients              ← 현재 페이지 (재료 — Phase 1, 리뉴얼 진행 중)
/[lang]/reference                ← 허브 페이지 (카드 링크 모음, 미구현)
/[lang]/reference/tools          ← 조리 기구 (Phase 2)
/[lang]/reference/techniques     ← 조리 기법 (Phase 2)
/[lang]/reference/glossary       ← 용어 사전 (Phase 3)
/[lang]/reference/conversions    ← 단위 변환 (Phase 3)
```

> 각 서브페이지가 독립 URL → SEO 이점. 탭 단일 페이지는 URL 하나라 SEO 효과 없음.

### 콘텐츠 채우기 전략

| 카테고리 | 채우기 방법 | 상태 |
|---|---|---|
| 재료 | ingredients_master DB 2,126개 (prod) — 이미 있음 | 🔄 리뉴얼 진행 중 |
| 단위 변환 | 정적 데이터, 코드 하드코딩 | ⬜ Phase 3 예정 |
| 조리 기구·기법 | 레시피 태그에서 자동 집계 (레시피↑ → 콘텐츠↑) | ⬜ Phase 2 예정 |
| 용어 사전 | 농사로 한영사전 5,641개 필터링 활용 | ⬜ Phase 3 예정 |

### ❌ 콘텐츠 작성 원칙

- **사용자 기여 글쓰기 기능 별도 추가 금지** — 사용자 수 적을 때 아무도 안 씀, 검수 부담
- **AI 생성 콘텐츠 DB 삽입 금지** — CLAUDE.md 데이터 무결성 규칙 위반
- **자동화는 레시피 태그 집계에 한정** — 레시피에서 등장한 기구·기법 태그 → 레퍼런스 페이지 자동 생성

### i18n 네이밍

| lang | navIngredients (nav) | browseTitle (페이지 h1) |
|---|---|---|
| ko | 요리 도감 | 요리 도감 |
| en | Cook's Guide | Cook's Guide |
| ja | 料理図鑑 | 料理図鑑 |
| zh | 料理图鉴 | 料理图鉴 |
| es | Guía culinaria | Guía culinaria |
| fr | Guide culinaire | Guide culinaire |
| de | Kochführer | Kochführer |
| it | Guida culinaria | Guida culinaria |

### 요리 도감 페이지 리뉴얼 (2026-05-14 진행 중)

#### 현재 페이지 문제점 (dev 확인)
- 카테고리 내 모든 재료가 동일 이모지 (채소=🥬, 육류=🥩) → 시각적 구별 불가
- 그리드 카드가 크고 비어있음 — 이모지+이름만 표시
- 전체 카테고리 클릭 시 0개 표시 버그
- 재료 클릭 시 상세 패널에 데이터가 없는 경우 많음 (DB fill rate 0~7%)

#### DB 데이터 현황 (dev 100개 샘플 기준)
| 필드 | 채움률 |
|---|---|
| 이름/카테고리 | 100% |
| 맛(tastes) | 7% |
| 영양정보 | 7% |
| 설명·보관법·제철·페어링·이미지 | 0% |
| 가격 정보 | DB에 없음 |

#### 새 레이아웃 방향
- **그리드 → 리스트 뷰**: 한 행에 이름+영문명+제철+맛 태그 인라인 표시. 데이터 밀도 높음
- **검색 우선**: 검색바를 페이지 상단 중앙에 크게 배치
- **카테고리 카드**: 작은 pill 대신 큰 아이콘 카드로 카테고리 선택
- **상세 패널 구조화**: 향후 가격·영양·마트 데이터 수용 가능한 섹션 구조

---

## 💰 재료 가격 정보 — 로드맵 (2026-05-14 설계)

### 데이터 소스 2가지

| 소스 | 성격 | 대상 품목 | 신뢰도 |
|---|---|---|---|
| **KAMIS API** | 전국 평균 시세 (공식, 참고용) | 농산물·축산물·수산물 | 정부 공식, "참고용" 명시 |
| **사용자 영수증** | 실거래가 (크라우드소싱) | 가공식품·양념 포함 전체 | 실제 구매가, 지역 편차 있음 |

> KAMIS와 사용자 영수증은 겹치지 않고 보완 관계 — 두 개 합치면 완전한 가격 정보

### KAMIS API (Phase 1)
- 공공데이터포털(data.go.kr)에서 API 키 신청 필요 (무료, 즉시 승인)
- 소매가(대형마트·전통시장 구분) / 도매가(가락시장) / 중도매인 판매가 제공
- 일별·월별·연도별 데이터 → 가격 변화 그래프 가능
- 환경변수: `KAMIS_API_KEY`

### 사용자 영수증 가격 저장 (Phase 1)
현재 `match-receipt` API가 가격을 버리고 있음 (34번 줄 `.replace(/[\d,]+\s*원/g, '')`).
이 부분을 수정해서 가격도 함께 파싱·저장.

#### 신규 DB 테이블

```sql
-- 마트/가게 (Kakao 장소 API 결과 캐시)
CREATE TABLE stores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,   -- "이마트 강남점"
  brand           VARCHAR(50),             -- "이마트"
  store_type      VARCHAR(30),            -- 대형마트|편의점|전통시장|온라인
  address         TEXT,
  lat             DECIMAL(10, 7),
  lng             DECIMAL(10, 7),
  kakao_place_id  VARCHAR(50),            -- 중복 방지
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 영수증 가격 리포트
CREATE TABLE ingredient_price_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id   UUID REFERENCES ingredients_master(id),
  store_id        UUID REFERENCES stores(id),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  price           INTEGER NOT NULL,        -- 구매 가격 (원)
  quantity        DECIMAL,
  unit            VARCHAR(20),
  price_per_unit  DECIMAL,                -- 100g당 가격 (정규화 핵심)
  purchase_date   DATE,
  source          VARCHAR(20) DEFAULT 'receipt',  -- receipt | manual
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

> `price_per_unit` 정규화 필수 — 단위 다른 가격을 비교하려면 100g당으로 통일

### 마트 지도 기능 (Phase 3 — 사용자 1,000명+ 이후)

- **지도 API**: Kakao Maps (한국 데이터 정확, 무료 월 300만 건)
- 마트 DB는 직접 구축 금지 — Kakao 장소 API로 실시간 검색 후 캐시
- 마트명 파싱: OCR 자동 시도 → 실패 시 사용자 확인 UI

**UI 흐름:**
```
재료 선택 → 내 주변 마트 지도 + 가격 말풍선
           → 거리순 / 가격순 정렬
```

**데이터 없을 때 지도 오픈 금지** — 데이터 먼저 쌓고 지도는 1,000명+ 이후 오픈

### 구현 우선순위
```
1. 요리 도감 페이지 리뉴얼 (현재)
2. ✅ ingredient_price_reports + stores 테이블 생성 (2026-05-16, dev+prod)
3. ✅ match-receipt API 수정 (가격 파싱 추가) + POST /api/ingredients/price-report (2026-05-16)
4. 영수증 OCR UI 연결 — 현재 match-receipt 호출처 없음. UI에서 price-report 호출하면 가격 축적 시작
5. KAMIS API 키 발급 + 연동
6. 재료 상세 패널에 가격 정보 표시
7. 지도 기능 (사용자 1,000명+ 이후)
```

> **2026-05-16 상태**: 가격 파싱·저장 인프라(2·3) 완료. `match-receipt`가 `parsedPrice/Quantity/Unit` 반환, `price-report`가 `price_per_unit` 정규화 후 저장. **남은 건 영수증 OCR UI 연결(4)** — 그게 생기면 사용자 영수증 → 자동 가격 축적. KAMIS(5)는 공공데이터포털 `KAMIS_API_KEY` 발급 필요

---

## 🥬 재료 stock 정확 추적 — 로드맵 (2026-05-15 설계)

> **현재 한계 (인정)**: 우리 데이터는 *사용자 의도/기억의 스냅샷*이지 실제 stock 아님.
> 수량·단위는 사용자가 입력한 시점의 값이고, 실제 소비량은 추적 안 함.

### 왜 정확 추적이 어려운가
- **추가 자체가 부정확** — "양파 1개"라 적었지만 큰 거/작은 거 다름
- **소비 추적 거의 불가능** — 사용자가 우리 앱 레시피로만 요리한다는 보장 없음, 즉흥 요리·간식 많음, 일부 사용(반개 등)
- **단위 변환 지옥** — 큰술↔ml↔g↔개 (재료마다 밀도 다름)
- **상함·버림·선물** 추적 안 됨

따라서 단기에는 **"보유 여부 표시"** 수준으로만 처리. 정확한 수량 비교는 *기대하지 않음*.

### 단기 (현재 구현 방향)
cart에 레시피 재료 담을 때 **"보유 재료 마크"만 표시** + **토글로 cart 제외** (수량 비교 안 함):
```
🥚 양파 2개  [냉장고에 있음 ⚠️]   ← 사용자가 부족분 직접 판단
🥩 소고기 300g [없음]
```
구현 단순, 사용자 부담 없음, 거짓 정확성 회피.

### 장기 (사용자 100명+ 이후 단계별)

#### Phase 1 — "만들어봤어요" 기록 시 재료 자동 차감 (우선)
- 사용자가 cookMode 완료 시 레시피 재료를 `user_ingredients`에서 자동 차감
- 같은 단위면 정확 차감, 다른 단위는 사용자에게 확인 모달
- **트리거**: cookMode 사용자 50명+ 안정화 후
- **효과**: 차감 정확도 50% → 80% (앱 안에서 요리하는 경우만 커버)
- DB: `recipe_consumption_log` 테이블 (recipe_id, user_id, consumed_at, items[])

#### Phase 2 — 영수증 OCR + 자동 추가
- 이미 설계됨 (`match-receipt` API). 추가는 영수증, 소비는 cookMode 기록 → 양방향 자동
- **트리거**: 가격 정보 로드맵 Phase 2와 함께
- **효과**: 추가 정확도 70% → 95%

#### Phase 3 — 재료 사용 추적 옵션 (고급 사용자)
- 일반 사용자에겐 노출 안 함 (부담 큼)
- 고급 사용자 토글로 활성: 매 요리 시 사용량 입력 UI
- **트리거**: 사용자 1,000명+ 이후, 명시적 수요 확인 후
- **위험**: 대부분 사용자가 1주일 만에 포기하는 패턴 (AnyList, Whisk 사례)

#### Phase 4 — 자체 학습 보정 (장기)
- 사용자 패턴 분석 → "이 사용자는 양파를 평균 2일에 1개씩 사용" 같은 통계 기반 추정
- **트리거**: 사용자 5,000명+ + 충분한 데이터 축적 후
- 별도 ML 모델 필요. 단독 우선순위 낮음.

### 🚫 안 할 것
- 처음부터 "정확 stock 관리" 강제 — 사용자 부담만 큰 무덤
- 단위 변환 정확도 100% 추구 — 가능한 범위 내에서만
- 사용자가 모든 소비 입력하도록 요구 — 대부분 안 함, 데이터만 partial

### 정리: 우선순위
```
1. 보유 마크 + cart 토글 (단순) ← 현재 방향
2. cookMode 자동 차감 (사용자 50명+)
3. 영수증 OCR 통합 (가격 로드맵과 함께)
4. 고급 사용자 추적 모드 (1,000명+)
5. ML 기반 학습 보정 (5,000명+)
```

