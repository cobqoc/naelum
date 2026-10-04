import { describe, it, expect } from 'vitest';
import {
  updateIngredientAt, selectIngredientAt, updateStepAt, removeRowAt, getIngredientPlaceholder,
} from '@/lib/recipes/formRows';
import type { RecipeIngredient, RecipeStep } from '@/lib/constants/recipe';
import { ko } from '@/lib/i18n/locales/ko';

// 2026-10-04 [PHR-01]·[PHR-03]·[PHR-D1] 레시피 작성/수정 폼 행 갱신 순수 함수 회귀 고정.

const row = (over: Partial<RecipeIngredient> = {}): RecipeIngredient =>
  ({ ingredient_name: '', quantity: '', unit: '선택', notes: '', is_optional: false, substitutes: [], ...over });
const step = (over: Partial<RecipeStep> = {}): RecipeStep =>
  ({ instruction: '', timer_minutes: null, tip: '', image_url: null, ...over });

// 옛 페이지 핸들러 본문(렌더 시점 배열 복사) 그대로
function legacyUpdate<T>(list: T[], index: number, field: keyof T, value: unknown): T[] {
  const updated = [...list];
  updated[index] = { ...updated[index], [field]: value };
  return updated;
}

describe('updateStepAt — [PHR-01] 업로드 완료 시 업로드 중 입력 보존', () => {
  it('업로드 시작 후 입력·단계 추가 → 완료 콜백(함수형) 이 둘 다 보존', () => {
    const atUploadStart = [step()];
    // 업로드 중 사용자 입력 + 단계 추가 (각각 최신 상태 기반)
    let state = updateStepAt(atUploadStart, 0, 'instruction', '양파를 썬다');
    state = [...state, step()];
    // 옛 코드: 업로드 시작 시점 배열로 덮어씀 → 입력·새 단계 유실(버그 재현)
    const legacy = legacyUpdate(atUploadStart, 0, 'image_url', 'https://x/a.jpg');
    expect(legacy).toEqual([step({ image_url: 'https://x/a.jpg' })]);
    // 새 코드: 완료 시점의 최신 상태에 적용
    const fixed = updateStepAt(state, 0, 'image_url', 'https://x/a.jpg');
    expect(fixed).toEqual([step({ instruction: '양파를 썬다', image_url: 'https://x/a.jpg' }), step()]);
  });

  it('동기 단일 호출은 옛 핸들러와 결과 동일(범위 안 index)', () => {
    const steps = [step({ instruction: 'a' }), step({ instruction: 'b', title: 't' })];
    const calls: [number, keyof RecipeStep, string | number | null][] = [
      [0, 'instruction', 'x'], [1, 'title', '새 제목'], [1, 'tip', '약불'], [0, 'timer_minutes', 5], [1, 'image_url', null],
    ];
    for (const [i, f, v] of calls) expect(updateStepAt(steps, i, f, v)).toEqual(legacyUpdate(steps, i, f, v));
  });

  it('업로드 중 해당 단계가 삭제돼 index 가 범위 밖이면 무시(옛 코드는 깨진 행 추가)', () => {
    const steps = [step({ instruction: 'a' })];
    expect(updateStepAt(steps, 3, 'image_url', 'u')).toEqual(steps);
  });
});

