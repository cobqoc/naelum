# 만들어봤어요 흐름 + 나만의 메모 리디자인 (설계)

> 작성: 2026-06-02. 설계 확정, 구현은 단계적. **메모 부분은 보류(다음 세션)**, 만들어봤어요(별점·난이도·사진)는 먼저 구현.

## 배경 — 현재 흐름의 문제

`🍳 만들어봤어요`(조리순서 탭 끝 버튼, `StepsTab.tsx:210`, `showMadeIt={!isAuthor}`) → `MadeItModal` 이
**별점 ⭐ + 사진 + 후기 textarea 를 한 번에** 띄움. 전부 선택이지만 "폼 벽"이라 사용자가:
1. "그냥 만들었다 기록만" 하는 길을 못 봄(빈 채 제출 가능한 걸 모름)
2. **만든 직후 = 후기 쓸 때가 아님** — 아직 안 먹었고 정신없음. 맛 평가는 먹고 나서 나오는 신호.

## 핵심 개념 — 피드백 3종, 시점·공개·저장위치가 다름

| # | 종류 | 공개 | 자연스러운 시점 | 저장 위치 | 현재 |
|---|---|---|---|---|---|
| ① | **맛 ⭐ + 후기** | 공개(피드) | **먹고 나서** | `recipe_posts` | ✅ 있음 |
| ② | **체감 난이도**(쉬움/적당/어려움) | 공개(집계) | **만든 직후**(과정 기억 신선) | `cooking_sessions.difficulty_felt` 🆕 | ❌ |
| ③ | **나만의 메모**("소금 반으로") | 비공개 | 아무때나(누적) | `recipe_notes` 🆕 | ⚠️ 현재 `recipe_saves.notes`(저장 종속) |

**원칙**
- 과정 신호(②)는 만든 직후, 맛(①)은 먹고 나서 — 각 순간 **원탭, 폼 벽 금지**.
- 메모(③)는 **"이벤트"가 아니라 "지속 기록"** — 어떤 모달의 단계가 되면 안 됨. 별점·난이도(1회 이벤트)와 섞지 않는다.

---

## A. 만들어봤어요 (먼저 구현)

### 1단계 — 만든 직후 (MadeItModal 슬림화)
```
🍳 만들어봤어요
 ├ 📸 완성 사진 (선택, 모바일 capture로 카메라 바로)
 ├ 따라하기 어땠어요? [쉬웠어요][적당][어려웠어요]  ← 원탭, 선택 (= difficulty_felt 1/2/3)
 └ [기록하기]
→ POST /complete (photo + difficulty_felt)
→ 토스트 "기록됐어요! 맛있게 드세요 😋" + 작은 링크 `먹고 나서 별점 남기기`
```
- **제거**: 이 모달의 맛 별점 ⭐, 긴 후기 textarea. (직후엔 ②만, ①은 뺌)
- 사진=지금 제일 예쁨/자연스러움, 난이도=방금 따라한 과정이라 신선. **맛보기 전에 아는 것만.**

### 2단계 — 먹고 나서 (맛 평가, 공개)
- 별점 ⭐ + 후기 → `POST /posts` (1단계 사진 재사용 `photo_url`).
- 진입점: ⓐ 1단계 토스트 링크 ⓑ **레시피 재방문 시 상단 prompt**(cooking_session 있는데 내 리뷰 없으면 "이거 만들어보셨네요! 맛은 어땠어요? ⭐") ⓒ 프로필 `cooked` 탭 pending.

### 스키마
```sql
ALTER TABLE cooking_sessions ADD COLUMN difficulty_felt smallint
  CHECK (difficulty_felt BETWEEN 1 AND 3);  -- 1=쉬움,2=적당,3=어려움
```
- 적용: **dev(jmyrdoguxlizvajfcwep) → 검증 → prod(rgnlgpfazxgwsnkgrhzs)**.
- 집계(추천/표시)는 **데이터 축적 후**(추천 섹션 부활 trigger와 동일) — 지금은 **수집만**.

