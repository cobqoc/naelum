# 재료 매칭 시스템 재설계 — 본질 해법

> **작성일**: 2026-05-29
> **저자**: 사용자 + Claude 협업
> **상태**: 설계 단계 (구현 trigger 대기)
>
> **관련 메모리**: [[ingredient-match-honesty-policy]] · [[project_ingredient_match_prefix_bug]] · [[project_is_demo_record_uuid_bug]]
> **관련 PR**: #197(SUBSTITUTES 비움+PREPARABLE 3그룹) · #198(buildAliasGraph+알레르기 분리) · #199(다진마늘→편마늘 거짓 fix)

---

## 0. 한 줄 요약

> 재료를 "이름 문자열"로 매칭하는 *추측 기반* 시스템에서, "(ID, 형태, 메타데이터)" *결정 기반* 시스템으로 전환.

표면 fix를 반복하면 부분 fix의 부채가 누적되는데, 본 문서는 그 *근본 원인*을 제거하는 데이터 모델 재설계를 정의한다.

---

## 1. Why — 현재 시스템의 근본 한계

### 1-1. 모든 매칭 함수의 *공통 가정*

```
"재료 이름 문자열만 보고 시스템이 추측해서 매칭한다"
```

이 가정 자체가 버그의 근원. `INGREDIENT_ALIASES`·`SUBSTITUTES`·`PREPARABLE_TO`·`ALLERGEN_SYNONYMS`·`normalizeIngredientName` 다 *추측의 정확도를 높이는* 방향. 정도의 차이일 뿐 본질적 한계 동일.

### 1-2. 발견된 버그 사례 (다 같은 부류)

| 사례 | 원인 | PR/시점 |
|---|---|---|
| `고추장 ≠ 고추` (prefix 오매칭) | substring 추측 | 2026-05-17 fix |
| `isAlmost` 절대 33% 기준 | 추측 분류 | 2026-05-17 fix |
| 케첩 ↔ 토마토소스 (양방향 대체) | "비슷하면 같다" 추측 | 2026-05-29 정직성 정책 |
| 진간장 ↔ 국간장 | "같은 간장이면 같다" 추측 | 2026-05-29 |
| 청양고추 ↔ 풋고추 | "같은 고추속이면 같다" 추측 | 2026-05-29 |
| **다진마늘 → 편마늘** ("다진마늘로 만들 수 있어요") | 정규화로 가공형이 원형으로 둔갑 | 2026-05-29 부분 fix |
| **땅콩 알레르기 → 일반 버터까지 차단** | substring 양방향 + 합성어 토큰 | 2026-05-29 미해결 |

**공통 패턴**: 시스템이 사람이 작성한 *부정확한 추상화*에 의존. 새 매핑 추가할 때마다 같은 부류 버그 재발 위험.

### 1-3. 정규화 함수의 모순

`normalizeIngredientName` 13개 접두사를 한 묶음으로 취급:

```
'잘게 썬','채 썬','채썬','잘게','굵게','다진','볶은','구운','삶은','데친','말린','으깬','냉동'
```

의미가 *섞여 있음*:
- 모양 변경 (다진·잘게·굵게·으깬) — **원형 권한 없음**
- 조리 단계 (볶은·구운·삶은·데친·말린) — *문맥에 따라* 본질 같음/다름
- 저장 상태 (냉동) — *문맥에 따라* 본질 같음/다름

SHAPE/STATE 분리도 *임의적 추상화*. "삶은 계란"은 STATE이지만 마요네즈·머랭 레시피엔 *생계란* 필요. "말린 표고"는 STATE 같지만 정직성 정책에서 *새 재료*로 분리. 단순 분류로 안 풀린다.

### 1-4. 알레르기 substring의 모순

```ts
ALLERGEN_SYNONYMS['땅콩'] = ['피넛', 'peanut', '땅콩버터', '땅콩기름', ...]
// 동의어와 합성어가 같은 데이터에 섞임

// 매칭: 양방향 substring
if (ri.includes(token) || token.includes(ri)) return true
//                       ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
//                       false positive 원인
```