describe('updateIngredientAt — [PHR-03] 손으로 이름 수정 시 옛 ingredient_id 해제', () => {
  it('선택 후 이름을 바꾸면 id 제거, 다른 필드는 유지', () => {
    const ings = [row({ ingredient_name: '돼지고기', ingredient_id: 'pork-id', quantity: '300', unit: 'g' })];
    expect(updateIngredientAt(ings, 0, 'ingredient_name', '소고기'))
      .toEqual([{ ingredient_name: '소고기', quantity: '300', unit: 'g', notes: '', is_optional: false, substitutes: [] }]);
  });

  it('이름이 그대로면(선택 직후 onChange(label)) id 유지', () => {
    const ings = [row({ ingredient_name: '돼지고기', ingredient_id: 'pork-id' })];
    expect(updateIngredientAt(ings, 0, 'ingredient_name', '돼지고기')[0].ingredient_id).toBe('pork-id');
  });

  it('자동완성 선택 흐름: onChange(label) → onSelect(item) 순서로 함수형 적용 → 최종 id 설정', () => {
    let ings = [row({ ingredient_name: '돼지' })];
    ings = updateIngredientAt(ings, 0, 'ingredient_name', '돼지고기');            // Autocomplete onChange(item.label)
    ings = selectIngredientAt(ings, 0, { id: 'pork-id', name: '돼지고기', common_units: ['g'] }); // onSelect(item)
    expect(ings[0]).toMatchObject({ ingredient_name: '돼지고기', ingredient_id: 'pork-id', unit: 'g' });
  });

  it('이름 외 필드 변경은 id 유지, id 없는 행은 옛 핸들러와 결과 동일', () => {
    const withId = [row({ ingredient_name: '소금', ingredient_id: 'salt' })];
    expect(updateIngredientAt(withId, 0, 'quantity', '1')[0].ingredient_id).toBe('salt');
    const noId = [row({ ingredient_name: '소' }), row()];
    const calls: [number, keyof RecipeIngredient, string | boolean][] = [
      [0, 'ingredient_name', '소금'], [1, 'unit', 'g'], [0, 'is_optional', true], [1, 'notes', '약간'],
    ];
    for (const [i, f, v] of calls) expect(updateIngredientAt(noId, i, f, v)).toEqual(legacyUpdate(noId, i, f, v));
  });
});

describe('selectIngredientAt', () => {
  it('단위 미선택이면 common_units[0] 추천, 이미 고른 단위는 유지', () => {
    expect(selectIngredientAt([row()], 0, { id: 'i', name: '두부', common_units: ['모'] })[0])
      .toMatchObject({ ingredient_name: '두부', ingredient_id: 'i', unit: '모' });
    expect(selectIngredientAt([row({ unit: 'g' })], 0, { id: 'i', name: '두부', common_units: ['모'] })[0].unit).toBe('g');
    expect(selectIngredientAt([row()], 0, { id: 'i', name: '물', common_units: [] })[0].unit).toBe('선택');
  });
});

describe('removeRowAt', () => {
  it('최소 1행 유지, 그 이상이면 해당 index 삭제', () => {
    expect(removeRowAt(['a'], 0)).toEqual(['a']);
    expect(removeRowAt(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
    const one = ['only'];
    expect(removeRowAt(one, 0)).toBe(one);
  });
});

describe('getIngredientPlaceholder — [PHR-D1 (b)-5]', () => {
  const tf = ko.recipeForm;
  // 옛 new / edit getPlaceholder 본문 그대로
  const legacyNew = (index: number, field: 'name' | 'quantity' | 'notes') => {
    const examples = {
      0: { name: tf.getPlaceholderName1, quantity: tf.getPlaceholderQty1, notes: tf.getPlaceholderNotes1 },
      2: { name: tf.getPlaceholderName2, quantity: tf.getPlaceholderQty2, notes: tf.getPlaceholderNotes2 },
      4: { name: tf.ingName, quantity: tf.ingQuantity, notes: tf.ingNotes },
    };
    const example = examples[index as keyof typeof examples];
    if (example) return example[field];
    return field === 'name' ? tf.ingName : field === 'quantity' ? tf.ingQuantity : tf.ingNotes;
  };
  const legacyEdit = (index: number, field: 'name' | 'quantity' | 'notes') => {
    const examples = {
      0: { name: tf.getPlaceholderName1, quantity: tf.getPlaceholderQty1, notes: tf.getPlaceholderNotes1 },
      2: { name: tf.getPlaceholderName2, quantity: tf.getPlaceholderQty2, notes: tf.getPlaceholderNotes2 },
      4: { name: tf.getPlaceholderName3, quantity: tf.getPlaceholderQty3, notes: tf.getPlaceholderNotes3 },
    };
    const example = examples[index as keyof typeof examples];
    if (example) return example[field];
    return field === 'name' ? tf.ingName : field === 'quantity' ? tf.ingQuantity : tf.ingNotes;
  };
  it('new(fifthRowExample=false)·edit(true) 모두 옛 함수와 전 index·field 동일', () => {
    for (let i = 0; i < 12; i++) {
      for (const f of ['name', 'quantity', 'notes'] as const) {
        expect(getIngredientPlaceholder(tf, i, f, { fifthRowExample: false })).toBe(legacyNew(i, f));
        expect(getIngredientPlaceholder(tf, i, f, { fifthRowExample: true })).toBe(legacyEdit(i, f));
      }
    }
  });
});
