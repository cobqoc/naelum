# 낼름 아키텍처 가이드

이 문서는 새 기능을 추가할 때 따라야 할 패턴과 피해야 할 안티패턴을 박제한다.
2026-04 성능 최적화 사이클에서 발견한 교훈을 기반으로 작성됨.

---

## 🎯 핵심 원칙

**"데이터는 가능한 한 서버에서, 인터랙션은 클라이언트에서"**

모바일 LCP를 "Good" 범위(<2.5s)에 유지하려면 초기 HTML에 실제 콘텐츠가 포함되어야 한다.
클라이언트 `useEffect`로 데이터를 fetch하는 순간 waterfall이 발생해 섹션이 뒤늦게 랜딩한다.

---

## 🗺 페이지를 새로 만들 때

### ✅ DO — 서버 컴포넌트를 기본으로

```tsx
// app/[lang]/recipes/[id]/page.tsx (개념 예시 — 실제 레시피 상세는 lib/queries/recipeDetail.ts 경유)
import { createClient } from '@/lib/supabase/server'
import { getVerifiedUserIdFromHeaders } from '@/lib/supabase/middleware'

export default async function RecipePage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const userId = await getVerifiedUserIdFromHeaders()  // 미들웨어가 주입

  // 필요한 데이터를 모두 병렬로 fetch
  const [recipe, userContext] = await Promise.all([
    supabase.from('recipes').select('...').eq('id', id).maybeSingle(),
    userId ? supabase.from('recipe_saves').select('...').eq('user_id', userId) : null,
  ])

  if (!recipe.data) notFound()

  return <RecipeClient recipe={recipe.data} userContext={userContext?.data} />
}
```

### ❌ DON'T — 페이지 루트에 `'use client'`

```tsx
// ❌ 이렇게 하면 SSR 없음 → TTFB 후 빈 화면 → JS 로드 → fetch → render
'use client'
export default function RecipePage({ params }) {
  const [recipe, setRecipe] = useState(null)
  useEffect(() => { fetch(...).then(setRecipe) }, [])
  if (!recipe) return <Spinner />
  return <div>{recipe.title}</div>
}
```

### 패턴: Server Shell + Client Island

페이지는 서버 컴포넌트, 인터랙티브 부분만 별도 client 컴포넌트로 분리한다.

```
app/[lang]/recipes/[id]/
  ├── page.tsx              ← Server Component (데이터 fetch, generateMetadata)
  └── RecipeDetailClient.tsx  ← Client Component (handlers, state, effects)
```

---

## 🔐 인증된 유저 정보

### ✅ DO — 미들웨어가 주입한 헤더 사용

```tsx
import { getVerifiedUserIdFromHeaders } from '@/lib/supabase/middleware'

async function page() {
  const userId = await getVerifiedUserIdFromHeaders()
  // userId는 middleware의 getUser()로 검증된 값 — 다시 getUser() 호출 X
}
```

미들웨어(`proxy.ts`)는 **세션 쿠키가 있는 요청 중 GET/HEAD `/api/*`·정적 PWA 자산을 뺀 요청**(페이지·변경 API 등)에서만
`lib/supabase/middleware.ts:updateSession`(=`getUser()`)을 수행하고 `x-naelum-user-id` request header에
user.id를 주입한다. 세션 쿠키 없는 요청·GET/HEAD `/api/*`·정적 PWA 자산(`/sw.js`·`/manifest.json`·`/offline.html`)
에서는 getUser 를 건너뛰고(아래 "API 라우트는 반드시 스스로 인증" 참고), 클라이언트가 보낸 위조 헤더는 항상 삭제한다
(정적 PWA 자산은 헤더를 읽는 곳이 없어 그대로 통과).
페이지에서 `supabase.auth.getUser()`를 다시 호출하면 auth 서버 round trip이 중복 발생하므로
헤더에서 읽는 것이 권장 패턴이다.

> **현재 채택 현황(2026-10-04)**: 헤더 방식은 홈(`app/[lang]/page.tsx`) **1곳만** 쓴다. 나머지 서버 컴포넌트
> (`app/[lang]/admin/layout.tsx`·`admin/ingredients/page.tsx`·`rider/page.tsx`·`merchant/**` 7곳)와 레퍼런스 슬라이스
> `lib/queries/recipeDetail.ts`(본문 조회와 `Promise.all` 병렬)는 `supabase.auth.getUser()` 를 직접 호출한다 —
> 아래 DON'T·안티패턴 #3 과 어긋나는 기존 코드이며, 새 서버 페이지는 헤더 방식을 우선 검토할 것.

### ❌ DON'T — 페이지에서 `supabase.auth.getUser()` 재호출

```tsx
// ❌ 미들웨어와 중복 — 100ms 낭비
const { data: { user } } = await supabase.auth.getUser()
```

### 예외

- API 라우트(`app/api/**`): `requireAuth()` 혹은 직접 `getUser()` 사용 — API는
  middleware와 별도 request cycle일 수 있음
- 로그인/로그아웃 등 auth 자체 작업: 당연히 `auth.*` 호출 필요

### ⚠️ API 라우트는 반드시 스스로 인증 (2026-09-27 미들웨어 fast path)

`proxy.ts` 는 **GET/HEAD `/api/*` 요청에서 `updateSession`(getUser) 을 건너뛴다** — 로그인 페이지뷰당
Auth 왕복 5~6회 절감. 그래서:

