import { levenshteinSimilarity } from '@/lib/utils/levenshtein'
import { normalizeIngredientName } from '@/lib/ingredients/normalizeIngredientName'

/**
 * 재료 매칭 — 두 종류의 관계를 분리한다.
 *
 * - INGREDIENT_ALIASES   : *같은 재료*의 다른 이름 (계란=달걀, 소고기=쇠고기,
 *   양조간장=간장). 또는 "특정 종류 ⊂ 일반명"(스팸 ⊂ 통조림 햄, 신라면 ⊂ 라면)
 *   처럼 한쪽을 가지면 다른 쪽을 *가졌다고 말할 수 있는* 관계.
 *   → "보유 ✓" 판정에 쓴다(`isSameIngredient`).
 *
 * - INGREDIENT_SUBSTITUTES : *다른 재료*지만 바꿔 쓸 수 있는 관계
 *   (까나리액젓↔멸치액젓, 모짜렐라↔체다, 버터↔마가린). 가졌다고 말하면 거짓말이라
 *   "보유"가 아니라 "대체 가능"으로 다룬다.
 *   → 추천 "만들 수 있나" 판정 + "대체 가능" 표시에 쓴다(`isSubstituteFor`).
 *
 * 형제 특정명끼리(멸치액젓↔까나리액젓)는 SUBSTITUTES, 일반명↔특정명
 * (액젓↔까나리액젓)은 ALIASES. 매칭은 양방향 *정확 일치*만 본다 — substring
 * 비교 금지(`까나리액젓`의 동의어 `액젓`이 `멸치액젓`에 포함된다는 이유로
 * 오매칭하던 버그가 정확히 그 때문).
 */

/**
 * ALIAS 그룹 정의 — `buildAliasGraph()` 가 양방향 인접 리스트 `INGREDIENT_ALIASES`
 * 자동 생성. 한 방향만 적은 누락 버그 차단 (2026-05-29 도입).
 *
 * 두 가지 그룹 타입:
 *  1. **SYNONYM_GROUPS**: 그룹 내 모든 멤버가 *서로* alias (양방향 페어 전체).
 *     예: ['달걀','계란','egg'] → 달걀↔계란, 달걀↔egg, 계란↔egg
 *  2. **HYPONYM_GROUPS**: 일반명 ↔ 각 특정명만 양방향, 특정명끼리는 alias 아님.
 *     예: '간장' ⊃ ['진간장','국간장'] → 간장↔진간장 ✓, 간장↔국간장 ✓, 진간장↔국간장 ✗
 *     사용 사례: 진간장(단·진한) vs 국간장(짠·맑은) — 둘 다 "간장"이지만 정직성
 *     정책상 *서로* 대체 아님.
 *
 * **같은 멤버 여러 그룹 등장**: union 처리. 예: '호박' 이 ['애호박','주키니','호박']
 * 과 ['호박','단호박','늙은호박'] 양쪽에 있으면 호박 인접 리스트가 두 그룹 union.
 * 다른 그룹의 *다른* 멤버끼리(애호박↔단호박)는 직접 연결 안 됨 — 호박을 통한 간접만.
 *
 * **알레르기 분리**: 알레르기 안전 매핑은 `./allergens.ts` 의 ALLERGEN_SYNONYMS
 * 별도. ALIAS 정리(동의어 의미)와 알레르기 안전 critical path 결합 차단.
 */

