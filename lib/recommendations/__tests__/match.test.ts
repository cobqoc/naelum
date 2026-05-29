import { describe, it, expect } from 'vitest'
import {
  isIngredientMatch,
  isSameIngredient,
  isSubstituteFor,
  isFundamental,
  isReady,
  isAlmost,
  isAny,
  computeRecipeMatch,
  INGREDIENT_ALIASES,
} from '@/lib/recommendations/match'

// route.ts(god-file)에서 추출한 순수 매칭 로직의 회귀 가드.
// 2026-05-17 fix: prefix 부분일치 제거(A) + isAlmost 상대기준(B).
// 실제 사용자 제보(보유=설탕/고추장/간장)로 드러난 3개 오분류를 결정적으로 차단.

describe('isIngredientMatch — 동의어 양방향 (2026-05-19)', () => {
  it('달걀 ↔ 계란 양방향', () => {
    expect(isIngredientMatch('달걀', '계란')).toBe(true)
    expect(isIngredientMatch('계란', '달걀')).toBe(true)
  })

  it('달걀노른자 ↔ 계란노른자 양방향', () => {
    expect(isIngredientMatch('달걀노른자', '계란노른자')).toBe(true)
    expect(isIngredientMatch('계란노른자', '달걀노른자')).toBe(true)
  })

  it('달걀흰자 ↔ 계란흰자 양방향', () => {
    expect(isIngredientMatch('달걀흰자', '계란흰자')).toBe(true)
    expect(isIngredientMatch('계란흰자', '달걀흰자')).toBe(true)
  })

  it('참깨 → 깨 (역방향, 이전엔 미스매칭)', () => {
    expect(isIngredientMatch('참깨', '깨')).toBe(true)
    expect(isIngredientMatch('깨', '참깨')).toBe(true)
  })
})

describe('isIngredientMatch — exact / synonym', () => {
  it('정확 일치', () => {
    expect(isIngredientMatch('간장', '간장')).toBe(true)
  })

  it('정당한 부분일치는 동의어 테이블이 커버 (prefix 규칙 없이도)', () => {
    expect(isIngredientMatch('다진마늘', '마늘')).toBe(true) // 정규화: 다진마늘→마늘
    expect(isIngredientMatch('대파', '파')).toBe(true) // 정규화: 파→대파
    expect(isIngredientMatch('닭고기', '닭')).toBe(true) // synonym 목록에 '닭'
    expect(isIngredientMatch('설탕', '백설탕')).toBe(true) // ALIAS 동의어 — 정직 매칭
  })
})

describe('isIngredientMatch — 정규화 기반 매칭 (2026-05-18)', () => {
  it('다진X ↔ X 양방향', () => {
    expect(isIngredientMatch('다진마늘', '마늘')).toBe(true)
    expect(isIngredientMatch('마늘', '다진마늘')).toBe(true)
    expect(isIngredientMatch('다진생강', '생강')).toBe(true)
  })

  it('다진파 ↔ 대파 (접두사 제거 + 별칭)', () => {
    expect(isIngredientMatch('다진파', '대파')).toBe(true)
    expect(isIngredientMatch('대파', '다진파')).toBe(true)
  })

  it('채썬/볶은/삶은 등 조리법 접두사', () => {
    expect(isIngredientMatch('채썬양파', '양파')).toBe(true)
    expect(isIngredientMatch('볶은 당근', '당근')).toBe(true)
    expect(isIngredientMatch('삶은계란', '계란')).toBe(true)
  })

  it('오매칭 방지: 정규화 후에도 다른 재료는 여전히 불일치', () => {
    expect(isIngredientMatch('간장', '고추장')).toBe(false)
    expect(isIngredientMatch('쪽파', '대파')).toBe(false) // 쪽파 ≠ 대파 (동의어 테이블 수정)
  })
})

describe('isIngredientMatch — prefix 오매칭 제거(A)', () => {
  it('고추장 ≠ 고추 — 장류 vs 생고추 (사용자 제보 핵심 버그)', () => {
    expect(isIngredientMatch('고추장', '고추')).toBe(false)
  })

  it('같은 패턴의 광범위 오매칭도 함께 제거', () => {
    expect(isIngredientMatch('간장', '간장게장')).toBe(false)
    expect(isIngredientMatch('김', '김치')).toBe(false)
    expect(isIngredientMatch('사과', '사과식초')).toBe(false)
  })

  it('애초에 무관한 재료는 여전히 매칭 안 됨', () => {
    expect(isIngredientMatch('우무묵', '설탕')).toBe(false)
    expect(isIngredientMatch('단감', '고추장')).toBe(false)
  })
})