땅콩 알레르기 사용자가 *일반 버터 든 모든 레시피* 차단되는 사례 발견 (2026-05-29). 의도된 보수성으로 인정되지만 UX 심각.

---

## 2. What — 본질 해법: ID + 형태 메타데이터 모델

### 2-1. 핵심 원칙

> **시스템이 추측하지 않는다.**
> 재료의 정체성·형태·관계는 *데이터*로 명시한다.

매칭은 *결정적*. "같으면 같다고 데이터에 있다", "다르면 다르다고 데이터에 있다". 새 부류 버그 재발 가능성 0.

### 2-2. 데이터 모델

```
재료 = (id, canonical_name, forms[], aliases[], allergens[], category)

매칭 = (id_same? AND form_compatible?)
알레르기 = (사용자_알레르기 ∩ 재료.allergens != ∅)
```

#### 핵심: `forms` 모델

```ts
{
  id: 'uuid-garlic',
  canonical_name: '마늘',
  forms: [
    {
      id: 'raw',
      name: '통마늘',
      compatible_with: ['raw', 'minced', 'sliced', 'paste', 'juiced'],  // 원형은 모든 form 만들 수 있음
    },
    {
      id: 'sliced',
      name: '편마늘',
      compatible_with: ['sliced', 'minced', 'paste'],  // 편마늘은 다지거나 으깰 수 있음
    },
    {
      id: 'minced',
      name: '다진마늘',
      compatible_with: ['minced', 'paste'],  // 다진 건 더 으깨는 것만 가능
    },
    {
      id: 'paste',
      name: '마늘페이스트',
      compatible_with: ['paste'],
    },
    {
      id: 'juiced',
      name: '마늘즙',
      compatible_with: ['juiced'],
    },
  ],
  aliases: ['통마늘', 'garlic', '蒜', 'garlic clove'],
  allergens: ['마늘'],  // 자기 자신 (FODMAP·드문 알레르기)
}
```

#### 호환성 행렬 (compatible_with 의미)

`A.compatible_with = [B, C]` ⟺ "form A 보유 → form B 또는 C 필요한 레시피에 사용 가능"

| 사용자 보유 form | 만들 수 있는 form | 의미 |
|---|---|---|
| raw (통마늘) | raw, minced, sliced, paste, juiced | 원형은 *모든* 형태 가능 |
| sliced (편마늘) | sliced, minced, paste | 편 다지면 다진/페이스트 |
| minced (다진마늘) | minced, paste | 다진 거 더 으깨면 페이스트 |
| paste (마늘페이스트) | paste | 페이스트는 페이스트만 |
| juiced (마늘즙) | juiced | 즙은 즙만 |

**원칙**: *가공 단계가 낮을수록 호환성 넓음.* 단방향 자연 보장.

### 2-3. 매칭 알고리즘

```ts
function matchIngredient(
  user: { id: string; form: string },
  recipe: { id: string; form: string },
): MatchResult {
  // 1. id 비교 — 같은 재료 본질
  if (user.id !== recipe.id) {
    // id 다름 — substitute 그래프 lookup (DB ingredient_relations)
    const subVia = findSubstitute(user.id, recipe.id)
    if (subVia) return { kind: 'substitute', via: user.id }
    return { kind: 'missing' }
  }

  // 2. form 호환성 검사
  const userForm = lookupForm(user.id, user.form)
  if (userForm.compatible_with.includes(recipe.form)) {
    return user.form === recipe.form
      ? { kind: 'owned' }       // ✓ 정확 보유
      : { kind: 'preparable' }  // 🍳 가공해서 만들 수 있음
  }
  return { kind: 'missing' }
}
```

**효과**:
- 다진마늘(form=minced) 보유 → 편마늘(form=sliced) 필요 → minced.compatible_with=['minced','paste'] → sliced 없음 → missing ✓
- 마늘(form=raw) 보유 → 다진마늘 필요 → raw.compatible_with=['*'] → minced 포함 → preparable 🍳 ✓
- 정규화 *부작용 0* — 이름 문자열 비교 안 함