/** 그룹 내 모든 멤버가 서로 alias (양방향). */
const SYNONYM_GROUPS: string[][] = [
  // 육류
  ['소고기', '쇠고기', '한우', '우육', '소 고기', 'beef'],
  ['돼지고기', '돈육', '포크', '돼지 고기', '삼겹살', 'pork', 'pork belly'],
  ['닭고기', '치킨', '닭', '닭 고기', '닭살', 'chicken'],
  ['닭가슴살', '닭살', '치킨 가슴살'],
  ['소시지', '비엔나', '프랑크푸르트'],
  ['참치', '참치캔', '참치 통조림', '투나'],
  ['새우', '쉬림프', '새우살', 'shrimp', 'prawn'],
  ['게', '꽃게', '게살', 'crab'],
  ['굴', 'oyster'],
  ['고등어', 'mackerel'],
  ['연어', 'salmon'],

  // 달걀 — 노른자·흰자 통칭 (CLAUDE.md 달걀류 통합 설계)
  ['달걀', '계란', '에그', 'egg', '鷄卵', '노른자', '달걀노른자', '계란노른자', '달걀흰자', '계란흰자'],

  // 유제품
  ['우유', '밀크', '우유팩', 'milk'],
  ['버터', '무염버터', '가염버터'],
  ['요거트', '요구르트', '플레인요거트'],
  ['생크림', '휘핑크림', '크림'],
  ['모짜렐라치즈', '모짜렐라', 'mozzarella'],
  ['체다치즈', '체다', 'cheddar'],
  ['슬라이스치즈', 'american cheese'],
  ['피자치즈', '슈레드치즈'],
  ['크림치즈', 'cream cheese'],
  ['파르메산치즈', '파마산치즈', '파마산', 'parmesan'],

  // 채소
  ['파', '대파'],
  ['쪽파', '실파'],
  ['양파', '어니언'],
  // 마늘/생강의 다진·편 형태는 단방향 가공이라 INGREDIENT_PREPARABLE_TO 로 이동.
  // 여기는 *같은 통마늘의 다른 표기* 만.
  ['마늘', '통마늘'],
  ['감자', '포테이토'],
  ['고구마', '스위트포테이토'],
  ['당근', '캐럿'],
  // 호박 두 그룹 — '호박' 키가 union 처리됨 (애호박↔단호박 직접 alias X)
  ['애호박', '주키니', '호박'],
  ['호박', '단호박', '늙은호박'],
  ['가지', '에그플랜트'],
  ['시금치', '시금치나물'],
  ['배추', '절임배추'],
  ['양배추', '캐비지'],
  ['브로콜리', '브로콜리나물'],
  // 방울토마토는 다른 품종. 한·영 동의어만 유지 (2026-05-29).
  ['토마토', 'tomato'],
  ['오이', '청오이'],
  ['무', '무우'],

  // 곡류/면류
  ['밥', '쌀밥', '흰밥'],
  ['쌀', '백미'],
  ['국수', '소면', '중면'],
  ['녹말', '농마', '녹말가루'],
  ['엿기름', '길금가루'],
  ['가래떡', '흰떡'],
  // 깐호두는 알맹이 동일이라 사실상 같지만 정직성 기준에서 ALIAS 양방향 무리. 한·영만.
  ['호두', 'walnut'],
  // 견과류 한·영 (알레르기 안전은 별도 ALLERGEN_SYNONYMS — 여기는 의미 동의어)
  ['땅콩', '피넛', 'peanut'],
  ['아몬드', 'almond'],
  ['캐슈넛', 'cashew', '캐슈'],
  ['잣', 'pine nut'],
  ['오징어', 'squid', '오징어채'],
  ['조개', 'shellfish', 'clam', '바지락', '모시조개'],
  ['밀', 'wheat'],
  ['메밀', 'buckwheat', '메밀가루'],
  ['콩', '대두', '소이', 'soybean', 'soy'],
  ['복숭아', 'peach'],
  ['콩비지', '비지'],
  ['파스타', '스파게티', '페투치네', '펜네'],

  // 장/양념 — 양방향 동의어
  ['진간장', '양조간장'],
  ['국간장', '조선간장'],
  ['스팸', 'spam'],
  ['짜파게티', '짜장라면'],
  ['너구리라면', '너구리'],
  ['비빔면', '팔도비빔면'],
  ['불닭볶음면', '불닭'],
  ['올리브유', '올리브오일'],
  ['굴소스', '굴 소스', '오이스터소스'],
  ['마요네즈', '마요', '마요네이즈'],
  ['고춧가루', '고추가루', '빨간고춧가루'],
  ['후추', '후춧가루', '흑후추', '백후추'],
  ['참기름', '참깨기름'],
  ['들기름', '들깨기름'],
  // 백설탕·황설탕은 표기·등급 차이로 한국에서 사실상 호환 사용 (2026-05-29 결정)
  ['설탕', '백설탕', '황설탕'],
  ['깨', '참깨', '통깨'],
]

/**
 * 일반명 ⊃ 특정명 — 일반명은 각 특정명과 양방향, 특정명끼리는 alias 아님.
 * 정직성 정책: 같은 일반명 아래여도 특정명끼리는 *다른 재료* (간장 vs 국간장 등).
 */