describe('isFundamental', () => {
  it('물 계열은 보편 재료', () => {
    expect(isFundamental('물')).toBe(true)
    expect(isFundamental('생수')).toBe(true)
    expect(isFundamental('water')).toBe(true)
    expect(isFundamental(' 물 ')).toBe(true)
  })
  it('양념은 보편 재료 아님 (C 미적용)', () => {
    expect(isFundamental('설탕')).toBe(false)
    expect(isFundamental('간장')).toBe(false)
    expect(isFundamental('고추장')).toBe(false)
  })
})

describe('mode 술어', () => {
  it('isReady: 전부 보유해야 ready', () => {
    expect(isReady({ matchedCount: 3, totalIngredients: 3 })).toBe(true)
    expect(isReady({ matchedCount: 2, totalIngredients: 3 })).toBe(false)
    expect(isReady({ matchedCount: 0, totalIngredients: 0 })).toBe(false)
  })

  it('isAlmost: 부족 1~3개 — 재료 N개만 더 있으면 (% 게이트 없음, 2026-05-21)', () => {
    // 재료 1~3개만 더 있으면 만들 수 있음 — matchRate 와 무관
    expect(isAlmost({ missingCount: 1 })).toBe(true)
    expect(isAlmost({ missingCount: 2 })).toBe(true)
    expect(isAlmost({ missingCount: 3 })).toBe(true) // 경계

    // 부족 0 → ready 영역 / 부족 4개↑ → "재료가 더 필요한 레시피" 영역
    expect(isAlmost({ missingCount: 0 })).toBe(false)
    expect(isAlmost({ missingCount: 4 })).toBe(false)
  })

  it('isAny: matchRate > 0', () => {
    expect(isAny({ matchRate: 1 })).toBe(true)
    expect(isAny({ matchRate: 0 })).toBe(false)
  })
})

// 동의어/대체재 분리 (2026-05-22) — "보유"는 동의어만, 대체재는 "대체 가능".
// 사용자 제보: 냉장고에 까나리액젓이 있다고 멸치액젓을 "보유"라 하면 안 됨.
describe('isSameIngredient — 보유 판정 (동의어만)', () => {
  it('같은 재료(동의어)는 같음', () => {
    expect(isSameIngredient('달걀', '계란')).toBe(true)
    expect(isSameIngredient('소고기', '쇠고기')).toBe(true)
    expect(isSameIngredient('진간장', '간장')).toBe(true) // 특정명 ⊂ 일반명
    expect(isSameIngredient('스팸', '통조림 햄')).toBe(true)
    expect(isSameIngredient('다진마늘', '마늘')).toBe(true) // 정규화
  })

  it('다른 재료는 같은 재료가 아님 — 보유로 인정 안 함 (핵심)', () => {
    expect(isSameIngredient('까나리액젓', '멸치액젓')).toBe(false)
    expect(isSameIngredient('멸치액젓', '까나리액젓')).toBe(false)
    expect(isSameIngredient('진간장', '국간장')).toBe(false)
    expect(isSameIngredient('버터', '마가린')).toBe(false)
    expect(isSameIngredient('설탕', '올리고당')).toBe(false)
  })

  it('일반명 ↔ 특정명은 보유 — 액젓(일반)과 까나리액젓', () => {
    expect(isSameIngredient('까나리액젓', '액젓')).toBe(true)
    expect(isSameIngredient('액젓', '멸치액젓')).toBe(true)
  })
})

