# GDPR·개인정보 준수 체크리스트

> **이 문서의 목적**: 현재 구현된 GDPR 준수 사항과 **아직 안 한 일 + 언제 해야 하는지**를 한눈에 보기 위함. 사용자 증가·수익화 단계마다 이 문서를 확인해서 필요한 작업 진행.

**마지막 업데이트**: 2026-10-04 (문서↔앱 동기화 — 데이터 이동권·연령 gate 구현 반영, 카카오 고지 누락 발견) / 이전: 2026-04-21 (약관·정책 내부 일관성 정리)
**현재 준수 수준**: 🟢 실무적 준수 (85~90% — CLAUDE.md 와 같은 표기) — 소규모 비수익 단계에서 충분. 단 아래 "🔴 고지 누락" 1건은 트리거와 무관하게 사실 불일치

---

## ✅ 완료된 준수 사항

| 항목 | 구현 위치 |
|---|---|
| 쿠키 사전 동의 UI (3-way) | `components/CookieConsent.tsx` |
| 세분화 카테고리 (Essential/Analytics/Marketing) | `lib/cookieConsent/types.ts` |
| 동의 철회 UI | `components/Settings/AccountTab.tsx` (쿠키 설정 재오픈) |
| Version 관리 (정책 변경 시 재동의) | `CURRENT_CONSENT_VERSION` 상수 |
| Sentry 동의 기반 게이팅 | `instrumentation-client.ts` |
| DB 감사 기록 (version + timestamp) | `profiles.cookie_consent_*` 컬럼 |
| Terms·Privacy 동의 타임스탬프 (GDPR Art. 7) | `profiles.terms_agreed_at`, `privacy_agreed_at` |
| 연령 gate (GDPR Art. 8, COPPA) — 16세 이상만 가입, 생년월일 필수 | `lib/auth/ageGate.ts`(`MIN_AGE = 16`) — 클라(`app/[lang]/signup/set-password`·`app/[lang]/auth/terms-agreement`) + 서버(`/api/auth/complete-onboarding`) 이중 검증 |
| 알림 수신 설정 — **이메일 알림 기능은 없음**(`profiles.email_notifications` 는 `20260405_feature_additions.sql` 이 DROP — 실DB 잔존 여부는 미확인). 토글은 유통기한 알림(`profiles.push_notifications`, UI 기본 ON) 하나 — 웹 푸시는 브라우저 권한·구독 시에만 발송 | `components/Settings/NotificationsTab.tsx` |
| GDPR 8대 권리 안내 | `/privacy` 페이지 |
| 쿠키 정책 별도 페이지 | `/cookies` |
| 제3자 서비스 공개 | `/cookies` (Supabase·Vercel·Cloudflare·Sentry) — ⚠️ 카카오 미기재(아래 #16) |
| 국제 데이터 이전 설명 (SCC·DPF) | `/privacy` GDPR 섹션 |
| 8개 언어 다국어 지원 | `lib/i18n/locales/*.ts` |
| 계정 삭제 기능 | `components/Settings/AccountTab.tsx` |
| 데이터 이동권 — "내 데이터 다운로드"(본인 데이터 JSON) | `app/api/users/export/route.ts`(GET) + 설정 > 계정 `components/Settings/AccountTab.tsx`(`handleExportData`) |
| 수탁업체 공개 (Supabase·Vercel·Cloudflare·Sentry·Resend·Google) — ⚠️ 카카오 누락이라 "전면"은 아님(아래 #16) | `/privacy` 제5조 |
| 민감정보(알레르기) Art. 9 별도 고지 | `/privacy` 추가 고지 |
| 콘텐츠 신고 처리 SLA 명시 (DSA·정보통신망법) | `/terms` 제9조 |
| 개인정보 유출 72시간 통보 방침 *대외 고지* (내부 대응 절차는 미작성 — 아래 #10) | `/privacy` 추가 고지 |

---

## ⚠️ 미완 항목 (Trigger 조건별 분류)

### 🔴 Trigger 무관 — 고지 누락 (현재 앱 동작과 정책 문서 불일치)

#### 16. 카카오(Kakao) 수탁·제3자 고지 누락
- **현재 상태**: 앱은 카카오를 **소셜 로그인 제공자**(`supabase.auth.signInWithOAuth({ provider: 'kakao' })` — `app/[lang]/signin/page.tsx`·`app/[lang]/signup/SignupClient.tsx`·`components/Auth/AuthPromptSheet.tsx`)와 **공유 SDK**(`components/Recipes/ShareButton.tsx`, CSP 의 kakao 도메인 — `next.config.ts`)로 쓰지만, `app/[lang]/privacy/page.tsx`·`app/[lang]/cookies/page.tsx` 에 카카오 언급이 0건이다(소셜 로그인 수집 항목도 Google 만 기재).
- **해야 할 일**: `/privacy` 수탁업체·국외이전·소셜 로그인 수집 항목과 `/cookies` 제3자 목록에 카카오 추가 → 동의 버전 bump(아래 "업데이트 규칙"). 법적 본문 변경이라 사용자 결정·검토 후 진행.

### 🟡 Trigger: EU 사용자 100명+ OR 수익 발생

#### 1. Privacy Policy 변호사 검토
- **현재 상태**: AI 생성 초안 기반 — **변호사 검토는 미수행**. `/privacy` 상단의 DRAFT 경고 박스는 2026-04-25 제거됨(`f9a7fb0` "개발 초안 경고 제거") — 현재 상단은 제목·최종 수정일·`LegalKoreanOnlyNotice`
- **해야 할 일**:
  - 변호사 검토 (스타트업 대상 30~80만원 / EU 법무 €500~€2000)
  - 검토 결과를 `app/[lang]/privacy/page.tsx` 본문에 반영
  - 보관 기간·법적 근거 등 세부 수치를 실제 서비스 운영 방식과 맞춤
- **파일**: `app/[lang]/privacy/page.tsx`
- **예상 소요**: 1~2주 (변호사 커뮤니케이션 포함)

#### 2. Terms of Service 변호사 검토
- **현재 상태**: `/terms` 페이지 존재 — 초안 가능성
- **해야 할 일**: Privacy와 함께 검토
- **파일**: `app/[lang]/terms/page.tsx`

### 🟡 Trigger: 사용자 1,000명+ OR EU 메인 시장

#### 3. Cloudflare Data Localization 설정
- **현재 상태**: 기본 라우팅 (지리적으로 가까운 엣지로 자동)
- **해야 할 일**:
  - Cloudflare 대시보드 → **Network** → "Data Localization Suite" 확인
  - EU 사용자 전용 EU-only 라우팅 설정 (Enterprise 플랜 $$$)
  - 또는 Vercel Edge Region을 EU로 고정
- **참고**: https://www.cloudflare.com/products/data-localization-suite/
- **비용**: Cloudflare Enterprise 월 $200+

#### 4. 제3자 처리자(DPA) 계약 확인
- **현재 상태**: Supabase·Vercel·Sentry 약관 암묵적 동의
- **해야 할 일**:
  - 각 서비스의 Data Processing Agreement(DPA) 공식 체결
  - Supabase: https://supabase.com/legal/dpa
  - Vercel: Team 플랜부터 DPA 제공
  - Sentry: https://sentry.io/legal/dpa/
- **비용**: 대부분 무료 (약관 서명만)

### 🟡 Trigger: 첫 사용자 데이터 요청·삭제 요청 시

#### 5. 데이터 이동권 (Portability) 엔드포인트 ✅ (구현 완료 — 위 "완료된 준수 사항" 표)
- **현재 상태**: 구현됨 — `GET /api/users/export`(`app/api/users/export/route.ts`, 본인 데이터를 여러 테이블에서 모아 JSON 으로 반환. 이동권상 전체 컬럼이 요구사항이라 `select('*')` 면제) + 설정 > 계정 탭 "내 데이터 다운로드"(`components/Settings/AccountTab.tsx` `handleExportData` → `naelum-data-YYYY-MM-DD.json`)
- (작성 당시 기록: "코드 없음 — 수동 처리 필요, 예상 4~6시간")

#### 6. 삭제권 (Right to Erasure) 자동화 검증
- **현재 상태**: 계정 삭제 기능 있음 (✅) — 실제로 모든 데이터 지워지는지 확인 필요
- **해야 할 일**:
  - 삭제 후 남는 테이블 체크 (user_ingredients, recipes, comments, follows 등)
  - CASCADE DELETE 설정 확인
  - 로그·분석 데이터도 90일 내 익명화
- **파일**: `app/api/users/delete/route.ts` — 핵심은 `supabase.rpc('delete_user')`(auth.users 삭제 → ON DELETE CASCADE 의존). 이 함수 정의는 prod DB 에만 있고 리포에 없다가 2026-10-04 `supabase/migrations/20261004_backfill_delete_user_fn.sql` 로 백필됨(미적용, prod 정의와 동일) — 새 환경에선 이 마이그레이션 적용이 전제

### 🟡 Trigger: 사용자 10,000명+ OR 민감정보 처리 시작

#### 7. DPIA (Data Protection Impact Assessment)
- **현재 상태**: 미수행
- **필요한 경우**:
  - 대규모 민감정보 처리 (건강·식단 알레르기 등) → **알레르기 정보 있음**
  - 자동화된 의사결정 (AI 추천)
- **해야 할 일**: 공식 DPIA 문서 작성 (영향도 분석)
- **템플릿**: https://gdpr.eu/data-protection-impact-assessment-template/

#### 8. 데이터 처리 기록 (GDPR Art. 30)
- **현재 상태**: 내부 문서 미작성
- **해야 할 일**: 처리하는 개인정보 카테고리, 처리 목적, 수신자, 보관 기간 등 문서화
- **면제**: 250명 미만 고용 조직은 저위험 처리는 면제 (현재 해당)

### 🟡 Trigger: 미성년자 서비스 명시 시점

#### 9. 만 16세 미만 동의 ✅ ("16세 이상만 가입" 방식으로 구현)
- **현재 상태**: 생년월일 필수 + 16세 미만 가입 차단 — `lib/auth/ageGate.ts`(`MIN_AGE = 16`), 클라(`app/[lang]/signup/set-password/page.tsx`·`app/[lang]/auth/terms-agreement/page.tsx`) + 서버(`app/api/auth/complete-onboarding/route.ts`: 미입력 `birth_date_required`·미달 `age_gate` 400) 이중 검증
- **GDPR 요구**: 16세 미만은 부모 동의 필요 (국가별 13~16세로 조정) — 현재는 가입 자체를 막는 쪽
- **남은 결정**: 16세 미만 부모 동의 절차를 둘지(아동 타겟팅 여부 — 비즈니스 결정)

### 🟡 Trigger: 첫 보안 사고 시

#### 10. 데이터 유출 통보 절차
- **현재 상태**: 대외 고지(72시간 통보 방침)는 `/privacy` 에 있음. **내부 절차(Incident Response Plan)·연락 채널은 미작성**
- **GDPR 요구**: 유출 인지 후 **72시간 내** 감독기관 통보 + 고위험 시 사용자 통보
- **해야 할 일**:
  - Incident Response Plan 문서화
  - 연락 채널 (이메일·Status Page) 준비
  - Sentry 알림 → 개발자에게 즉시 전달

### 🟡 Trigger: 사용자 간 신고·분쟁 발생 시

#### 11. 콘텐츠 moderation SLA 명시 ✅ (2026-04-21 완료)
- **완료**: `/terms` 제9조에 카테고리별 처리 기한 명시
  - 아동·긴급 위해: 24시간 이내 / 스팸·저작권: 3영업일 / 기타 위반: 7영업일
- **근거**: EU Digital Services Act (DSA), 한국 정보통신망법

#### 12. 신고·차단 시스템
- **현재 구현**: `app/api/users/[username]/report`, `/block` 존재
- **부족**:
  - 자동 스팸 감지 없음 (수동 검토만)
  - 차단 후 상호작용 완전 차단 검증 안 됨
  - 공개 transparency report 없음
- **해야 할 일** (1,000명+ 시점):
  - 월간 transparency report 공개 (신고 수·조치 수 통계)
  - 차단 테스트 케이스 작성

### 🟡 Trigger: 트래픽 1만+ OR 마케팅 발송 시

#### 13. 이메일 마케팅 법적 요건
- **현재 상태**: 마케팅 메일 미발송 (Resend 트랜잭션만)
- **발송 시 필요**:
  - 이메일 하단 **"구독 취소" 링크** (CAN-SPAM 필수)
  - 발송자 식별 (회사명·주소)
  - 한국: 수신동의일자·거부 방법 명시 의무
- **Prep**: 이미 `marketing_consent` 컬럼 있음 → 발송 시 filter만 추가

### 🟡 Trigger: 월간 활성 10k+ OR 수익 발생

#### 14. 웹 접근성 (WCAG 2.1 AA) 공식 감사
- **현재 상태**: `AccessibilityProvider` 있음 (reduce-motion·high-contrast·keyboard shortcut)
- **부족**:
  - 공식 WCAG 2.1 AA 감사 미수행
  - 이미지 alt 텍스트 일괄 검증 안 됨
  - 색상 대비율 측정 안 됨
- **규제**:
  - 미국 **ADA Title III** — 웹사이트 적용 판례 증가
  - EU **European Accessibility Act (EAA)** — 2025년 6월 발효
- **해야 할 일**: axe-core/Pa11y 자동 스캔 → 전문 감사 → VPAT 문서

#### 15. 보안 취약점 제보 절차
- **현재 상태**: security.txt 없음
- **해야 할 일**:
  - `public/.well-known/security.txt` 생성
  - 제보 이메일 (`security@naelum.app` 등)
  - 책임 있는 공개 정책 (90일 등)

---

## 🟢 저위험 · 여유 있으면 개선

### 11. 동의 박스 시각적 편향 최소화
- **현재**: "모두 수락" 버튼이 accent-warm 배경 (강조) vs "필수만" (outline)
- **독일·프랑스 엄격 해석**: 둘 다 중립적이어야 함
- **회색지대**: 대부분 국가에서 현재 허용
- **해야 할 일** (선택): 두 버튼 동일 스타일로 변경
- **파일**: `components/CookieConsent.tsx`

### 12. 쿠키 정책 변경 이력 공개
- **현재**: 최종 업데이트 날짜만 표시
- **권장**: 변경사항 히스토리 테이블 (언제·뭘 바꿨는지)
- **파일**: `app/[lang]/cookies/page.tsx`

---

## 📊 체크리스트 활용법

1. **월 1회** 이 문서 훑어보기
2. 앱 MAU·EU 사용자 비율 확인 → trigger 매칭
3. 새 기능 런칭 전 "Privacy Impact" 체크 → 이 문서 업데이트
4. 수익화·투자 유치 시점 → 전면 변호사 검토 실행

## 🔧 업데이트 규칙

- **쿠키 정책 본문 변경 시**:
  1. `lib/cookieConsent/types.ts`의 `CURRENT_CONSENT_VERSION++`
  2. 변경 내용 이 문서에 기록
  3. 전 유저에게 재동의 배너 자동 표시됨
- **제3자 서비스 추가 시**:
  1. `/cookies` 페이지에 서비스 추가
  2. `/privacy` 국제 이전 섹션 업데이트
  3. 동의 버전 bump

---

## 📞 비상 연락

- 개인정보보호법(한국) 문의: 개인정보보호위원회 privacy.go.kr
- GDPR 관련: EU 각국 DPA (독일 BfDI, 프랑스 CNIL 등)
- 스타트업 법률 지원: 창업넷, 대학 법률상담소