const HYPONYM_GROUPS: Array<{ generic: string; specifics: string[] }> = [
  { generic: '간장', specifics: ['진간장', '국간장', '맛간장', '어간장', '양조간장'] },
  { generic: '액젓', specifics: ['멸치액젓', '까나리액젓', '참치액젓'] },
  { generic: '통조림 햄', specifics: ['스팸', '리챔', '로스팜', '앙코르햄'] },
  { generic: '라면', specifics: ['라면사리', '인스턴트라면', '신라면', '진라면', '안성탕면', '짜파게티', '너구리라면', '삼양라면', '비빔면', '불닭볶음면'] },
  { generic: '고추', specifics: ['청양고추', '풋고추', '홍고추', '꽈리고추'] },
  { generic: '버섯', specifics: ['표고버섯', '느타리버섯', '새송이버섯', '팽이버섯'] },
  { generic: '두부', specifics: ['순두부', '연두부', '부침두부'] },
  { generic: '식용유', specifics: ['카놀라유', '포도씨유', '해바라기유', '올리브유'] },
  { generic: '밀가루', specifics: ['wheat flour', '박력분', '강력분', '중력분'] },
  { generic: '소금', specifics: ['천일염', '꽃소금', '맛소금'] },
  { generic: '식초', specifics: ['현미식초', '사과식초', '감식초'] },
]

/**
 * 그룹 정의 → 양방향 인접 리스트.
 *  - SYNONYM_GROUPS: 그룹 내 모든 페어 양방향
 *  - HYPONYM_GROUPS: generic ↔ 각 specific 만 양방향
 *  - 같은 멤버가 여러 그룹에 등장하면 인접 리스트 union
 */
function buildAliasGraph(
  synonyms: string[][],
  hyponyms: Array<{ generic: string; specifics: string[] }>,
): Record<string, string[]> {
  const adj: Record<string, Set<string>> = {}
  const connect = (a: string, b: string) => {
    if (a === b) return
    if (!adj[a]) adj[a] = new Set()
    if (!adj[b]) adj[b] = new Set()
    adj[a].add(b)
    adj[b].add(a)
  }
  for (const group of synonyms) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        connect(group[i], group[j])
      }
    }
  }
  for (const { generic, specifics } of hyponyms) {
    for (const s of specifics) connect(generic, s)
  }
  return Object.fromEntries(
    Object.entries(adj).map(([k, v]) => [k, Array.from(v)]),
  )
}

// 같은 재료 — 다른 이름 / 일반명↔특정명. "보유"로 인정.
export const INGREDIENT_ALIASES: Record<string, string[]> = buildAliasGraph(
  SYNONYM_GROUPS,
  HYPONYM_GROUPS,
)

/**
 * 다른 재료지만 바꿔 쓸 수 있음 — "보유"가 아니라 "대체 가능".
 *
 * 정직성 원칙 (2026-05-29 사용자 결정):
 *   진짜 100% 같은 결과가 나오는 매핑만 인정. 풍미·식감·결과가 미묘하게라도 다르면
 *   거짓 대체로 보고 매핑 금지. 신뢰 손상 > 매칭 풍부함.
 *
 * 현재 상태: 비어 있음. 이전 30개 매핑(케첩↔토마토소스, 진간장↔국간장, 청양고추↔
 * 풋고추, 액젓끼리 등 포함)이 사용자 정직성 기준에 못 미쳐 전량 제거.
 *
 * 추가 경로:
 *   1. 작성자가 레시피에 substitutes 명시 (recipe_ingredients.substitutes) — *해당
 *      레시피만* 적용. 전역 효과 없음.
 *   2. 어드민이 ingredient_substitutes_global 테이블에 승격 — 전역 매칭에 머지.
 *      작성자 substitutes 5건+ 누적 후 trigger (현재는 0건 수준이라 미사용).
 *   3. 코드 상수에 직접 추가 — 100% 확신 시에만. 추가 시 모든 양방향 결과를
 *      "같은 풍미·식감·결과"로 인증해야 함.
 */
export const INGREDIENT_SUBSTITUTES: Record<string, string[]> = {}