describe('isSubstituteFor — 대체 가능 판정', () => {
  // 정직성 정책 (2026-05-29): SUBSTITUTES 비움. 양방향 대체는 전역에 없고 오로지
  // recipe-specific(작성자 명시) 또는 ingredient_substitutes_global(어드민 승격)에서만.
  it('SUBSTITUTES 비어 있음 — 전역 양방향 대체 매핑 없음 (정직성 정책)', () => {
    expect(isSubstituteFor('까나리액젓', '멸치액젓')).toBe(false)
    expect(isSubstituteFor('멸치액젓', '까나리액젓')).toBe(false)
    expect(isSubstituteFor('버터', '마가린')).toBe(false)
    expect(isSubstituteFor('진간장', '국간장')).toBe(false)
    expect(isSubstituteFor('파프리카', '피망')).toBe(false)
  })

  it('같은 재료는 대체가 아님', () => {
    expect(isSubstituteFor('달걀', '계란')).toBe(false)
    expect(isSubstituteFor('소고기', '소고기')).toBe(false)
  })

  it('무관한 재료는 대체 아님', () => {
    expect(isSubstituteFor('간장', '고추장')).toBe(false)
    expect(isSubstituteFor('쪽파', '대파')).toBe(false)
  })

  // PREPARABLE_TO 단방향 — raw → processed.
  // 정직성 기준 (2026-05-29): "알맹이가 같은 재료의 단순 형태 변형"만 인정.
  // 발효·졸이기·착즙 등 풍미·텍스처 크게 변하면 *새 재료*로 보고 제외.
  describe('가공 단방향 — 쌀→밥, 마늘→다진마늘, 생강→다진생강', () => {
    it('쌀 → 밥류 (역방향 X)', () => {
      expect(isSubstituteFor('쌀', '밥')).toBe(true)
      expect(isSubstituteFor('쌀', '쌀밥')).toBe(true)
      expect(isSubstituteFor('쌀', '흰밥')).toBe(true)
      // 역방향: 밥으로는 죽/식혜용 생쌀 못 만듦
      expect(isSubstituteFor('밥', '쌀')).toBe(false)
      expect(isSubstituteFor('쌀밥', '쌀')).toBe(false)
    })

    it('마늘 → 다진마늘/편마늘 (즙 제외, 역방향 X)', () => {
      expect(isSubstituteFor('마늘', '다진마늘')).toBe(true)
      expect(isSubstituteFor('마늘', '편마늘')).toBe(true)
      // 즙은 추가 가공이라 제외
      expect(isSubstituteFor('마늘', '마늘즙')).toBe(false)
    })

    // 2026-05-29: 가공형 입력의 거짓 PREPARABLE 매칭 차단 회귀 가드.
    // 사용자 "다진마늘" 보유 시 정규화가 "마늘" 만들어 PREPARABLE_TO["마늘"] 의
    // value '편마늘' 매칭하던 버그. 이제 사용자 입력은 raw form 만 키로 인정.
    it('가공형 입력은 PREPARABLE 거짓 매칭 안 함 (다진마늘 → 편마늘 등)', () => {
      // 다진마늘 보유자가 통마늘·편마늘 만들 수 없음 (가공형 → 원형 불가)
      expect(isSubstituteFor('다진마늘', '편마늘')).toBe(false)
      expect(isSubstituteFor('다진마늘', '마늘')).toBe(false)
      expect(isSubstituteFor('다진 마늘', '편마늘')).toBe(false)
      // 다진생강도 마찬가지
      expect(isSubstituteFor('다진생강', '생강')).toBe(false)
      // 조리법 접두사 입력도 동일 — "굵게 다진 마늘" 보유 → 편마늘 X
      expect(isSubstituteFor('굵게 다진 마늘', '편마늘')).toBe(false)
      // 원형(통마늘=마늘) 보유는 그대로 가공 가능
      expect(isSubstituteFor('마늘', '다진마늘')).toBe(true)
      expect(isSubstituteFor('마늘', '편마늘')).toBe(true)
    })

    it('생강 → 다진생강 (즙 제외, 역방향 X)', () => {
      expect(isSubstituteFor('생강', '다진생강')).toBe(true)
      expect(isSubstituteFor('생강', '생강즙')).toBe(false)
    })

    it('제거된 가공 매핑 — 우유→요거트·토마토→소스·사과/오렌지→주스 (새 재료라 false)', () => {
      // 발효(우유→요거트)·졸이기(토마토→소스)·착즙(사과→주스)은 풍미·텍스처
      // 완전히 달라져 *새 재료*로 분류. 2026-05-29 정직성 기준 적용.
      expect(isSubstituteFor('우유', '요거트')).toBe(false)
      expect(isSubstituteFor('토마토', '토마토소스')).toBe(false)
      expect(isSubstituteFor('사과', '사과주스')).toBe(false)
      expect(isSubstituteFor('오렌지', '오렌지주스')).toBe(false)
    })

    it('isIngredientMatch — 단방향 PREPARABLE 도 매칭 (추천에 뜸)', () => {
      expect(isIngredientMatch('쌀', '밥')).toBe(true)
      expect(isIngredientMatch('마늘', '편마늘')).toBe(true)
      // 역방향은 매칭 안 됨 — 밥 보유자가 쌀 필요한 죽 레시피에 잘못 들어가지 않음
      expect(isIngredientMatch('밥', '쌀')).toBe(false)
    })

    it('isSameIngredient — 가공 관계는 *같은 재료 아님* (쌀↔밥 분리 검증)', () => {
      // 같은 재료가 아닌 substitute 라야 보유 ✓ 가 아닌 🍳 가공 라벨로 표시됨.
      // 마늘↔다진마늘 케이스는 normalizeIngredientName 이 "다진" 접두사 제거해
      // 정규화 후 같은 재료로 처리됨 (정규화 책임 — 매핑 책임 X). 쌀↔밥만 검증.
      expect(isSameIngredient('쌀', '밥')).toBe(false)
    })
  })
})

