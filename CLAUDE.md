# 꼬르륵 (Recipe Sharing Web App) - 프로젝트 요구사항 명세서

## 💻 기술 스택 (현재 프로젝트 기준)

### Frontend
- **Framework**: Next.js 16.2.3 (App Router)
- **Library**: React 19.2.3
- **Styling**: Tailwind CSS 4 (@tailwindcss/postcss)
- **Language**: TypeScript 5.x

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

## 📜 개발 규칙
- **컴포넌트**: 모든 새로운 컴포넌트는 `app/` 디렉토리 내의 App Router 컨벤션을 따릅니다.
- **TypeScript**: `any` 타입 사용을 지양하고 인터페이스/타입을 명확히 정의합니다.
- **Client/Server**: 기본적으로 Server Components를 사용하며, 인터랙션이 필요한 경우에만 `'use client'`를 사용합니다.
- **스타일링**: Tailwind CSS 4의 유틸리티 클래스를 우선적으로 사용하며, 변수는 `globals.css`의 CSS 변수를 활용합니다.
- **데이터 무결성**: DB 또는 파일에 데이터를 삽입할 때, 출처에서 확인되지 않은 가짜 데이터나 추정 데이터를 절대 삽입하지 않습니다. 확인할 수 없는 값은 NULL 또는 빈 값으로 남겨둡니다.

---

## 📋 프로젝트 개요

**프로젝트명**: 꼬르륵 (Ggoreureuk)  
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
│ [꼬르륵 아이콘]              [로그인/프로필] │
└─────────────────────────────────────────────┘
```

#### 스크롤 후
```
┌─────────────────────────────────────────────┐
│ [꼬르륵]  [────검색바────]  [로그인/프로필] │
└─────────────────────────────────────────────┘
```

**헤더 기능 명세**
- 좌측: 꼬르륵 로고/아이콘 (클릭 시 홈으로)
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
│      [꼬르륵 로고]            │
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

### 다국어 처리
- **자동 언어 감지**
  - 브라우저 언어 설정 우선
  - IP 기반 국가 감지 (보조)
  - 사용자 수동 선택 옵션

- **번역 범위**
  - UI 텍스트 전체
  - 에러 메시지
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
- [ ] 사용자 인증 시스템
- [ ] 기본 레시피 CRUD
- [ ] 검색 기능 (기본)
- [ ] 반응형 UI
- [ ] 다국어 지원 (한/영)

### Phase 2: 핵심 기능 (2-3개월)
- [ ] 재료 기반 추천
- [ ] 저장/북마크 기능
- [ ] 레시피 따라하기 모드
- [ ] 소셜 기능 (만들어봤어요, 댓글, 공유)
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
**버전**: 1.1.0  
**최종 수정일**: 2026-04-12  
**작성자**: 꼬르륵 개발팀

---

## 📌 데이터 현황 (2026-04-12 기준)

### 기능 구현 현황
- **낼름함 (레시피 저장)** — 구현 완료
  - 레시피 카드의 👅 낼름 버튼으로 저장
  - 저장된 레시피는 `/@username` 프로필의 낼름함 탭에서 확인

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

### 레시피 DB
- **레시피 1,753개** — 전부 공개(published) 상태

### 재료 DB
- 총 605개 재료 (`ingredients_master`)

### 요리 팁
- 1건 (`tip` 테이블) — "양파 손질·보관법 완전 정리"

---

## 🚧 홈페이지에서 임시 제거된 기능 (배포 후 추가 예정)

페이지 자체는 존재하며 URL 직접 접근 가능. 홈 빠른 링크에서만 제거한 상태.

| 기능 | 라우트 | 제거 위치 | 복구 방법 |
|------|--------|-----------|-----------|
| 재료 백과사전 | `/ingredients/browse` | `app/page.tsx` 빠른 링크 | `{ icon: '📚', label: '재료 백과사전', href: '/ingredients/browse' }` 추가 |