### 2-4. 알레르기 매칭 — 재료 마스터의 `allergens` 컬럼 활용

```ts
function isAllergenicForUser(
  userAllergens: string[],   // 사용자 등록 알레르기 ['땅콩', '대두']
  recipeIngredientIds: string[],
): boolean {
  // 사용자 알레르기를 표준 알레르겐 키로 정규화 (땅콩↔peanut)
  const standardAllergens = new Set(
    userAllergens.flatMap(a => ALLERGEN_CANONICAL[a] ?? [a])
  )
  
  // 레시피 재료 각각의 allergens 컬럼 검사
  for (const id of recipeIngredientIds) {
    const ingredient = lookupIngredient(id)
    for (const a of ingredient.allergens) {
      if (standardAllergens.has(a)) return true
    }
  }
  return false
}
```

**효과**:
- 사용자 "땅콩" 알레르기 + 레시피 "버터" 재료 → buttter.allergens = ['우유'] → 차단 X ✓
- 사용자 "땅콩" 알레르기 + 레시피 "땅콩버터" 재료 → 땅콩버터.allergens = ['땅콩', '우유'] → 차단 ✓
- substring 매칭 사라짐 — false positive 0
- ALLERGEN_SYNONYMS는 *canonical 매핑*만 (땅콩↔peanut 표준화)

### 2-5. 의미적 분리

| 데이터 | 위치 | 역할 |
|---|---|---|
| **재료 ID + name + canonical_name** | `ingredients_master.id/name` | 정체성 |
| **forms[] (호환성 그래프)** | `ingredients_master.forms` jsonb | 가공 관계 |
| **aliases[]** (동의어) | `ingredients_master.aliases` ARRAY | 검색·자동완성·이름 매칭 fallback |
| **allergens[]** (이 재료의 알레르겐) | `ingredients_master.allergens` ARRAY | 알레르기 안전 |
| **ingredient_relations** (동등 관계) | DB 테이블 | substitute(양방향) 어드민 승급 매핑 |
| **search synonyms** | `ALLERGEN_CANONICAL` 코드 상수 | 알레르기 입력 정규화 (땅콩↔peanut) |

기존 `INGREDIENT_ALIASES`·`SUBSTITUTES`·`PREPARABLE_TO`·`ALLERGEN_SYNONYMS`·`normalizeIngredientName`는 **deprecated**. 점진 제거.

---

## 3. How — 마이그레이션 단계

### Phase 0 — 사전 준비 (1주)

- [ ] DB 스키마 마이그레이션
  - `ingredients_master.forms` jsonb (구조 위 2-2 참고)
  - `ingredients_master.allergens` ARRAY 확장 (이미 존재, 거의 비어있음)
  - `ingredients_master.aliases` ARRAY 확장 (이미 존재, 8 row만 채워짐)
  - 신규 테이블 `ingredient_relations`(from_id, to_id, kind: 'substitute'|'alias', source, suggestion_count)
- [ ] 매칭 함수 신규 작성 (기존과 병존)
  - `matchIngredientV2(user, recipe)` — ID·form 기반
  - `getAllergensV2(userAllergens, recipeIngredients)` — allergens 컬럼 기반
  - 기존 함수는 fallback으로 유지
- [ ] feature flag `INGREDIENT_MATCH_V2` 환경변수
  - 기본 false (구 시스템 사용)
  - 개발 환경에서 true로 신규 테스트

### Phase 1 — 데이터 채우기 (2~3주, 핵심 작업)

prod ingredients_master 1,694 row 중 매칭 핵심 메타가 **0.1~0.5%만 채워짐**. 본질 작업은 데이터.

#### 1-A. aliases 채우기 (자동 마이그레이션)

코드 상수 `SYNONYM_GROUPS` 71 그룹 → DB로 이전:

