import type { RecipeIngredient, RecipeStep } from '@/lib/constants/recipe';
import type { SubstituteEntry } from '@/lib/recipes/substituteChips';
import type { TranslationKeys } from '@/lib/i18n/translations';

/**
 * 레시피 작성·수정 폼(recipes/new · recipes/[id]/edit) 재료·단계 행 갱신 — 순수 함수(vitest).
 *
 * 2026-10-04 [PHR-D1 (a)-2] 두 페이지에 똑같이 복붙돼 있던 핸들러 본문을 한 벌로 모음. 페이지는 반드시
 * 함수형 업데이트 `setX(prev => fn(prev, …))` 로 호출한다.
 * [PHR-01] 옛 핸들러는 렌더 시점 배열을 복사해 통째로 setState 해서, 단계 이미지 업로드(await getUser·storage)가
 * 끝나는 순간 업로드 *시작 시점* 배열로 덮어써 그 사이 입력한 단계 내용·추가한 단계가 사라졌다 → 함수형 업데이트로 차단.
 * 범위 밖 index(업로드 중 그 단계가 삭제됨)는 무시한다 — 옛 코드는 `{ image_url }` 만 있는 깨진 행을 덧붙였다.
 */

/** 자동완성 선택 항목에서 쓰는 필드만 (IngredientItem 과 구조 호환) */
export interface SelectedIngredientLike {
  id: string;
  name: string;
  common_units?: string[] | null;
}

export type IngredientField = keyof RecipeIngredient;
export type IngredientValue = string | boolean | SubstituteEntry[];

/**
 * 재료 행 필드 갱신.
 * [PHR-03] 자동완성으로 고른 뒤(ingredient_id 있음) 재료명을 손으로 바꾸면 옛 ingredient_id 를 해제 — 서버가 이름
 * 정확일치로 재해석(없으면 null)하게 한다. 이름이 그대로면(선택 직후 onChange(label) 포함) id 유지, id 없던 행은 옛 동작과 동일.
 */
export function updateIngredientAt(
  ingredients: RecipeIngredient[],
  index: number,
  field: IngredientField,
  value: IngredientValue,
): RecipeIngredient[] {
  return ingredients.map((ing, i) => {
    if (i !== index) return ing;
    if (field === 'ingredient_name' && ing.ingredient_id !== undefined && value !== ing.ingredient_name) {
      const { ingredient_id: _staleId, ...rest } = ing;
      return { ...rest, ingredient_name: value as string };
    }
    return { ...ing, [field]: value };
  });
}

/** 자동완성에서 재료 선택 — ingredient_id FK 설정 + 단위 미선택('선택')이면 common_units[0] 추천 */
export function selectIngredientAt(
  ingredients: RecipeIngredient[],
  index: number,
  item: SelectedIngredientLike,
): RecipeIngredient[] {
  return ingredients.map((current, i) => i !== index ? current : {
    ...current,
    ingredient_name: item.name,
    ingredient_id: item.id,
    ...(item.common_units?.[0] && current.unit === '선택' ? { unit: item.common_units[0] } : {}),
  });
}

/** 조리 단계 필드 갱신 (이미지 업로드 완료 콜백 포함) */
export function updateStepAt(
  steps: RecipeStep[],
  index: number,
  field: keyof RecipeStep,
  value: string | number | null,
): RecipeStep[] {
  return steps.map((s, i) => i === index ? { ...s, [field]: value } : s);
}

/** 행 삭제 — 최소 minRows 행은 유지(이하면 그대로 반환) */
export function removeRowAt<T>(rows: T[], index: number, minRows = 1): T[] {
  return rows.length > minRows ? rows.filter((_, i) => i !== index) : rows;
}

type PlaceholderTf = Pick<TranslationKeys['recipeForm'],
  | 'getPlaceholderName1' | 'getPlaceholderQty1' | 'getPlaceholderNotes1'
  | 'getPlaceholderName2' | 'getPlaceholderQty2' | 'getPlaceholderNotes2'
  | 'getPlaceholderName3' | 'getPlaceholderQty3' | 'getPlaceholderNotes3'
  | 'ingName' | 'ingQuantity' | 'ingNotes'>;

/**
 * 재료 행 placeholder — 1·3번째 행은 예시 문구, 나머지는 일반 문구.
 * [PHR-D1 (b)-5] new/edit 차이는 5번째 행(index 4)뿐: edit 만 예시 3("예: 소금"), new 는 일반 문구 — `fifthRowExample` 로 보존.
 */
export function getIngredientPlaceholder(
  tf: PlaceholderTf,
  index: number,
  field: 'name' | 'quantity' | 'notes',
  { fifthRowExample }: { fifthRowExample: boolean },
): string {
  const examples = {
    0: { name: tf.getPlaceholderName1, quantity: tf.getPlaceholderQty1, notes: tf.getPlaceholderNotes1 },
    2: { name: tf.getPlaceholderName2, quantity: tf.getPlaceholderQty2, notes: tf.getPlaceholderNotes2 },
    4: fifthRowExample
      ? { name: tf.getPlaceholderName3, quantity: tf.getPlaceholderQty3, notes: tf.getPlaceholderNotes3 }
      : { name: tf.ingName, quantity: tf.ingQuantity, notes: tf.ingNotes },
  };

  const example = examples[index as keyof typeof examples];
  if (example) {
    return example[field];
  }

  return field === 'name' ? tf.ingName : field === 'quantity' ? tf.ingQuantity : tf.ingNotes;
}
