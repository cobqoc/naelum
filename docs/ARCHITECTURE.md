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

## 🔗 참고

- 성능 기준선 (2026-04-15 기준, Fast 3G + CPU 4x throttle)
  - FCP: ~1.7s
  - LCP: ~2.1s
  - 홈 초기 JS 번들: 987 KB raw / 290 KB gzipped
- 주요 리팩터 히스토리: `git log --grep "perf:"`