/**
 * 단방향 "가공으로 준비 가능" 매핑 — raw → processed.
 *
 * `INGREDIENT_SUBSTITUTES` 는 양방향 (액젓끼리 서로 대체 가능 등). 하지만 쌀↔밥 같은
 * raw↔processed 관계는 비대칭 — 쌀로 밥 만들 수 있지만(30분), 밥으로 죽·식혜용 생쌀
 * 못 만듦. 양방향 substitute 에 넣으면 역방향 거짓 매칭 발생.
 *
 * 정책:
 *  - key 는 raw, value 는 가공된 형태들
 *  - `isSubstituteFor(userIng, recipeIng)` 가 prepA(userIng→recipeIng) 한 방향만 lookup
 *  - 역방향(processed → raw) 은 매칭 안 됨 = 정확
 *  - 추가 시 신중: 역방향이 *완전히 불가능* 하고, **알맹이가 같은 재료의 단순 형태
 *    변형**일 때만 (사용자 결정 2026-05-29). 발효·졸이기·착즙 등 풍미·텍스처가
 *    완전히 달라지는 가공은 *새 재료*로 간주해 제외.
 */
export const INGREDIENT_PREPARABLE_TO: Record<string, string[]> = {
  '쌀': ['밥', '쌀밥', '흰밥'],                        // 조리만 했지 같은 쌀 알맹이
  '마늘': ['다진마늘', '다진 마늘', '편마늘'],          // 단순 자르기. 즙은 추가 가공이라 제외
  '생강': ['다진생강', '다진 생강'],                   // 단순 자르기. 즙은 제외
}

// 보편 재료 — 수돗물처럼 누구나 항상 갖고 있는 것으로 가정.
// 매칭에서 제외해서 ready/missing 계산을 왜곡하지 않도록 처리.
export const FUNDAMENTAL_INGREDIENTS = new Set(['물', '생수', '식수', 'water'])

export function isFundamental(name: string): boolean {
  const n = name.toLowerCase().trim()
  return FUNDAMENTAL_INGREDIENTS.has(n)
}

/**
 * 두 재료가 *같은 재료*인가 — 동의어·일반명↔특정명·정규화·오타.
 * "보유 ✓" 판정에 쓴다. substring 비교는 하지 않는다(오매칭 차단).
 */
export function isSameIngredient(userIng: string, recipeIng: string): boolean {
  const a = userIng.toLowerCase().trim()
  const b = recipeIng.toLowerCase().trim()

  if (a === b) return true

  // 조리법 접두사 정규화 후 비교 (다진파→대파, 채썬양파→양파 등)
  const na = normalizeIngredientName(a)
  const nb = normalizeIngredientName(b)
  if (na === nb) return true

  // 동의어 — 양방향 정확 일치만
  const aliasA = INGREDIENT_ALIASES[a] ?? INGREDIENT_ALIASES[na]
  if (aliasA && aliasA.some(s => s === b || s === nb)) return true
  const aliasB = INGREDIENT_ALIASES[b] ?? INGREDIENT_ALIASES[nb]
  if (aliasB && aliasB.some(s => s === a || s === na)) return true

  // 레벤슈타인 유사도 — 오타·띄어쓰기 변형은 같은 재료로 간주
  if (a.length >= 2 && b.length >= 2 && levenshteinSimilarity(a, b) >= 0.7) return true

  return false
}

/**
 * userIng 으로 recipeIng 을 *대체*할 수 있는가 — 다른 재료지만 바꿔 쓸 수 있음.
 * 같은 재료(`isSameIngredient`)는 대체가 아니므로 false.
 */
export function isSubstituteFor(userIng: string, recipeIng: string): boolean {
  const a = userIng.toLowerCase().trim()
  const b = recipeIng.toLowerCase().trim()
  if (a === b) return false

  const na = normalizeIngredientName(a)
  const nb = normalizeIngredientName(b)

  // 양방향 substitute — 서로 대체 가능한 케이스 (액젓끼리, 간장끼리 등)
  const subA = INGREDIENT_SUBSTITUTES[a] ?? INGREDIENT_SUBSTITUTES[na]
  if (subA && subA.some(s => s === b || s === nb)) return true
  const subB = INGREDIENT_SUBSTITUTES[b] ?? INGREDIENT_SUBSTITUTES[nb]
  if (subB && subB.some(s => s === a || s === na)) return true

  // 단방향 raw→processed (쌀→밥 등). 역방향은 lookup 안 함 = 매칭 안 됨.
  const prepA = INGREDIENT_PREPARABLE_TO[a] ?? INGREDIENT_PREPARABLE_TO[na]
  if (prepA && prepA.some(s => s === b || s === nb)) return true

  return false
}