- API 라우트는 `x-naelum-user-id` 헤더를 **절대 읽지 말 것**(GET 에선 주입되지 않고 위조 헤더만 제거된다).
  `requireAuth()`·`verifyAdmin()`·`createClient()`+RLS 로 스스로 인증한다.
- 미들웨어의 온보딩 게이트는 *변경* API(POST/PUT/PATCH/DELETE)에만 적용된다(기존과 동일).
- 보호/관리자 경로·온보딩 게이트용 `profiles` 조회는 getUser 와 겹쳐 시작한다(`lib/auth/peekSessionJwt.ts`,
  서명 미검증 sub 로 *시작만* 하고 검증된 user.id 와 같을 때만 사용). 판정은 언제나 검증된 사용자 기준.
- 회귀망: `e2e/proxy-gates.spec.ts`(게이트·no-store·비로그인 401) · `e2e/pwa-static.spec.ts` · `e2e/onboarding-gate.spec.ts`.

---

## 📦 데이터 fetching 우선순위

1. **서버 컴포넌트 직접 쿼리** (제일 빠름)
   - `const { data } = await supabase.from(...).select(...)` in server component
2. **서버 컴포넌트에서 내부 API 라우트 fetch** (복잡 로직 재사용 시)
   - `fetch('/api/...', { headers: { cookie } })` — loopback ~5-10ms
3. **클라이언트 useEffect fetch** (불가피할 때만)
   - 인터랙티브 이후 필요한 데이터 (예: 댓글 pagination)
4. ❌ **`requestIdleCallback` lazy load** — **하지 말 것.**
   - 이전엔 홈페이지 트렌딩/냉장고 섹션에 썼지만 "섹션이 뒤늦게 랜딩"하는
     주요 원인이었음. 서버에서 Promise.all로 같이 가져와라.

---

## 🌍 i18n 규칙

### ✅ DO — 언어별 파일에 추가

새 문자열은 `lib/i18n/locales/ko.ts`에 먼저 추가한 뒤, 필요한 다른 locale 파일에도 추가.

```ts
// lib/i18n/locales/ko.ts
export const ko = {
  auth: {
    // ...
    newFeatureLabel: '새 기능',  // 👈 여기에 추가
  },
}
```

`ko` 는 기본값(`defaultLocale`)이라 정적 import 로 모든 사용자 번들에 포함되고, 나머지 7개 locale 은
`loadLocale()` 의 dynamic import 로 별도 chunk 다(`lib/i18n/locales/index.ts`). 비-ko 사용자는 ko + 자기 언어 chunk 를 받는다.

### ❌ DON'T — `translations.ts`를 직접 수정

`lib/i18n/translations.ts`는 하위 호환 re-export 레이어일 뿐이다.
번역 내용은 거기에 넣지 말 것.

### ❌ DON'T — 컴포넌트에 하드코딩된 문자열

```tsx
// ❌
<button>저장</button>

// ✅
<button>{t.common.save}</button>
```

---

## 🖼 이미지 사용

### ✅ DO — `next/image` 우선, 첫 화면 이미지에 `priority`

```tsx
import Image from 'next/image'

<Image src={url} alt="..." fill sizes="(max-width: 640px) 50vw, 33vw" priority={i < 4} />
```

Above-the-fold(화면 첫 4장 등) 이미지에 `priority`를 주면 Next.js가 `<link rel="preload">`를
SSR HTML에 emit해 LCP가 개선된다.

### ❌ DON'T — raw `<img>` 태그

Next.js Image optimization을 거치지 않아 사이즈가 크고 AVIF/WebP 변환 안 됨.
(예외: data URL base64, SVG inline 등은 OK)

---

## 🧩 dynamic import 기준

### ✅ DO — 무거운 모달/오버레이 lazy load

```tsx
const ReviewModal = dynamic(() => import('./ReviewModal'), { loading: () => null })
```