### 파일
- `supabase/migrations/2026XXXX_cooking_difficulty.sql` 🆕
- `app/api/recipes/[id]/complete/route.ts` — `difficulty_felt` 수신·저장(`.error` 체크)
- `components/RecipePosts/MadeItModal.tsx` — 슬림화(⭐·후기 제거, 난이도 3버튼, 모바일 capture)
- `components/RecipePosts/RecipePostsFeed.tsx` / 신규 `ReviewLaterPrompt` — 2단계 별점 진입(재방문 prompt)
- `app/[lang]/recipes/[id]/RecipeDetailClient.tsx` — 재방문 prompt 상태(cooking_session 있는데 내 리뷰 없음)
- `lib/i18n/locales/*.ts`(8개) — 난이도 라벨·prompt 문구
- `e2e/` — 1단계 기록·난이도, 2단계 재유도 spec

---

## B. 나만의 메모 (보류 — 다음 세션)

### 결정된 방향: "조리순서 탭에 고정(pin)된, 저장과 무관한 내 지속 기록"

메모는 **쓰는 순간보다 다시 만들 때 읽는 순간**이 중요(스토브 앞에서 "지난번 짰지 → 소금 반" 적용).
따라하기=조리순서 탭에 인라인이므로 **메모의 집 = 조리순서 탭**.

| 역할 | 위치 | 동작 |
|---|---|---|
| **읽기(핵심)** | 조리순서 탭 상단 **sticky 핀 카드** | 단계 따라가며 `✏️ 내 메모: 소금 반으로` 항상 보임(스크롤 따라옴) |
| **쓰기/수정** | 같은 핀 카드 인라인 편집 | 요리 중에도 먹고 나서도 아무때나. 단계 아님 |
| **둘러보기** | 프로필 낼름함/만든요리 탭 미리보기 | 현행 유지 |

- **저장 종속 해제**: `recipe_saves.notes` → 신규 `recipe_notes`(user·recipe UNIQUE, 비공개 RLS 4종). 로그인만 하면 어떤 레시피든 메모.
- **어떤 모달의 단계도 아님**. 2단계 리뷰 끝에 `✏️ 내 메모 남기기` 넛지만, 입력은 조리순서 탭 핀에서.

### 스키마 (보류)
```sql
CREATE TABLE recipe_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  note text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);
ALTER TABLE recipe_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_select ON recipe_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notes_insert ON recipe_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY notes_update ON recipe_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY notes_delete ON recipe_notes FOR DELETE USING (auth.uid() = user_id);
-- 기존 recipe_saves.notes 1회 마이그레이션 후 deprecate
```

### 파일 (보류)
- `supabase/migrations/2026XXXX_recipe_notes.sql` 🆕 + RLS + saves.notes 이관
- `app/api/recipes/[id]/notes/route.ts` 🆕 (GET/PUT/DELETE, service-role 아님)
- `components/Recipes/_browse/StepsTab.tsx` — 상단 sticky 메모 핀(읽기+인라인 편집)
- `components/RecipeBrowseView.tsx` — 기존 333-403 메모 블록 제거(조리순서 핀으로 이동), recipe_notes 연결
- `app/[lang]/recipes/[id]/RecipeDetailClient.tsx` — saveNotes 종속 제거

### 보류한 래빗홀
- **단계별/재료별 구조화 조정**(3단계 "20분으로", 소금 5g→3g 항목별 오버레이) = 사실상 *나만의 리믹스*. 낼름 기존 리믹스와 겹침. 자유 텍스트 핀 한 장이 예시 90% 커버 → **수요 확인 후로 보류.**

---

## 검증 (구현 시)
`lint(0) → build → vitest → e2e`. e2e 최종 회귀는 `:3000` 죽이고 fresh build. RLS는 dev에서 타인 메모/세션 차단 확인. 스키마는 dev→prod 순서.
