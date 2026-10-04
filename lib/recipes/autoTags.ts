import { CUISINE_TYPE_TAGS, DISH_TYPE_TAGS, DIETARY_TAGS } from '@/lib/constants/recipe';

/**
 * 레시피 작성 폼 자동태그 — 순수 로직 (god-file NewRecipePage 에서 분리).
 *
 * CLAUDE.md 규칙1("순수 함수는 lib/ + vitest 로 분리 — 테스트 가능·표현과
 * 분리"). page.tsx 의 useEffect 안에 인라인이던 detectKoreanAndTranslate
 * + autoTags 계산을 byte-identical 로 추출. setTags 병합(prevTags 의존,
 * 비순수)은 effect 에 잔류 — 여기는 입력→autoTags 배열 순수 계산만.
 * 행위 변경 0. 회귀: lib/recipes/__tests__/autoTags.test.ts + 통합은
 * e2e/recipe-creation.spec.ts "UI 회귀(식단옵션)"·"(Section1)".
 */

// 한국어 감지 및 영어 변환 유틸리티 함수
export const detectKoreanAndTranslate = (text: string): { korean: string; english: string } => {
  const trimmed = text.trim();
  const hasKorean = /[가-힣]/.test(trimmed);

  if (!hasKorean) {
    // 영어만 있으면 그대로 반환
    return { korean: trimmed, english: trimmed };
  }

  // 한국어가 있으면 로마자화
  // 간단한 변환: 공백 제거 후 첫 글자 대문자
  const romanized = trimmed
    .replace(/\s+/g, '') // 공백 제거
    .split('')
    .map((char, idx) => idx === 0 ? char.toUpperCase() : char)
    .join('');

  return { korean: trimmed, english: romanized };
};

export interface AutoTagInput {
  cuisineType: string;
  customCuisineType: string;
  dishType: string;
  customDishType: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
}

/**
 * 입력 상태로부터 자동태그 배열을 계산(순수). page.tsx useEffect 의
 * autoTags 구성부와 byte-identical — 호출 측에서 prevTags 병합/10개 제한.
 */
export function computeAutoTags(input: AutoTagInput): string[] {
  const {
    cuisineType, customCuisineType, dishType, customDishType,
    isVegetarian, isVegan, isGlutenFree,
  } = input;

  const autoTags: string[] = [];

  // 1. 요리 종류 태그 (한국어 + 영어)
  if (cuisineType && cuisineType !== 'other' && CUISINE_TYPE_TAGS[cuisineType]) {
    autoTags.push(...CUISINE_TYPE_TAGS[cuisineType]);
  }

  // 1-1. 커스텀 요리 종류 태그 (한국어 + 영어 변환)
  if (cuisineType === 'other' && customCuisineType.trim()) {
    const { korean, english } = detectKoreanAndTranslate(customCuisineType);
    autoTags.push(korean);
    if (korean !== english) {
      autoTags.push(english);
    }
  }

  // 2. 요리 유형 태그 (선택된 경우만)
  if (dishType && dishType !== 'other' && DISH_TYPE_TAGS[dishType]) {
    autoTags.push(...DISH_TYPE_TAGS[dishType]);
  }

  // 2-1. 커스텀 요리 유형 태그 (한국어 + 영어 변환)
  if (dishType === 'other' && customDishType.trim()) {
    const { korean, english } = detectKoreanAndTranslate(customDishType);
    autoTags.push(korean);
    if (korean !== english) {
      autoTags.push(english);
    }
  }

  // 3. 식단 옵션 태그
  if (isVegetarian) {
    autoTags.push(...DIETARY_TAGS.vegetarian);
  }
  if (isVegan) {
    autoTags.push(...DIETARY_TAGS.vegan);
  }
  if (isGlutenFree) {
    autoTags.push(...DIETARY_TAGS.glutenFree);
  }

  return autoTags;
}

/**
 * 자동태그를 현재 태그 목록에 병합(순수) — recipes/new 의 자동태그 effect 가 setTags(prev => …) 안에서 사용.
 *
 * 2026-10-04 [PHR-43] 옛 병합은 "새 자동태그 추가"만 해서, 커스텀 요리종류를 한글 IME 로 입력하면 조합 단계마다
 * `#ㅍ #퓨 #퓨ㅈ #퓨저 #퓨전` 이 쌓이고, 한식→일식 변경·채식 해제 후에도 옛 자동태그가 남아 저장됐다.
 *  - prevAuto(직전 실행의 자동태그) 중 nextAuto 에 없는 태그만 제거 — 사용자가 직접 입력한 태그(prevAuto 에 없던 것)는 보존
 *  - nextAuto 중 아직 없는 태그를 뒤에 추가, 상한 max(10)개 — 옛 동작과 동일(빈 슬롯만큼만 추가)
 *  - 바뀐 게 없으면 prevTags 참조 그대로 반환(불필요 재렌더 없음)
 * prevAuto 가 비어 있으면(첫 실행 등) 옛 병합과 결과가 같다.
 * 한계: 사용자가 손으로 넣은 태그가 우연히 직전 자동태그와 같은 문자열이면 자동태그로 간주돼 함께 제거될 수 있다(출처 구분 불가).
 */
export function mergeAutoTags(
  prevTags: string[],
  prevAuto: string[],
  nextAuto: string[],
  max = 10,
): string[] {
  const kept = prevTags.filter(tag => !prevAuto.includes(tag) || nextAuto.includes(tag));
  const toAdd = nextAuto.filter(tag => !kept.includes(tag));
  if (toAdd.length === 0) {
    return kept.length === prevTags.length ? prevTags : kept;
  }
  // 최대 max 개 제한 — 남은 슬롯만큼만 추가(옛 동작). 음수 슬롯은 0 으로(이미 상한 초과 시 slice(0, 음수) 로 더 붙던 경계 방지)
  const remainingSlots = Math.max(0, max - kept.length);
  return [...kept, ...toAdd.slice(0, remainingSlots)];
}