/**
 * `isSubstituteFor` 가 true 일 때 어느 종류 관계인지 분류.
 *  - 'substitute': 양방향 대체 (액젓끼리, 케첩↔토마토소스 등)
 *  - 'preparable': 단방향 raw→processed (쌀→밥, 우유→요거트 등) — "대체"가 아니라
 *    "userIng 으로 조리·가공해서 recipeIng 을 만들 수 있다" 관계
 *  - null: 둘 다 매칭 없음
 *
 * UI 표현 분리용: preparable 케이스는 "대체할 수 있어요" 가 아니라 "만들 수 있어요"
 * 로 라벨링해야 의미가 맞다 (사용자 직관 — 2026-05-29).
 *
 * 작성자 명시 substitutes(레시피별)는 이 함수가 아니라 호출자에서 'substitute'
 * 로 default 처리 — 작성자가 적은 건 의미상 대체 의도.
 */
export function getSubstituteKind(
  userIng: string,
  recipeIng: string,
): 'substitute' | 'preparable' | null {
  const a = userIng.toLowerCase().trim()
  const b = recipeIng.toLowerCase().trim()
  if (a === b) return null

  const na = normalizeIngredientName(a)
  const nb = normalizeIngredientName(b)

  const subA = INGREDIENT_SUBSTITUTES[a] ?? INGREDIENT_SUBSTITUTES[na]
  if (subA && subA.some(s => s === b || s === nb)) return 'substitute'
  const subB = INGREDIENT_SUBSTITUTES[b] ?? INGREDIENT_SUBSTITUTES[nb]
  if (subB && subB.some(s => s === a || s === na)) return 'substitute'

  const prepA = INGREDIENT_PREPARABLE_TO[a] ?? INGREDIENT_PREPARABLE_TO[na]
  if (prepA && prepA.some(s => s === b || s === nb)) return 'preparable'

  return null
}

/**
 * 같거나(동의어) 대체 가능한가 — 추천 "이 레시피 만들 수 있나" 판정용.
 * "보유" 판정에는 쓰지 말 것 — 그건 `isSameIngredient`.
 */
export function isIngredientMatch(userIng: string, recipeIng: string): boolean {
  return isSameIngredient(userIng, recipeIng) || isSubstituteFor(userIng, recipeIng)
}

// 추천 mode 분류 술어 — recipesWithMatch 항목에 대해 평가.
export const isReady = (r: { matchedCount: number; totalIngredients: number }) =>
  r.totalIngredients > 0 && r.matchedCount === r.totalIngredients
// '거의 가능' = 재료 1~3개만 더 있으면 만들 수 있는 레시피.
// "재료 N개만 더 있으면"은 레시피 크기와 무관하게 항상 정확한 표현이라
// (3재료 레시피에서 2개 부족 = 33%여도 "2개만 더 사면 됨"은 사실),
// 예전 matchRate ≥ 70% 게이트가 불필요해짐 — 부족 개수만으로 판정한다.
// 2026-05-21 사용자 결정: % 기준 → 부족 개수 기준(1~3개)으로 전환.
// 4개↑ 부족은 "거의"가 아니라 "재료가 더 필요한 레시피"(isAny) 영역.
export const ALMOST_MAX_MISSING = 3
export const isAlmost = (r: { missingCount: number }) =>
  r.missingCount >= 1 && r.missingCount <= ALMOST_MAX_MISSING
export const isAny = (r: { matchRate: number }) => r.matchRate > 0

export interface RecipeMatchResult {
  matchRate: number
  missingCount: number
  matchedCount: number
  totalIngredients: number
  ownedIngredientNames: string[]
  substitutableIngredients: { ingredient: string; via: string }[]
  missingIngredientNames: string[]
}

/**
 * 한 레시피의 재료를 사용자 보유 재료와 대조 — 보유 / 대체 가능 / 없음 분류.
 * 추천·전체·검색 페이지가 같은 카운트를 내도록 하는 단일 출처(추천 라우트에서 추출).
 * - userIngredientNames: 사용자 보유 재료명 (소문자)
 * - userIngredientIdSet: 사용자 보유 재료의 ingredient_id FK 집합
 * - recipeIngredients: 레시피 재료 (이름 + 선택적 FK + is_optional + recipe-specific substitutes)
 *
 * is_optional=true 재료는 매칭에서 완전 제외 — 보유 여부와 무관하게 total/missing/matched에
 * 들어가지 않는다 ("없어도 OK" = 부족하지 않음 = 매칭에 영향 없음).
 *
 * recipe-specific substitutes — 작성자가 그 레시피에 한해 명시한 대체재. 전역
 * INGREDIENT_SUBSTITUTES와 동등하게 인정한다 (둘 중 하나로 매칭되면 substitutable).
 */