describe('isIngredientMatch — 동의어 OR 가공 (만들 수 있나)', () => {
  it('PREPARABLE 매칭 — 쌀 보유 → 밥 필요 레시피 추천에 뜸', () => {
    expect(isIngredientMatch('쌀', '밥')).toBe(true)
    expect(isIngredientMatch('마늘', '다진마늘')).toBe(true)
  })

  it('SUBSTITUTES 비움 — 액젓끼리·풍미 다른 양념 등은 더이상 매칭 안 됨 (정직성)', () => {
    expect(isIngredientMatch('까나리액젓', '멸치액젓')).toBe(false)
    expect(isIngredientMatch('설탕', '올리고당')).toBe(false)
  })
})

// 추천 라우트에서 추출한 per-recipe 대조 — 추천·전체·검색 단일 출처 (2026-05-22).
describe('computeRecipeMatch — 레시피↔냉장고 대조', () => {
  const noIds = new Set<string>()
  const ri = (name: string, id?: string) => ({ ingredient_name: name, ingredient_id: id ?? null })

  it('모두 보유 — missing 0, matchRate 100', () => {
    const r = computeRecipeMatch(['양파', '마늘', '당근'], noIds, [ri('양파'), ri('마늘'), ri('당근')])
    expect(r.ownedIngredientNames).toHaveLength(3)
    expect(r.missingCount).toBe(0)
    expect(r.totalIngredients).toBe(3)
    expect(r.matchRate).toBe(100)
  })

  it('일부 부족 — missing 정확', () => {
    const r = computeRecipeMatch(['양파'], noIds, [ri('양파'), ri('소고기'), ri('당근')])
    expect(r.ownedIngredientNames).toEqual(['양파'])
    expect(r.missingCount).toBe(2)
    expect(r.missingIngredientNames).toEqual(expect.arrayContaining(['소고기', '당근']))
  })

  it('PREPARABLE 매칭 — 쌀 보유 + 밥 필요 = substitutable (보유 아니지만 missing 도 아님)', () => {
    // SUBSTITUTES 비웠으니 까나리액젓↔멸치액젓 같은 매핑 더이상 없음.
    // PREPARABLE 한 방향만 — 쌀로 밥 만들 수 있음.
    const r = computeRecipeMatch(['쌀'], noIds, [ri('밥')])
    expect(r.ownedIngredientNames).toHaveLength(0)
    expect(r.substitutableIngredients).toEqual([{ ingredient: '밥', via: '쌀' }])
    expect(r.missingCount).toBe(0)
    expect(r.matchedCount).toBe(1)
  })

  it('SUBSTITUTES 비움 — 액젓끼리는 더이상 substitutable 아님 (정직성 정책)', () => {
    const r = computeRecipeMatch(['까나리액젓'], noIds, [ri('멸치액젓')])
    expect(r.substitutableIngredients).toEqual([])
    expect(r.missingCount).toBe(1)
    expect(r.matchedCount).toBe(0)
  })

  it('물(보편 재료)은 total 에서 제외', () => {
    const r = computeRecipeMatch([], noIds, [ri('양파'), ri('물')])
    expect(r.totalIngredients).toBe(1)
    expect(r.missingIngredientNames).toEqual(['양파'])
  })

  it('같은 이름 재료 중복 제거 — total 부풀림 방지', () => {
    const r = computeRecipeMatch([], noIds, [ri('후추'), ri('후추'), ri('소금')])
    expect(r.totalIngredients).toBe(2)
  })

  it('FK(ingredient_id) 매칭 — 이름이 달라도 보유', () => {
    const r = computeRecipeMatch([], new Set(['uuid-1']), [ri('엄마표 특제양념', 'uuid-1'), ri('소금')])
    expect(r.ownedIngredientNames).toEqual(['엄마표 특제양념'])
    expect(r.missingIngredientNames).toEqual(['소금'])
  })

  it('빈 냉장고 — 전부 missing', () => {
    const r = computeRecipeMatch([], noIds, [ri('양파'), ri('마늘')])
    expect(r.missingCount).toBe(2)
    expect(r.matchedCount).toBe(0)
    expect(r.matchRate).toBe(0)
  })

  it('재료 없는 레시피 — total 0, matchRate 0', () => {
    const r = computeRecipeMatch(['양파'], noIds, [])
    expect(r.totalIngredients).toBe(0)
    expect(r.matchRate).toBe(0)
    expect(r.missingCount).toBe(0)
  })
})