> Next 16 / React 19 에서 SSR 트리에 렌더되는 컴포넌트에 `{ ssr: false }` 를 쓰면 `BAILOUT_TO_CLIENT_SIDE_RENDERING`
> digest 로 hydration mismatch(#418)가 난다(`app/[lang]/recipes/[id]/RecipeDetailClient.tsx` 주석). 기본은
> `loading: () => null`, `ssr: false` 는 window 의존 라이브러리(maplibre 등)용. 코드엔 조건부로 여는 모달에
> `ssr: false` 가 아직 섞여 있다(혼재).

### ❌ DON'T — 첫 화면 렌더에 필요한 컴포넌트를 dynamic

```tsx
// ❌ 헤더에 버튼 렌더되는데 dynamic하면 초기 화면 밀림
const LoginButton = dynamic(() => import('./LoginButton'))
```

### 📡 관측 SDK(Sentry)는 동의 시에만 지연 로딩

`@sentry/nextjs` 는 Replay·tracing 포함 ≈350 KB raw / 110 KB gz(2026-09-27 prod build 실측 — 동의 세션의 Sentry 비동기 청크 352 KB raw / 111 KB gz, `docs/CHANGELOG.md` 2026-09). 정적 import 하면 *모든 라우트*의
공유 메인 청크에 실린다(2026-09-27 감사: 공유 청크의 절반). 규칙:

- SDK 로드는 `instrumentation-client.ts` 한 곳 — DSN + 분석 동의일 때만 `lib/sentry/client.ts`
  파사드를 `import()` 하고 init. 비동의 세션은 바이트 0 (이전에도 `enabled:false` 라 전송 0).
- **네임스페이스 `import('@sentry/nextjs')` 금지** — tree-shaking 을 잃어 feedback·profiling 등이
  딸려온다(+225 KB raw 실측). 파사드는 필요한 이름만 `export { … } from '@sentry/nextjs'`.
- 에러 바운더리는 `lib/sentry/captureException.ts`(런타임 import 없음, 전역 promise 경유).
- `npm run scan` 이 app/components/lib 의 `@sentry/nextjs` 런타임 import 를 머지 차단한다.

### 판단 기준

| 컴포넌트 유형 | dynamic? |
|---|---|
| 첫 화면에 항상 보임 | ❌ 정적 import |
| 버튼 클릭 후 열리는 모달 | ✅ dynamic |
| 조건부 렌더링되는 heavy chart | ✅ dynamic |
| 라우트 전체가 lazy | Next.js가 자동 처리 (신경 안 써도 됨) |
| 유저 상태에 따라 분기 (비로그인 vs 로그인) | 정적 + 분기 렌더 — `dynamic(ssr:false)`로 하면 SSR 안 됨 |

---

## 🔄 공유 상태 / 캐시

여러 컴포넌트가 같은 데이터를 쓰면 **모듈 레벨 pub/sub 캐시**를 고려:

```ts
// lib/shopping-list/cache.ts 참고
let cached: Item[] | null = null
const subscribers = new Set<(items: Item[]) => void>()

export async function loadItems(force = false) {
  if (!force && cached) return cached
  // fetch + cached = data + notify subscribers
}
export function subscribeItems(cb) { subscribers.add(cb); return () => subscribers.delete(cb) }
```

사용 예: `useCartCount`와 `ShoppingCartDropdown`이 같은 캐시를 공유해 드롭다운
클릭 시 이미 데이터가 준비돼 있음.

---

## 🧪 테스트 추가 기준

- **API 라우트 수정** → `e2e/*.spec.ts`에 회귀 테스트 추가
- **새 페이지** → SSR 검증 (HTML에 제목/콘텐츠 포함되는지)
- **버그 수정** → 재현 케이스를 테스트로 먼저 작성 (TDD)

`e2e/auth-fixtures.ts`의 `authenticatedPage` fixture를 사용하면 로그인 상태
시나리오도 쉽게 테스트 가능.

> ⚠️ **flaky 방지 철칙** (2026-05-17, suite 전반 0-flaky 달성): UI 액션 후
> DB 상태를 단언할 때 **고정 `page.waitForTimeout(N)` 뒤 즉시 `admin().select()`
> 금지**. async write 가 부하 시 N ms 내 미커밋 → write→read race(flake 가
> spec 회전). **`expect.poll(async()=>…end-state…, {timeout:15000})`** 로
> DB 가 기대 상태 도달까지 결정적 대기 후 상세 단언(불변식·커버리지 보존,
> 잘못된 값은 15s 에도 실패 → 은폐 아님). 또는 완료신호(toast/`waitForResponse`)
> 대기 후 read(cart.spec 패턴). 워커는 `CI?1:2`(2026-05-22 3→2 하향, `playwright.config.ts`; 경합류·비단조라 워커튜닝은
> race 의 부차 — 근본은 동기화). 상세: CLAUDE.md 기능현황 2026-05-17.

---

## 🚫 안티패턴 모음

이번 최적화에서 발견한 것들 — 다시 만들지 말 것:

1. **`translations.ts` 단일 파일** — 8개 언어 전부 번들에 포함됨 (154KB)
2. **페이지 루트 `'use client'`** — SSR 없음, LCP 1-2초 손해
3. **미들웨어 + 페이지에서 각각 `getUser()`** — auth 서버 round trip 중복
4. **`requestIdleCallback`로 섹션 lazy load** — 섹션이 뒤늦게 "랜딩"
5. **`dynamic(ssr:false)`로 정적 UI 로드** — 예: 비로그인 유저용 냉장고 이미지
6. **`useCartCount`처럼 데이터의 부분만 캐시** — consumer마다 다시 fetch
7. **Supabase RPC 컬럼명 mismatch** — API 응답 body가 undefined로 조용히 깨짐
8. **JSX 조건식에서 가드 없이 `x.y` 접근** — 빈 배열 / null 케이스 누락

---

## 📁 디렉토리 컨벤션

```
app/
  [lang]/                 ← 모든 페이지는 locale 세그먼트 아래 (proxy.ts 가 bare 경로를 /{lang} 로 redirect)
    [route]/
      page.tsx            ← Server Component (데이터 fetch + metadata)
      [Route]Client.tsx   ← Client island (interactivity)
      _components/        ← 순수 표현 컴포넌트 (App Router private 폴더)
      loading.tsx         ← 로딩 스켈레톤 (필요 시)
      error.tsx           ← 에러 UI (필요 시)
    _<area>/use*.ts       ← 영역 전용 stateful hook (예: _home/)
  api/                    ← Route Handlers (스스로 인증)
components/
  Feature/                ← 기능별 그룹
    [Component].tsx
  Common/                 ← 범용 재사용
lib/
  api/
    types.ts              ← API 응답 타입 모음 — ⚠️ 현재 import 0곳(채택 안 됨, 계약이 강제되지 않음)
    auth.ts               ← requireAuth()
    pagination.ts         ← parsePagination()
    sanitizeSearch.ts     ← PostgREST 필터 보간용 검색어 정규화(필터 주입 방어)
    clientIp.ts           ← getClientIp() (CF-Connecting-IP 우선)
  queries/                ← 서버 read 데이터 계층 (docs/DATA_LAYER.md)
  [domain]/               ← 도메인별 비즈니스 로직
    cache.ts              ← 공유 캐시
    [action].ts           ← 서버/클라 공용 함수
  supabase/
    server.ts             ← createClient (server)
    client.ts             ← createClient (browser, 싱글톤)
    middleware.ts         ← updateSession + getVerifiedUserIdFromHeaders
    admin.ts              ← verifyAdmin() · logAdminAction()
    service.ts            ← createServiceClient() (service role)
    fetchAll.ts           ← fetchAllRows() (1000행 제한 회피 페이지네이션)
    hasSessionCookie.ts   ← 클라이언트 세션 쿠키 판정
    shims/                ← realtime-js·functions-js·iceberg-js 교체용 stub (next.config.ts alias)
e2e/
  [feature].spec.ts       ← 기능별 시나리오
  auth-fixtures.ts        ← 로그인 상태 fixture
  helpers/                ← 테스트 헬퍼 (유저 생성 등)
```

---

## 🧭 지금 우리가 나아가야 할 방향

성능 최적화 사이클 이후 정한 **기술 부채 대응 원칙**.
2026-04 발췌된 대화록 기반. 수정 시 팀 합의 필수.

### 핵심 철학: "현재 코드는 안정화, 신규 코드는 개선된 패턴으로"

**Big Rewrite를 피한다.** 기존 코드가 "best practice"를 지키지 않아도
기능이 정상이면 건드리지 않는다. 대신:

1. **이 문서(ARCHITECTURE.md)에 좋은 패턴을 박제**하고
2. **새로 쓰는 코드는 처음부터 이 패턴을 따르며**
3. **기존 코드는 실제 병목으로 드러날 때만 리팩터**한다.

이게 Strangler Fig 패턴이고, 실패율이 낮은 리팩터 전략이다.

### god-file 분해 계획 — 검토하에 점진

영상 「2차 소프트웨어 위기」의 "이해 부채" 상환. **Big Rewrite 금지**
원칙대로, 회귀 안전망을 먼저 두껍게 한 뒤 **결합도 낮은 블록부터** 추출한다.

> **Phase 1 (recipes/new · HomeClient) 완료** — 아래 ✅ 2개.
> **Phase 2 도 완료(2026-05-17)** — 아래 "Phase 2 — ✅ 전체 완료" 절. (이 자리의 옛 문구 "Phase 2 미착수"는 Phase 1 직후 시점 기록.)
> 아래 표의 굵은 줄수는 *분해 직후* 값이고, 현재 줄수는 "현재" 표기를 볼 것.

| 파일 | 줄수 | 상태 | 다음 액션 |
|---|---|---|---|
| `app/[lang]/recipes/new/page.tsx` | ~~1587~~ → **873 (-45%)** (2026-05-17) · 현재 **777** (2026-10-04) | ✅ **분해 완료 2026-05-17 (5패스 추가)** | 1차(4 `_components/`: TagsField·NutritionFields·StepsSection·IngredientsSection, 1587→1171) 이후 **추가 5패스로 1160→873줄 돌파(900선 미만 달성)**: `BasicInfoSection`(기본정보)·`RecipeFormFooter`(저작권/제출)·`ThumbnailUploadField`(썸네일)·`DietaryOptionsField`(식단옵션) `_components/` 추출 + 순수로직 `lib/recipes/autoTags`(detectKoreanAndTranslate·computeAutoTags)+vitest 9. 전 패스 4-스텝 규율(안전망 선작성→미수정 baseline green→JSX byte-identical 추출→동일 green=동작보존 입증→refactor 단독 커밋). 상태·effect·async·이미지/드래그 핸들러·handleSubmit/Draft 는 부모 소유 불변. 안전망: `e2e/recipe-creation.spec.ts` 5→8(Section1 바인딩·임시저장·썸네일 드롭존·**자동태그 체인 :271 = 체크박스→부모effect→TagsField 칩, 최고위험 wiring**). 검증: 매 패스 lint 0err·build·vitest(최종 142)·격리 e2e baseline 동일·전체 e2e 378 0fail 0flaky. 남은 873줄 = 진짜 오케스트레이션(state/effect/handler) — 더 분해하면 규칙 위반(안전한 종착점). 메모리 [[project-god-file-phase2]] |
| `app/[lang]/HomeClient.tsx` | ~791 (2026-05 분해 직후) · 현재 **599** (2026-10-04) | ✅ 주요 분해 완료 | **~1197→791줄(-34%)**, 전 단계 행위보존·독립 검증·독립 커밋(Strangler Fig). **표현 5개 → `_home/`**: `OnboardingBanner`·`RecommendationPill`·`EmptyFridgeGuide`·`MobileSearchOverlay`·`FridgeShelves`(순수 표현·상태/가드/track 부모 소유·JSX byte-identical, FridgeShelves 는 props 명=원 변수명으로 IIFE 본문 verbatim). **순수 알고리즘 → `lib/home/fridgeShelfDistribution`**(useMemo 본문, `urgencyScore` 주입으로 lib 순수·vitest 7). **stateful hook → `_home/useFridgeInteractions`**(Step 3·고위험: actionItem/detailItem·longPress/pendingDelete refs·DELETE_UNDO dbTimer·옵티미스틱+rollback·long-press 분기를 재설계 0·핸들러 byte-identical 기계적 이동. cleanup useEffect 신규 추가/제거 없음=동작 보존. `pendingDeleteIdsRef` 반환→fetchItems 동일 ref 필터). **분해 중 i18n 근본 버그 발견·수정**: `lib/i18n/useLocalizedPathname`(`proxy.ts:stripLang` client 미러) — raw `usePathname()`(=`/ko…`) vs bare 경로 비교 다증상 버그(`BottomNav` 홈탭 active·홈검색 오버레이 dead / `FloatingFeedbackButton` 숨김) 동시 수정. MobileSearchOverlay 는 fix 전 dead(aria-hidden 계측 e2e 실측 — isVisible false-positive 함정). **안전망 선작성 전략**: `e2e/mobile-search-overlay.spec.ts`·`e2e/fridge-chip-interactions.spec.ts`(Step 0 — long-press 삭제+undo→dbTimer 취소·DELETE_UNDO 경과→DB delete·그룹→미니시트→액션 3 불변식이 Step 3 hook 추출의 가드, 6/6 green). 검증: lint 0 errors·build·unit 85·e2e 0 fail. **Vercel Preview 배포 검증 완료**(fridgeShelfDistribution·RecommendationPill·i18n fix BottomNav aria-current·MobileSearchOverlay 개폐 라이브 확인). 남은 god-file 아님 — 추가 추출은 필요 시 동일 규약. ※ 분해 중 보였던 cart-note·auto-merge flaky 는 별도 후속(2026-05-17)에서 근본(write→read race) 제거 → suite 0-flaky (위 "flaky 방지 철칙" 참조) |

**추출 규약** (TagsField 가 레퍼런스):
1. 상태·핸들러는 부모가 소유, 자식은 값+콜백만 받는 **순수 표현 컴포넌트**
2. JSX 만 이동 (마크업·className·핸들러 시그니처 동일) → 행위 변경 0
3. 검증: `npm run build`(strict props 정합) + 해당 e2e 회귀 + 순수 JSX 동일성
4. `_components/` (App Router private 폴더) 에 배치

> ⚠️ `/recipes/new` 는 루트 `'use client'` + `useSearchParams()` 라
> `app/loading.tsx` Suspense fallback 뒤 하이드레이션된다. 일부 headless
> 환경에서 splash hang 이 있었다(당시 UI e2e 를 `test.fixme` 로 CI 게이트에 위임 —
> 현재 `e2e/` 에 `fixme` 0건, `e2e/recipe-creation.spec.ts` UI 테스트는 활성).
> timeout 으로 가리지 말 것(증상 은폐 금지).

#### Phase 2 — ✅ 전체 완료 (2026-05-17)

> **6개 god-file 전부 분해 완료**(아래 표 6행 — signin(구 login) 포함. Phase 1 2개와 합치면 8개). 공통 규약: 순수함수 →
> `lib/`+vitest, 순수 표현 → `_components/`(상태·ref·race·async 핸들러는 부모
> 불변, 콜백만), JSX byte-identical, 추출 전 회귀 안전망 선작성(기존 강커버
> 시 갭만 보강). 분해 안전망이 선존 RLS 데이터유실 버그 2건(recipe child,
> notifications)까지 발견·수정([[project-recipe-children-rls-fix]]).
> ※ login 은 재스캔서 발견된 계획 외 god-file — 잔여 RLS·Storage 후 추가 분해.

Phase 1 표본 2개는 끝났지만 영상의 "이해 부채" 처방은 *지속적* 상환이다.
2026-05-17 전 소스 재스캔 결과 **계획에 누락돼 있던 최대 로직 파일**이 드러남.

| 파일 | 줄수 | 우선 | 다음 액션 |
|---|---|---|---|
| `app/[lang]/recipes/[id]/edit/page.tsx` | ~~1365~~ → **865 (-37%)** (2026-05-17) · 현재 **657** (2026-10-04) | ✅ **완료 2026-05-17** | **회귀 안전망 선작성(`e2e/recipe-edit.spec.ts` 3 test × 2 프로젝트 = 6 실행: 데이터로드·단계제목·재료삭제 임계·제출 영속)이 분해 전 *선존 critical 버그* 발견** → recipe_ingredients/steps/tags RLS 쓰기정책 누락(데이터 유실, dev+prod 수정, [[project-recipe-children-rls-fix]]). **"recipes/new/_components 재사용" 예측은 코드 정독으로 *반증됨*** — new/edit 폼이 이미 분기(단계 제목 유무·재료 삭제 임계 `<=1`vs`<=5`·영양 검증 상한). 무지성 재사용 시 회귀 → **TagsField 만 공유 재사용**(진짜 동일, focus:ring-2 멱등), **BasicInfoSection·NutritionFields·IngredientsSection·StepsSection 은 edit *현재* JSX 와 byte-identical 한 edit 전용 `_components/` 로 추출**(상태·핸들러 page 소유, 행위 변경 0). 검증: lint 0err·build·vitest 85·e2e 28/28(안전망+creation+detail) green. new/edit 폼 통합은 별도 제품 결정(범위 밖). **2026-10-04 통합**: new·edit 가 글자 그대로 같던 섹션을 `app/[lang]/recipes/_components/` 공용 6개(BasicInfoSection·DietaryOptionsField·IngredientsSection·NutritionFields·TagsField·ThumbnailUploadField)로 합침 — 진짜 분기는 prop 으로 보존(재료 삭제 임계 new 5 / edit 1, 영양 검증 상한은 new 만, 단계 제목 유무 때문에 StepsSection 은 두 벌 유지). 행 추가·수정 핸들러는 `lib/recipes/formRows.ts` 한 벌(함수형 업데이트 — 업로드 중 입력 유실 PHR-01·옛 ingredient_id 잔존 PHR-03 동시 해소). 렌더 동등성 하네스(old 사본 vs 공용 컴포넌트 SSR 바이트 비교, new·edit × ko·en)로 행위 보존 증명 |
| `components/ShoppingCartDropdown.tsx` | ~~1087~~ → **549 (-49%)** (2026-05-17) · 현재 **614** (2026-10-04) | ✅ **완료 2026-05-17** | Step 0 안전망 평가: 기존 cart.spec(13)·cart-note(5,메모 race 가드)·cart-share(3)·recipe-cart-toggle(4) 이 추출 위험면 이미 강커버 → 유일 갭(그룹모드 토글)만 `e2e/cart-decomposition.spec.ts` 1개 보강. **순수함수 `groupItems` → `lib/shopping-list/groupItems.ts` + vitest 8**. **표현 5개 → `components/cart/`**: `CartLoginPrompt`·`CartHeader`·`CartAddInput`·`CartQuickAdd`·`CartItemList`(최대 블록). ⚠️ **메모 optimistic clobber race 방어(pendingNoteEditIdsRef·applyServerItems·updateNote)·subscribe·fetch·모든 async 핸들러는 부모 소유 불변** — 자식은 콜백만. 공유 심볼은 `components/cart/types.ts`(Suggestion·CartAddSource·COMMON_UNITS·QuickItem). JSX byte-identical → 행위 변경 0. 검증: lint 0err·build·vitest 93·cart e2e 50/50(미분해 baseline 동일) |
| `app/[lang]/[username]/page.tsx` | ~~928~~ → **426 (-54%)** (2026-05-17) · 2026-10-04 서버 래퍼 `page.tsx`(`@` 검증·`notFound()`) + 클라이언트 본체 `ProfilePageClient.tsx` 로 분리 — 현재 page.tsx **21** (2026-10-04) / ProfilePageClient.tsx **487** (2026-10-04) | ✅ **완료 2026-05-17** | 프로필 페이지 UI e2e 미커버 → `e2e/profile-decomposition.spec.ts` 3케이스(카드 렌더·탭전환 URL·관리메뉴 가시성 PATCH) 선작성·baseline green. **순수 `getTimeAgo` → `lib/utils/timeAgo.ts` + vitest 6**. **표현 5개 → `_components/`**: `ProfileCard`·`ProfileTabs`·`TipsGrid`·`DraftsPrivateView`·`ProfileRecipeGrid`(최대·관리메뉴). 상태·async 핸들러 부모 소유, 콜백만. 공유 타입 `_components/types.ts`. JSX byte-identical. 검증: lint 0err·build·vitest 99·profile e2e 6/6(baseline 동일) |
| `components/Ingredients/IngredientForm.tsx` | ~~899~~ → **480 (-47%)** (2026-05-17) · 현재 **492** (2026-10-04) | ✅ **완료 2026-05-17** | 기존 ingredient-auto-merge(6,DetailFields 실제 exercise)·autocomplete(8)·picker-modal(8) 강커버 = baseline. **순수 `sanitizeOutgoingPayload` → `lib/ingredients/` + vitest 6**. `DetailFields`(~327)·`EditableName`은 이미 독립 함수컴포넌트 → **파일만 verbatim relocate**(prop·JSX 무변, 최저위험). UNITS/STORAGE_LOCATIONS/CATEGORIES 동반 이동. 검증: lint 0err·build·vitest 105·ingredient e2e 42/42(baseline 동일) |
| `components/RecipeCookMode.tsx` | ~~753~~ → **494 (-34%)** (2026-05-17) → **파일 삭제됨**(2026-09-28 `ef90b9a` "사용처 없는 모듈 24개 삭제" — 따라하기는 `RecipeBrowseView` 인라인 + `lib/hooks/useCookingMode`) | ✅ **완료 2026-05-17** | 기존 cook-completion·cook-mode-and-review(타이머패널 포함) baseline. **순수 `formatTime` → `lib/utils/` + vitest 7**. **표현 4개 → `components/cook/`**: `CookVoicePanel`·`CookIngredientsSheet`·`CookTimerPanel`·`CookCompletionModal`(현재 `components/cook/` 엔 `CookTimerPanel`·`CustomTimerSetup` 만 남음). 타이머/음성 hook 은 이미 `lib/hooks/*`(`useMultiTimer`·`useVoiceGuide` — 당시 스와이프 hook `useSwipeGesture` 는 2026-09-28 삭제), 자식은 ReturnType 타입+콜백만. JSX byte-identical. 검증: lint 0err·build·vitest 112·cook e2e 16/16(baseline 동일) |
| `app/[lang]/signin/page.tsx` (구 `login/`) | ~~877~~ → **601 (-31%)** (2026-05-17) · 현재 **578** (2026-10-04) | ✅ **완료 2026-05-17** (2026-05-26 `login` → `signin` rename) | 재스캔서 발견된 계획 외 god-file(IngredientForm 동급). 기존 `auth.spec.ts` 가 메인 카드(폼·검증·show-password·링크) 강커버 → 갭(모달 개폐/ESC/렌더)만 `e2e/signin-decomposition.spec.ts`(구 `login-decomposition`, rename 시 함께 변경) 2케이스 보강. **표현 2개 → `_components/`**: `FindIdModal`·`ResetPasswordModal`(4스텝 위저드). 모든 상태·ref·async·BroadcastChannel·passwordStrength 부모 소유, onClose 는 원본 inline setState 시퀀스 byte-identical 보존. 검증: lint 0err·build·vitest·login+auth e2e 18/18(baseline 동일) |

> `app/[lang]/_home/FridgeSVG.tsx`(~1300)·`lib/i18n/locales/*`(각 ~1,880)·
> `lib/supabase/database.types.ts`(~1137)는 **분해 대상 아님** — 각각 SVG 마크업·
> 정체성 컴포넌트 / 평면 번역 데이터 / 타입 정의. 로직 god-file 이 아니다.
> ⚠️ `database.types.ts` 는 `supabase gen types` 생성물이 **아니라** 2026-04 수기 스냅샷(마지막 수정 2026-04-14)이다 —
> 코드가 쓰는 현행 테이블 상당수(`recipe_posts`·`tip`·`rate_limits`·`push_subscriptions`·`delivery_*` 등)가 없고,
> drop(예정)된 테이블·뷰(`recipe_comments`·`recipe_ratings`·`popular_recipes` 등)가 남아 있으며 `Functions` 도 비어 있다.
> 사용처는 `lib/supabase/service.ts` 의 `Database` 제네릭 1곳 — 재생성 필요(코드 결정).

**왜 지금, 빠르게 (프로젝트 커지기 전에) — 기술적 근거** (2026-05-17 Phase 2 착수 당시 기록 — 역사. 아래 수치도 당시 값):
1. **이해 부채는 복리.** `edit/page.tsx` 는 핵심 경로라 앞으로도 계속 수정됨 →
   매 수정마다 1365줄에 결합이 더 엉킨다. 나중에 풀면 blast radius 가 더 큼.
2. **재사용 창은 *이미* 닫혀 있었다 (예측 적중·교훈).** 위 예측대로 new/edit
   폼은 이미 분기(단계 제목·삭제 임계·검증 상한) → "재사용" 불가, edit 전용
   byte-identical 추출로 전환했다. **교훈: 분해 전 "쌍둥이 파일 재사용 가능"
   가정은 반드시 코드 정독으로 검증**. 잔여 Phase 2 항목도 동일.
   (후속 2026-10-04: 같은 교훈대로 diff 로 *같은 부분만* 골라 공용화하고 분기는 prop 으로 남겼다 — 위 표의 edit 행 참조.)
3. **비싼 선행조건은 이미 지불됨.** 회귀 안전망(vitest 85·e2e suite 0-flaky·CI)이
   Phase 1 에서 구축 완료 → 각 분해의 한계비용이 지금 최저. 코드가 더 쌓이면
   안전망 재정비 비용까지 같이 늘어난다.

> Storage API 래퍼 격리 ✅ 2026-05-17 완료 (아래 "AWS 이전" 절 표 참조).

### 진짜 걱정해야 할 기술 부채 3가지

#### 1. 테스트 없는 영역 — **지금 조금씩 갚기**

E2E 커버리지 가중치 (2026-10-04 spec 기준 갱신 — 작성 당시엔 레시피 작성 🔴, 쿠킹 모드·프로필 편집 🟡 였음):
- 🟢 홈페이지, 레시피 상세: 충분
- 🟢 레시피 작성: `e2e/recipe-creation.spec.ts` — 프로덕션에서 유저가 레시피 못 올리면 **서비스가 죽음**이라 최우선 유지
- 🟢 쿠킹 모드 완료: `e2e/cook-completion.spec.ts`·`cook-mode-and-review.spec.ts`·`made-it-flow.spec.ts` (네비+완료 커버. 타이머 완료 알림 자체는 자동화 어려워 미검증)
- 🟢 프로필 편집: `e2e/profile-edit.spec.ts`
- 🟢 좋아요/북마크: 이미 `authed-recipe-detail.spec.ts`에 포함

**원칙**: 새 기능 추가 시 **회귀 방지 테스트를 같은 커밋에** 포함한다.
작성 당시엔 부담스러워도, 6개월 뒤에 누군가 수정할 때 그 테스트가 보험이 됨.

#### 2. CLAUDE.md의 향후 기능 — **지금 준비하지 말고, 시작할 때 준비해**

> AI 추천, 이미지 인식, 음성 제어, AR 등

미리 추상화하면 **YAGNI(You Aren't Gonna Need It)** 함정에 빠진다.
현재 구조가 새 기능을 "받아들일 수 있는 상태"인지만 확인하면 충분:

| 기능 | 현재 준비도 | 작업 시점 |
|---|---|---|
| AI 추천 | `/api/recommendations`가 이미 확장 가능 — 새 `type=ai` case만 추가 | 실제 빌드 시점 |
| 이미지 인식 | 레시피/아바타 이미지 업로드 플로우 이미 존재 — 업로드 후 Vision API 후처리만 추가 | 실제 빌드 시점 |
| 음성 제어 | `useVoiceGuide` 는 TTS(`speechSynthesis`) 읽어주기 전용 — 음성 *인식*(SpeechRecognition) 코드는 없다. 사용 경로: `RecipeBrowseView` → `useCookingMode` → `useVoiceGuide` | 음성 안내(TTS)만 있음, 음성 제어는 미구현 |

**결론**: 기존 구조가 수용 가능. 미리 손대지 말 것.

#### 3. AWS 이전 — **현재는 무시, 단 몇 가지 원칙만 지킴**

CLAUDE.md에 "사용자 규모 증가 시 AWS 이전 예정"이라고 쓰여 있지만,
실제 이전은 **비용/부하가 부담되기 시작할 때 별도 스프린트**로 진행한다.
지금 준비 작업은 무의미. 다만 이전을 "쉽게" 만드는 원칙은 지금부터 지킨다:

| 원칙 | 상태 |
|---|---|
| Supabase realtime 사용 금지 | ✅ shim으로 제거 완료 |
| Supabase Functions 사용 금지 | ✅ shim으로 제거 완료 |
| 표준 Postgres SQL만 사용 (Supabase 확장 지양) | ⚠️ PL/pgSQL 함수 다수(`handle_new_user` 트리거·`check_rate_limit`/`cleanup_rate_limits`·`recipe_cooked_count`·`toggle_recipe_like`/`toggle_post_like`·`recipe_posts` 카운트 트리거·`admin_unresolved_ingredients` 류·`delete_user` 등 — 정의는 `supabase/migrations/`) 있지만 표준 PL/pgSQL 이라 이식 가능 수준. 옛 `update_recipe_ratings` 는 `20260601_drop_legacy_ratings_comments.sql`(POST-MERGE ONLY)의 drop 대상(적용 여부는 DB 확인 필요) |
| RLS 복잡도 최소화 | ✅ **2026-05-17 전수 감사 완료** — 전 public 테이블 RLS×정책 매트릭스 점검. recipe child(앞서 수정) 외 **2번째 선존 버그 발견·수정**: `notifications` INSERT 정책 부재(행위자≠수신자라 owner-scoped 부적합) → 댓글·평점·낼름 알림 + send-expiry cron 전체 무력. 코드 픽스(`lib/notifications/create.ts`·`send-expiry` → service-role insert, DB 마이그레이션 불필요). rate_limits=이미 service-role(정상), 그 외 RLS-on/무write 테이블은 앱 미기록(서비스롤 전용)이라 무해. 향후 규칙: **유저 컨텍스트로 쓰는 테이블은 write RLS 정책 필수, cron/시스템 insert 는 service-role** |
| Storage API는 Supabase Storage 래퍼로 격리 | ✅ **2026-05-17 완료** — `lib/storage/`(uploadToBucket·getPublicUrl, StorageBucket 타입). 직접 `supabase.storage.from()` 호출 6곳(api/upload·recipes new/edit·settings·tip/new·OnboardingWizard) 전부 래퍼 경유로 격리(행위보존 thin pass-through). 향후 S3/R2 이전 시 이 파일만 교체. 규약: 신규 업로드는 반드시 `lib/storage` 경유, 직접 `.storage.from()` 금지 |

### 실제 결정 체크리스트

새 기능을 만들거나 기존 코드 리팩터를 고민할 때 아래 질문을 먼저 자문한다:

- [ ] 이 변경이 **현재 유저에게 보이는 문제**를 해결하는가? (아니면 보류)
- [ ] 이 패턴이 **ARCHITECTURE.md에 이미 쓰여 있는가**? (있으면 따름)
- [ ] 이 리팩터를 **미루면 정확히 얼마나 더 힘들어지는가**? (추측이면 보류)
- [ ] 내가 지금 수정하면 **회귀 테스트가 있는가**? (없으면 먼저 테스트부터)
- [ ] 이 코드는 **6개월 내에 건드릴 가능성이 있는가**? (없으면 건드리지 말 것)

**3개 이상 "아니오"면 하지 말 것.**

### Anti-goal: 하지 말 것

- ❌ "나중에 힘들어질 것 같아서" 미리 추상화
- ❌ "더 나은 구조"를 위한 Big Rewrite
- ❌ 실 사용 데이터 없이 ISR/캐싱 전략 설계
- ❌ 외부 의존성(Supabase) 전면 교체 목적의 리팩터
- ❌ TypeScript 타입 완벽주의를 위한 리팩터 — `any`는 **기본 지양**하되 불가피하면
  `eslint-disable-next-line`로 한 줄 한정 후 허용 (실용성 > 엄격성).
  CLAUDE.md "개발 규칙"과 **동일 정책** (문구만 통일, 의미 변화 없음).

---

## 🔗 참고

- 성능 기준선 (2026-09-27 기준, 비로그인 홈, Fast 3G + CPU 4x throttle — `docs/CHANGELOG.md` 2026-09 참고)
  - FCP: ~1.1s / LCP: ~1.1s / TBT: ~60ms / load: ~2.3s
  - 홈 초기 JS 번들: 1,056 KB raw / 287 KB gzipped (전 라우트 공유 청크 454 KB raw / 131 KB gz)
  - 홈 HTML 108 KB, RSC 페이로드 12 KB (ko)
  - 이전 기준선 (2026-04-15): FCP ~1.7s, LCP ~2.1s, 홈 JS 987 KB raw / 290 KB gz
- 주요 리팩터 히스토리: `git log --grep "perf:"`
- 안티패턴 교훈 정리: 이 문서의 "안티패턴 모음" 섹션 참고