export function computeRecipeMatch(
  userIngredientNames: string[],
  userIngredientIdSet: Set<string>,
  recipeIngredients: {
    ingredient_name: string;
    ingredient_id?: string | null;
    is_optional?: boolean;
    // legacy string[] 또는 신규 { name; note? }[] — 매칭은 name 만 본다(note 무시).
    substitutes?: (string | { name?: string; note?: string })[] | null;
  }[],
  // 어드민 승격된 동적 매핑(ingredient_substitutes_global) — server-side에서만 사용.
  // 키·값 모두 소문자, 양방향 조회. 코드 상수 INGREDIENT_SUBSTITUTES와 동등 우선순위.
  extraGlobalSubstitutes?: Map<string, Set<string>>,
): RecipeMatchResult {
  // 보편 재료(물 등) + is_optional 재료는 매칭에서 제외 — 부족 카운트 왜곡 방지.
  const nonFundamental = recipeIngredients.filter(ri =>
    !isFundamental(ri.ingredient_name) && !ri.is_optional
  )
  // 같은 이름 재료 중복 제거 — 한 레시피가 "후추"를 2줄로 적으면 total·missing 부풀려짐.
  const seen = new Set<string>()
  const list = nonFundamental.filter(ri => {
    const k = ri.ingredient_name.toLowerCase().trim()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  // 보유 — FK 또는 같은 재료(동의어).
  const isOwnedRI = (ri: { ingredient_name: string; ingredient_id?: string | null }) =>
    (!!ri.ingredient_id && userIngredientIdSet.has(ri.ingredient_id)) ||
    userIngredientNames.some(ui => isSameIngredient(ui, ri.ingredient_name.toLowerCase()))

  const ownedIngredientNames: string[] = []
  const substitutableIngredients: { ingredient: string; via: string }[] = []
  const missingIngredientNames: string[] = []
  for (const ri of list) {
    if (isOwnedRI(ri)) {
      ownedIngredientNames.push(ri.ingredient_name)
      continue
    }
    // 보유는 아니지만 대체 가능 — 어떤 user 재료로 바꿔 쓸지 기록.
    // ① 전역 INGREDIENT_SUBSTITUTES
    let via = userIngredientNames.find(ui => isSubstituteFor(ui, ri.ingredient_name.toLowerCase()))
    // ② recipe-specific substitutes (작성자가 직접 명시) — legacy string[] / 신규 {name,note}[] 양형식 지원.
    if (!via && Array.isArray(ri.substitutes) && ri.substitutes.length > 0) {
      const subsLC = ri.substitutes
        .map(s => (typeof s === 'string' ? s : (s?.name ?? '')).toLowerCase().trim())
        .filter(Boolean)
      via = userIngredientNames.find(ui => {
        const u = ui.toLowerCase().trim()
        return subsLC.some(s => s === u || isSameIngredient(u, s))
      })
    }
    // ③ admin-promoted dynamic substitutes (ingredient_substitutes_global)
    if (!via && extraGlobalSubstitutes && extraGlobalSubstitutes.size > 0) {
      const recipeKey = ri.ingredient_name.toLowerCase().trim()
      const subs = extraGlobalSubstitutes.get(recipeKey)
      if (subs && subs.size > 0) {
        via = userIngredientNames.find(ui => subs.has(ui.toLowerCase().trim()))
      }
    }
    if (via) substitutableIngredients.push({ ingredient: ri.ingredient_name, via })
    else missingIngredientNames.push(ri.ingredient_name)
  }

  const totalIngredients = list.length
  // 만들 수 있는 재료 = 보유 + 대체 가능. 부족 = 둘 다 아닌 것.
  const matchedCount = ownedIngredientNames.length + substitutableIngredients.length
  const missingCount = missingIngredientNames.length
  const matchRate = totalIngredients > 0 ? Math.round((matchedCount / totalIngredients) * 100) : 0

  return {
    matchRate,
    missingCount,
    matchedCount,
    totalIngredients,
    ownedIngredientNames,
    substitutableIngredients,
    missingIngredientNames,
  }
}