```sql
-- 예: '쌀' row의 aliases에 ['백미'] 추가
UPDATE ingredients_master
SET aliases = ARRAY['백미']
WHERE name = '쌀';
```

스크립트: `scripts/migrate-aliases-to-db.ts`
- SYNONYM_GROUPS 순회
- 각 그룹의 첫 멤버 = canonical name으로 ingredients_master row 찾기
- 나머지 멤버 = aliases 컬럼에 ARRAY로 추가
- 매칭 안 되는 멤버는 새 row로 생성 (canonical 표시)

예상 결과: 1,694 row 중 약 200~300 row에 aliases 채워짐.

#### 1-B. allergens 채우기 (식약처 22품목 기준)

코드 상수 `ALLERGEN_SYNONYMS` → DB로 이전:

```sql
-- 예: '땅콩버터' row의 allergens에 ['땅콩', '우유'] 추가
UPDATE ingredients_master
SET allergens = ARRAY['땅콩', '우유']
WHERE name = '땅콩버터';
```

스크립트: `scripts/migrate-allergens-to-db.ts`
- ALLERGEN_SYNONYMS의 28개 매핑 → 각 재료의 allergens 컬럼
- 합성어("땅콩버터") 처리 — substring 매칭으로 *원료 식별* (땅콩버터 ← 땅콩 + 우유 두 알레르겐)
- 어드민 검수 후 적용 (수동 review 필수 — 알레르기 안전 critical)

#### 1-C. forms 채우기 (수동 + 스크립트)

가장 큰 작업. 현재 1,694 row 중 다진마늘·편마늘 등 *가공형이 별도 row*로 등록됨. 이를 원형 row의 forms[]로 통합.

수동 검토 필요한 케이스:
- 마늘 (원형) + 다진마늘·편마늘 (가공형 row) → 마늘 row의 forms[]로 통합 후 가공형 row 삭제 + ingredient_id 재맵핑
- 쌀 + 백미 (alias) + 밥 (가공형) → 쌀 row의 forms[]로 통합
- 우유 + 요거트 (발효, *별 재료로 분리* 정직성 정책)
- 토마토 + 토마토소스 (졸이기, 별 재료로 분리)

가공 분리 정책 (이번 2026-05-29 정직성 정책 반영):
- ✅ 단순 모양 변경 (다진·편·즙) → 같은 재료의 forms
- ❌ 발효·조리·졸이기 (요거트·토마토소스·구운고기) → *별 재료*

스크립트: `scripts/migrate-forms-from-ingredients.ts`
- 정직성 정책 기준 자동 통합 후보 제시
- 어드민이 case-by-case 승인
- 작업 추적용 별도 테이블 `migration_log_forms`

예상 결과: 약 50~100 row의 forms[] 채워짐. 이 정도면 자주 쓰이는 재료 다 커버.

#### 1-D. recipe_ingredients 재매핑

가공형 row가 forms로 통합되면 ingredient_id가 변함. 16,274 row의 recipe_ingredients 영향.

스크립트: `scripts/remap-recipe-ingredients.ts`
- 옛 ingredient_id → 새 (id + form)으로 매핑
- recipe_ingredients에 form 컬럼 추가 (jsonb 또는 ARRAY)
- 트랜잭션으로 일관성 보장

### Phase 2 — 코드 전환 (1주)

- [ ] feature flag 켜기 (개발 환경)
- [ ] 회귀 가드 광범위 추가 (300+ 신규 테스트 예상)
  - 사례 기반: 이전 모든 버그 케이스를 V2에서 정확히 처리하는지
  - 다진마늘 → 편마늘 = missing ✓
  - 땅콩 알레르기 + 일반 버터 = 통과 ✓
  - 마늘 → 다진마늘 = preparable ✓
  - 쌀 → 밥 = preparable ✓
- [ ] e2e 회귀 통과
- [ ] feature flag 단계적 켜기 (10% → 50% → 100%)
- [ ] 옛 함수 deprecate 마킹

### Phase 3 — 정리 (1주)