// is_optional 처리·recipe-specific substitutes·admin-promoted dynamic substitutes (2026-05-23)
describe('computeRecipeMatch — is_optional·substitutes·extraGlobalSubstitutes', () => {
  const noIds = new Set<string>()
  const ri = (name: string, opts?: { id?: string; is_optional?: boolean; substitutes?: string[] }) => ({
    ingredient_name: name,
    ingredient_id: opts?.id ?? null,
    is_optional: opts?.is_optional ?? false,
    substitutes: opts?.substitutes ?? null,
  })

  it('is_optional=true 재료는 total/missing/matched에서 모두 제외', () => {
    const r = computeRecipeMatch(['양파', '마늘'], noIds, [
      ri('양파'),
      ri('마늘'),
      ri('청양고추', { is_optional: true }),
    ])
    expect(r.totalIngredients).toBe(2) // 청양고추 제외
    expect(r.missingCount).toBe(0) // 청양고추는 부족 아님
    expect(r.matchRate).toBe(100)
    expect(r.ownedIngredientNames).toEqual(['양파', '마늘'])
  })

  it('is_optional 재료를 안 가져도 ready 판정', () => {
    const r = computeRecipeMatch(['양파', '마늘'], noIds, [
      ri('양파'),
      ri('마늘'),
      ri('파슬리', { is_optional: true }),
    ])
    expect(isReady(r)).toBe(true)
  })

  it('recipe-specific substitutes — 작성자 명시 대체재 인정', () => {
    // 사용자는 페페론치노 보유. 레시피 재료 청양고추, 작성자가 substitutes=[페페론치노] 명시
    const r = computeRecipeMatch(['페페론치노'], noIds, [
      ri('청양고추', { substitutes: ['페페론치노', '풋고추'] }),
    ])
    expect(r.ownedIngredientNames).toHaveLength(0)
    expect(r.substitutableIngredients).toEqual([{ ingredient: '청양고추', via: '페페론치노' }])
    expect(r.missingCount).toBe(0)
    expect(r.matchedCount).toBe(1)
  })

  it('recipe-specific substitutes — 전역 매핑 없는 새 쌍도 인정', () => {
    // 전역에 없는 매핑: 뉴 칠리(가상) → 청양고추. 작성자가 직접 적은 것
    const r = computeRecipeMatch(['뉴칠리'], noIds, [
      ri('청양고추', { substitutes: ['뉴칠리'] }),
    ])
    expect(r.substitutableIngredients).toEqual([{ ingredient: '청양고추', via: '뉴칠리' }])
  })

  it('recipe-specific substitutes — 빈 배열·null은 영향 없음', () => {
    const r1 = computeRecipeMatch([], noIds, [ri('양파', { substitutes: [] })])
    expect(r1.missingCount).toBe(1)
    const r2 = computeRecipeMatch([], noIds, [ri('양파', { substitutes: null as unknown as string[] })])
    expect(r2.missingCount).toBe(1)
  })

  it('extraGlobalSubstitutes — admin-promoted 매핑 양방향 인정', () => {
    // 어드민이 "콜리플라워 ↔ 브로콜리" 매핑 승격. row는 단방향이지만 호출처가 양방향 풀어줌.
    const extras = new Map<string, Set<string>>([
      ['콜리플라워', new Set(['브로콜리'])],
      ['브로콜리', new Set(['콜리플라워'])],
    ])
    // 사용자 콜리플라워 보유 → 레시피의 브로콜리 대체 가능
    const r = computeRecipeMatch(['콜리플라워'], noIds, [ri('브로콜리')], extras)
    expect(r.substitutableIngredients).toEqual([{ ingredient: '브로콜리', via: '콜리플라워' }])
    expect(r.missingCount).toBe(0)
  })

  it('PREPARABLE 우선 — 전역 단방향 가공 매핑 (쌀→밥) 이 extras 없이도 풀림', () => {
    const extras = new Map<string, Set<string>>()
    const r = computeRecipeMatch(['쌀'], noIds, [ri('밥')], extras)
    expect(r.substitutableIngredients).toEqual([{ ingredient: '밥', via: '쌀' }])
  })

  it('우선순위: 전역(ALIASES+PREPARABLE) → recipe-specific → extras', () => {
    // SUBSTITUTES 비움 (2026-05-29). 양방향 대체는 recipe-specific/extras 에서만.
    // 사용자가 까나리액젓 보유, 레시피 멸치액젓 + recipe-specific 에 ['까나리액젓'] 명시
    // → recipe-specific 으로 풀림 (전역엔 매핑 없음).
    const r = computeRecipeMatch(['까나리액젓'], noIds, [
      ri('멸치액젓', { substitutes: ['까나리액젓'] }),
    ])
    expect(r.substitutableIngredients).toEqual([{ ingredient: '멸치액젓', via: '까나리액젓' }])
  })
})

