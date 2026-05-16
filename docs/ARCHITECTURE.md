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
// app/recipes/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getVerifiedUserIdFromHeaders } from '@/lib/supabase/middleware'

export default async function RecipePage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const userId = await getVerifiedUserIdFromHeaders()  // 미들웨어가 주입

  // 필요한 데이터를 모두 병렬로 fetch
  const [recipe, userContext] = await Promise.all([
    supabase.from('recipes').select('...').eq('id', id).maybeSingle(),
    userId ? supabase.from('user_saves').select('...').eq('user_id', userId) : null,
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
app/recipes/[id]/
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

미들웨어의 `lib/supabase/middleware.ts:updateSession`이 매 요청마다 `getUser()`를
수행한 뒤 `x-naelum-user-id` request header에 user.id를 주입한다. 페이지에서
`supabase.auth.getUser()`를 다시 호출하면 auth 서버 round trip이 중복 발생하므로
반드시 헤더에서 읽을 것.

### ❌ DON'T — 페이지에서 `supabase.auth.getUser()` 재호출

```tsx
// ❌ 미들웨어와 중복 — 100ms 낭비
const { data: { user } } = await supabase.auth.getUser()
```

### 예외

- API 라우트(`app/api/**`): `requireAuth()` 혹은 직접 `getUser()` 사용 — API는
  middleware와 별도 request cycle일 수 있음
- 로그인/로그아웃 등 auth 자체 작업: 당연히 `auth.*` 호출 필요

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

각 locale은 별도 chunk로 분리되어 있어 사용자가 자신의 언어만 다운로드한다.

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
const ReviewModal = dynamic(() => import('./ReviewModal'), { ssr: false })
```

### ❌ DON'T — 첫 화면 렌더에 필요한 컴포넌트를 dynamic

```tsx
// ❌ 헤더에 버튼 렌더되는데 dynamic하면 초기 화면 밀림
const LoginButton = dynamic(() => import('./LoginButton'))
```

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
  [route]/
    page.tsx              ← Server Component (데이터 fetch + metadata)
    [Route]Client.tsx     ← Client island (interactivity)
    loading.tsx           ← 로딩 스켈레톤 (필요 시)
    error.tsx             ← 에러 UI (필요 시)
components/
  Feature/                ← 기능별 그룹
    [Component].tsx
  Common/                 ← 범용 재사용
lib/
  api/
    types.ts              ← API 응답 계약(contract) 단일 진실원 — 새 route 응답은 여기에 정의
    auth.ts               ← requireAuth()
    pagination.ts         ← parsePagination()
  [domain]/               ← 도메인별 비즈니스 로직
    cache.ts              ← 공유 캐시
    [action].ts           ← 서버/클라 공용 함수
  supabase/
    server.ts             ← createClient (server)
    client.ts             ← createClient (browser)
    middleware.ts         ← updateSession + getVerifiedUserIdFromHeaders
    shims/                ← realtime-js/functions-js 교체용 stub
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

### god-file 분해 계획 (recipes/new · HomeClient) — 검토하에 점진

영상 「2차 소프트웨어 위기」의 "이해 부채" 표본 2개. **Big Rewrite 금지**
원칙대로, 회귀 안전망을 먼저 두껍게 한 뒤 **결합도 낮은 블록부터** 추출한다.

| 파일 | 줄수 | 상태 | 다음 액션 |
|---|---|---|---|
| `app/[lang]/recipes/new/page.tsx` | ~1171 | ✅ 주요 분해 완료 | `TagsField`·`NutritionFields`·`StepsSection`·`IngredientsSection` 4개 `_components/` 추출 완료(행위보존·strict 타입·recipe-creation e2e 검증, 1587→1171줄 ≈ -26%). `validateNutritionInput` 응집 이동. 남은 god-file 아님 — 추가 추출은 필요 시 동일 규약(순수 props, 상태 page 소유) |
| `app/[lang]/HomeClient.tsx` | ~1085 | 🔄 진행 | **표현 4개**(`OnboardingBanner`·`RecommendationPill`·`EmptyFridgeGuide`·`MobileSearchOverlay` → `_home/`, 순수 표현·상태/가드/track 부모 소유·JSX byte-identical) + **순수 알고리즘 1개**(`lib/home/fridgeShelfDistribution` — 선반 그룹분배 useMemo 본문, 알고리즘 byte-identical·`urgencyScore` 주입으로 lib 순수 유지, vitest 7케이스) 추출 완료. ~1197→1085줄. lint 0 errors·build·unit 85·e2e 351 pass·0 fail 검증(잔여 1 flaky=cart-note, 본 작업 무관 기존 간헐). **분해 중 i18n 근본 버그 발견·수정**: `lib/i18n/useLocalizedPathname`(`proxy.ts:stripLang` client 미러) — raw `usePathname()`(=`/ko…`)을 bare 경로와 비교하던 다증상 버그(`BottomNav` 홈탭 active·홈검색 오버레이 dead / `FloatingFeedbackButton` 숨김 깨짐) 동시 수정. MobileSearchOverlay 는 이 fix 전 dead였음(aria-hidden 계측 e2e 실측 — isVisible false-positive 함정). **안전망 선작성 전략**: `e2e/mobile-search-overlay.spec.ts`(분해 전 통과 확인), `e2e/fridge-chip-interactions.spec.ts`(3 고위험 불변식 = long-press 삭제+undo→dbTimer 취소·DELETE_UNDO_WINDOW 경과→DB delete·그룹→미니시트→액션 라우팅. Step 0). **다음 후보**: Step 2 `<FridgeShelves>`(선반 렌더 JSX ~775-980 표현 추출, RecommendationPill 패턴=안전) → Step 3 `useFridgeInteractions`(long-press refs·undo 타이머·삭제 핸들러 stateful hook, 순수 JSX 아님·고위험. **Step 0 안전망이 가드** — clearTimeout cleanup·옵티미스틱 rollback·ref 분기 불변식 기계적 이동, 재설계 금지). 각 step 독립 검증·독립 커밋 |

**추출 규약** (TagsField 가 레퍼런스):
1. 상태·핸들러는 부모가 소유, 자식은 값+콜백만 받는 **순수 표현 컴포넌트**
2. JSX 만 이동 (마크업·className·핸들러 시그니처 동일) → 행위 변경 0
3. 검증: `npm run build`(strict props 정합) + 해당 e2e 회귀 + 순수 JSX 동일성
4. `_components/` (App Router private 폴더) 에 배치

> ⚠️ `/recipes/new` 는 루트 `'use client'` + `useSearchParams()` 라
> `app/loading.tsx` Suspense fallback 뒤 하이드레이션된다. 일부 headless
> 환경에서 splash hang → UI e2e 는 `test.fixme` 로 CI 게이트에 위임.
> timeout 으로 가리지 말 것(증상 은폐 금지).

### 진짜 걱정해야 할 기술 부채 3가지

#### 1. 테스트 없는 영역 — **지금 조금씩 갚기**

현재 E2E 커버리지 가중치:
- 🟢 홈페이지, 레시피 상세: 충분
- 🔴 레시피 작성: 프로덕션에서 유저가 레시피 못 올리면 **서비스가 죽음**
- 🟡 쿠킹 모드 완료: 타이머/알림은 자동화 어려우나 네비+완료는 가능
- 🟡 프로필 편집: username 충돌, avatar 업로드
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
| 음성 제어 | `useVoiceGuide` hook이 이미 쿠킹 모드에서 사용 중 — 확장만 하면 됨 | 이미 준비됨 |

**결론**: 기존 구조가 수용 가능. 미리 손대지 말 것.

#### 3. AWS 이전 — **현재는 무시, 단 몇 가지 원칙만 지킴**

CLAUDE.md에 "사용자 규모 증가 시 AWS 이전 예정"이라고 쓰여 있지만,
실제 이전은 **비용/부하가 부담되기 시작할 때 별도 스프린트**로 진행한다.
지금 준비 작업은 무의미. 다만 이전을 "쉽게" 만드는 원칙은 지금부터 지킨다:

| 원칙 | 상태 |
|---|---|
| Supabase realtime 사용 금지 | ✅ shim으로 제거 완료 |
| Supabase Functions 사용 금지 | ✅ shim으로 제거 완료 |
| 표준 Postgres SQL만 사용 (Supabase 확장 지양) | ⚠️ PL/pgSQL 함수(handle_new_user, update_recipe_ratings) 있지만 이식 가능 수준 |
| RLS 복잡도 최소화 | ⚠️ 주기적 리뷰 필요 |
| Storage API는 Supabase Storage 래퍼로 격리 | ⏳ 미완. 새 업로드 로직 추가 시 `lib/storage/*` 래퍼 통과 규약 도입 권장 |

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

- 성능 기준선 (2026-04-15 기준, Fast 3G + CPU 4x throttle)
  - FCP: ~1.7s
  - LCP: ~2.1s
  - 홈 초기 JS 번들: 987 KB raw / 290 KB gzipped
- 주요 리팩터 히스토리: `git log --grep "perf:"`
- 안티패턴 교훈 정리: 이 문서의 "안티패턴 모음" 섹션 참고