- [ ] 옛 함수 제거 (`isSameIngredient`·`isSubstituteFor`·`getSubstituteKind`)
- [ ] 옛 데이터 상수 제거 (`INGREDIENT_ALIASES`·`SUBSTITUTES`·`PREPARABLE_TO`·`ALLERGEN_SYNONYMS`)
- [ ] `normalizeIngredientName` *검색·집계용*으로만 격리 (매칭과 분리)
- [ ] CHANGELOG·메모리 업데이트

**총 4~5주.** Phase 1(데이터 채우기)이 70%.

---

## 4. 호출처 영향 (5곳)

| 호출처 | 영향 |
|---|---|
| `app/api/recommendations/route.ts` | 매칭 함수 V2로 전환. 호환 가능 (matchIngredientV2가 같은 interface) |
| `lib/hooks/useRecipeFridgeMatch.ts` | isIngredientOwned·findSubstitute V2 사용 |
| `lib/recommendations/allergyFilter.ts` | getAllergensV2 사용 — ALLERGEN_SYNONYMS substring 매칭 제거 |
| `lib/recipes/highlightOptionalIngredients.ts` | aliases는 ingredients_master에서 lookup. 옛 상수 deprecate |
| `components/Recipes/_browse/IngredientsTab.tsx` | match 결과 객체 구조 그대로 사용 (kind: 'owned'|'preparable'|'substitute'|'missing') |

UI 컴포넌트 영향 최소화 — 매칭 결과 객체 *interface 유지*.

---

## 5. 회귀 가드 — 본질 검증 체크리스트

이번 버그 사례 다 V2에서 false positive·negative 0 보장:

- [ ] 다진마늘 보유 → 통마늘 절임 = missing
- [ ] 다진마늘 보유 → 편마늘 = missing
- [ ] 마늘 보유 → 다진마늘 = preparable 🍳
- [ ] 마늘 보유 → 편마늘 = preparable 🍳
- [ ] 쌀 보유 → 밥 = preparable
- [ ] 밥 보유 → 쌀 = missing
- [ ] 우유 보유 → 요거트 = missing (정직성 — 별 재료)
- [ ] 토마토 보유 → 토마토소스 = missing
- [ ] 사용자 "땅콩" 알레르기 + 레시피 "버터" 재료 = 통과
- [ ] 사용자 "땅콩" 알레르기 + 레시피 "땅콩버터" 재료 = 차단
- [ ] 사용자 "milk" 알레르기 + 레시피 "almond milk" = 차단 (substring 자동)
- [ ] 사용자 "milk" 알레르기 + 레시피 "milk" = 차단 (정확 매칭)
- [ ] 진간장 ≠ 국간장 (정직성 정책 유지)
- [ ] 청양고추 ≠ 풋고추
- [ ] 케첩 ≠ 토마토소스
- [ ] 다진마늘 보유 → 마늘 = missing (정직성 — 가공형 → 원형 X)

---

## 6. Trigger — 언제 시작할까

이 작업은 4~5주 큰 변경이라 trigger 신중히:

### 시작 가능 trigger (둘 중 더 빨리 오는 것)

**A. 작성자 substitutes 5건+ 누적** (현재 1건 = admin 본인)
- 어드민 승급 UI Phase 1과 함께 — 어차피 데이터 모델 만지니까
- 본 설계가 어드민 승급 인프라와 일관

**B. 사용자 100명+ 또는 messy 이름 매칭 실패 보고**
- 사용자 다양성 → 작성자 표기 다양성 → FK 매칭 한계 노출

### 시작 *미루는* 명확한 신호

- prod `recipe_ingredients.substitutes` 입력 여전히 1건 = admin 본인
- 사용자 보고 0건
- 추천 시스템 사용자 만족도 ≥ 일정 수준

### 미루는 동안 *할 일* (Phase 0 일부 선제)

- [ ] `ingredient_relations` 테이블 마이그레이션만 미리 적용 (현재 0 row 영향 0)
- [ ] feature flag 인프라 구축
- [ ] aliases 마이그레이션 스크립트 작성 (실행은 trigger 후)