// 2026-05-29: ALIAS 그룹 모델 도입 — SYNONYM_GROUPS·HYPONYM_GROUPS 정의 →
// buildAliasGraph 가 양방향 인접 리스트 자동 생성. 사람이 한 방향만 적은 누락
// 버그 차단 + 데이터 단순화 (그룹 1번 정의로 양쪽 자동).
describe('ALIAS 그룹 빌드 — 양방향 자동 보장', () => {
  it('SYNONYM 그룹 — 모든 페어 양방향 (달걀↔계란↔egg)', () => {
    expect(INGREDIENT_ALIASES['달걀']).toContain('계란')
    expect(INGREDIENT_ALIASES['계란']).toContain('달걀')
    expect(INGREDIENT_ALIASES['달걀']).toContain('egg')
    expect(INGREDIENT_ALIASES['egg']).toContain('달걀')
    expect(INGREDIENT_ALIASES['계란']).toContain('egg')
    expect(INGREDIENT_ALIASES['egg']).toContain('계란')
  })

  it('SYNONYM 새 멤버 (황설탕) — 다른 모든 그룹 멤버와 양방향', () => {
    expect(INGREDIENT_ALIASES['설탕']).toContain('황설탕')
    expect(INGREDIENT_ALIASES['황설탕']).toContain('설탕')
    expect(INGREDIENT_ALIASES['백설탕']).toContain('황설탕')
    expect(INGREDIENT_ALIASES['황설탕']).toContain('백설탕')
  })

  it('HYPONYM 그룹 — 일반명↔특정명 양방향, 특정명끼리는 alias 아님', () => {
    // 간장 ⊃ 진간장/국간장: 일반명 통한 매칭
    expect(INGREDIENT_ALIASES['간장']).toContain('진간장')
    expect(INGREDIENT_ALIASES['진간장']).toContain('간장')
    expect(INGREDIENT_ALIASES['간장']).toContain('국간장')
    expect(INGREDIENT_ALIASES['국간장']).toContain('간장')
    // 특정명끼리는 직접 연결 없음 — 진간장↔국간장 false 정직성 정책
    expect(INGREDIENT_ALIASES['진간장']).not.toContain('국간장')
    expect(INGREDIENT_ALIASES['국간장']).not.toContain('진간장')
    // 액젓도 동일
    expect(INGREDIENT_ALIASES['멸치액젓']).not.toContain('까나리액젓')
    expect(INGREDIENT_ALIASES['까나리액젓']).not.toContain('멸치액젓')
  })

  it('같은 멤버 여러 그룹 — union 처리 (호박 = 애호박/주키니/단호박/늙은호박)', () => {
    // 호박은 두 그룹 [애호박,주키니,호박]·[호박,단호박,늙은호박] 멤버
    expect(INGREDIENT_ALIASES['호박']).toEqual(
      expect.arrayContaining(['애호박', '주키니', '단호박', '늙은호박'])
    )
    // 다른 그룹 멤버끼리 (애호박↔단호박)는 직접 alias X
    expect(INGREDIENT_ALIASES['애호박']).not.toContain('단호박')
    expect(INGREDIENT_ALIASES['단호박']).not.toContain('애호박')
  })

  it('데이터 무결성 — 그래프가 양방향 (자가 검증)', () => {
    for (const [key, values] of Object.entries(INGREDIENT_ALIASES)) {
      for (const value of values) {
        const reverse = INGREDIENT_ALIASES[value]
        expect(reverse, `${value} should have reverse alias to ${key}`).toBeDefined()
        expect(reverse).toContain(key)
      }
    }
  })
})
