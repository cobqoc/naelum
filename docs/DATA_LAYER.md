# 데이터 접근 계층 (Data Layer) — 목표 아키텍처 & 점진 이전

> **왜 이 문서가 있나.** 2026-06-08 성능 감사에서 드러난 *구조 뿌리*: 데이터 페칭과
> 렌더링이 분리돼 있지 않다. 28개 `'use client'` 컴포넌트가 supabase 를 **직접**
> 멀티쿼리(`.from()` 121회·`getUser()` 39회)하고, 같은 read 로직이 클라/서버에
> 중복된다. 이게 워터폴·중복인증·과대 fetch 를 *계속 재생산*하는 토양이다.
>
> **전면 재작성은 안 한다.** (메모리 `[[backlog_codebase_audit_20260603]]`) 대신
> **strangler fig 점진 이전**: 목표 패턴을 확립하고, 가드레일로 *새* 증상을 막고,
> 핫패스부터 한 슬라이스씩 옮긴다. 매 슬라이스마다 e2e green 유지. 언제 멈춰도 앱은 동작.

---

## 목표 패턴 (새 코드는 이걸 따른다)

### 1. 서버에서 fetch, 클라는 props 만
- 데이터 read 는 **Server Component / Route Handler / 데이터 계층**에서. `'use client'`
  컴포넌트는 **상호작용**(상태·이벤트)만 담당하고 데이터는 **props 로 받는다.**
- 클라에서 새 `supabase.from()` read 를 추가하지 말 것. 이미 있는 건 점진 이전.
- 예외(클라 직접 쿼리 허용): **사용자 액션에 의한 mutation**(저장·좋아요·추가 등
  버튼 핸들러), 그리고 *이전 전*인 레거시. 신규 read 는 서버로.

### 2. 데이터 계층 = read 의 단일 출처 (`lib/queries/`)
- 엔티티/화면별 read 함수를 `lib/queries/<area>.ts` 에 모은다. 예: `recipeDetail.ts`.
- 페이지/라우트는 이 함수만 호출 → **얇게**. 같은 쿼리가 여러 곳에 흩어지지 않는다.
- 파일 맨 위 `import 'server-only'` — 클라 번들 유입 차단(서비스키·쿠키 클라이언트 보호).

### 3. 멀티쿼리는 DB 에서 집계 (RPC) — 가능하면
- 한 화면에 (recipe_id, user_id) 류 read 가 여러 개면 **Postgres RPC 하나**로 합쳐
  round-trip·RLS 평가 횟수를 줄인다. (예: 레시피 engagement 5쿼리 → 1 RPC)
- **전역 집계(다른 유저 데이터 포함)는 `SECURITY DEFINER` 함수**로 RLS 우회 +
  내부에서 `auth.uid()` 로 호출자 스코프. 이미 있는 예: `recipe_cooked_count(p_recipe_id)`.
- 서로 독립인 read 는 최소 `Promise.all` 로 병렬. **직렬 await 금지.**

### 4. 과대 fetch 금지
- `select('*')` 대신 **쓰는 컬럼만** 명시. 목록/카드는 더더욱.
- 개수는 `count: 'exact', head: true` (행 미반환). `.select()` 결과 `.length` 로 세기 금지
  (PostgREST 1000행 silent 제한 — `[[CLAUDE.md]]` 참조).

### 5. 캐시는 *공용·사용자무관* 데이터에만
- 공개 read(예: published 레시피 본문)는 `unstable_cache`(time-based revalidate)로 공유.
- **사용자별/비공개 데이터는 절대 공유 캐시 금지**(유출). cookieless anon 클라이언트로
  공개분만 캐시하고, 사용자별은 캐시 밖 라이브. 예: `getCachedPublishedRecipeBody`.

---

## 점진 이전 playbook (슬라이스 1개 = 1 PR)

1. 대상 화면의 모든 read 를 찾는다(페이지 + 그 화면 클라 컴포넌트의 `.from()`).
2. `lib/queries/<area>.ts` 에 read 함수로 옮긴다. **1단계는 행위보존**(쿼리 그대로,
   위치만 이동). e2e baseline 선확인 → 이동 → 동일 통과수.
3. 그 다음(별도 커밋) 최적화: 멀티쿼리 → RPC, `select('*')` → 컬럼 명시, 직렬 → 병렬.
   **동작 변경(fix)과 행위보존(refactor)은 반드시 별도 커밋.**
4. 클라 컴포넌트의 read 는 서버에서 내려준 props 로 대체. mutation 만 남긴다.
5. 검증: `lint → build → vitest → 해당 e2e`(fresh build, `:3000` 죽이고).

### 레퍼런스 슬라이스 (템플릿)
- **레시피 상세** (`app/[lang]/recipes/[id]/`) — `lib/queries/recipeDetail.ts` 로
  전(全) read 이전 완료(2026-06-08, 행위보존). 새 슬라이스는 이걸 본떠 작업.
- 후속(별도): engagement 5쿼리 → `get_recipe_engagement` RPC, cooked_count 를
  전역(`recipe_cooked_count`)으로 교정(= *동작 변경*이라 분리).

---

## 가드레일 (재발 차단 — 사람 규율 아니라 파이프라인)
`npm run scan:fragility` 에 룰 추가됨 (2026-06-08, NOTE = 비블로킹 부채 추적):
- `[NOTE]` **client-direct-read** — `'use client'` 파일의 `.from(...).select` read
  (mutation insert/update/delete/upsert 는 제외). **baseline 27파일 / 51곳** — 숫자가 줄어야 함.
  파일별 리스트를 출력해 *새* 위반이 diff 에 드러남.
- `[NOTE]` **select-star** — `select('*')` 사용처 수. **baseline 67곳**.
- god-file(`scan:line-counts`)·date-utc(BLOCK) 가드와 같은 자리. `--json` CI 파싱 지원.
- 블로킹(ratchet)으로 올릴지는 이전 진척 보며 결정 — 지금은 NOTE 로 burndown 추적.

---

## 진척 체크리스트 (이전된 슬라이스)
- [x] 레시피 상세 read → `lib/queries/recipeDetail.ts` (행위보존, 2026-06-08)
- [ ] engagement RPC 집계 + cooked_count 전역 교정 (동작 변경, 별도)
- [ ] 검색(`SearchClient`) read 이전
- [ ] 홈(`HomeClient`) 클라 read 이전
- [ ] 프로필/설정 등 나머지 26개 클라 쿼리 파일
- [ ] 가드레일 scan 룰 점등