이 정도는 trigger 전에 해두면 trigger 후 작업 단축.

---

## 7. 대안 — 본질이 아니라고 판단된 안

설계 과정에서 검토된 대안. 본질 해법으로 채택 안 함:

### 7-1. SHAPE/STATE 접두사 분리

- 가공 접두사를 SHAPE(다진·잘게·굵게)와 STATE(볶은·삶은·말린)로 분류
- **문제**: STATE도 *문맥에 따라* 단방향 (삶은 계란 → 생계란 필요 마요네즈 X). 단순 분류 또 다른 추상화 실수
- 채택 X

### 7-2. ALLERGEN 동의어만 + 단방향 substring

- ALLERGEN_SYNONYMS에서 합성어 제거 + `token.includes(ri)` 제거
- **문제**: 동의어 vs 합성어 경계 모호. 미래 추가 시 또 같은 부류 버그
- 채택 X

### 7-3. 사용자가 매칭 의도 직접 표현

- 매칭 자동 추측 줄이고 사용자 통제 강화 ("이 다진마늘로 통마늘 요리 만들까요?")
- **문제**: UX 거추장스러움. 사용자 입력 부담
- 채택 X

### 7-4. ML 기반 학습 매칭

- 과거 사용자 행동 데이터 누적 → 매칭 학습
- **문제**: 콜드 스타트, 데이터 부족. 사용자 5000명+ 필요
- 미래 가능성 (Phase 4 이후)

---

## 8. 데이터 통계 (2026-05-29 기준)

prod `ingredients_master` 1,694 row:

| 메타 | 채움 | 비율 | 본질 해법 필요 |
|---|---|---|---|
| description | 1,421 | 84% | 아니오 (표시용) |
| storage_tips | 1,417 | 84% | 아니오 |
| seasons | 1,417 | 84% | 아니오 |
| tastes | 1,417 | 84% | 아니오 |
| pairs_well_with | 1,416 | 84% | 아니오 |
| common_units | 1,674 | 99% | 아니오 |
| emoji | 994 | 59% | 아니오 |
| name_en | 278 | 16% | 향후 i18n |
| calories | 138 | 8% | 향후 영양 |
| **aliases** | **8** | **0.5%** | **예 — Phase 1-A** |
| **allergens** | **2** | **0.1%** | **예 — Phase 1-B** |
| **forms** (미존재) | — | — | **예 — Phase 0+1-C** |
| substitutes | 0 | 0% | 예 (작성자 입력 누적) |
| nutrition jsonb | 0 | 0% | 향후 |
| image_url | 0 | 0% | 향후 |

**관찰**: 표시·표현 메타 80%+ vs 매칭·안전 메타 0.5% 이하. 본질 해법 작업의 80%는 후자 채우기.

---

## 9. 결론

> **이 설계는 표면 fix의 부채를 더이상 누적하지 않기 위함이다.**

부분 fix를 반복하면 비슷한 버그가 반복 발생한다. 사용자 신뢰 손상이 누적된다. 본질 해법은 변경 폭 크지만 *재발 0*을 보장하는 데이터 모델로의 전환이다.

지금 즉시 시작하지 않아도 된다. **데이터·사용자 수가 의미 있게 쌓이는 시점**(작성자 substitutes 5건+, 사용자 100명+, 또는 messy 이름 매칭 실패 보고)에 한 번에 마이그레이션하는 게 합리적이다.

그 사이에 부분 fix는 *피한다* — 또 다른 추상화 실수가 본질 해법 마이그레이션 시 부채로 작용한다.

---

## 부록 A — 본 문서가 deprecated 시점

본 설계가 구현되어 다음 조건 충족 시 이 문서를 `docs/archive/`로 이동:
- V2 매칭 함수가 prod에서 100% 사용 (feature flag 제거)
- 옛 데이터 상수 전부 제거
- 회귀 가드 통과
- 마이그레이션 회고 별도 문서 생성
