import { describe, it, expect } from 'vitest';
import { computeAutoTags, mergeAutoTags, type AutoTagInput } from '@/lib/recipes/autoTags';

// 2026-10-04 [PHR-43] recipes/new 자동태그 — 더 이상 해당하지 않는 자동태그 제거 + 사용자 태그 보존 회귀 고정.

const base: AutoTagInput = {
  cuisineType: '', customCuisineType: '', dishType: '', customDishType: '',
  isVegetarian: false, isVegan: false, isGlutenFree: false,
};

// recipes/new effect 를 그대로 흉내: 상태 변화마다 computeAutoTags → mergeAutoTags(prev, 직전 auto, 새 auto)
function simulate(steps: AutoTagInput[], initialTags: string[] = [], userAdds: Record<number, string[]> = {}) {
  let tags = initialTags;
  let prevAuto: string[] = [];
  steps.forEach((input, i) => {
    const next = computeAutoTags(input);
    tags = mergeAutoTags(tags, prevAuto, next);
    prevAuto = next;
    for (const u of userAdds[i] ?? []) if (!tags.includes(u) && tags.length < 10) tags = [...tags, u]; // TagsField addTag 와 동일 조건
  });
  return tags;
}

// 옛 effect 의 병합 식 그대로
function legacyMerge(prevTags: string[], autoTags: string[]) {
  const newTags = autoTags.filter(tag => !prevTags.includes(tag));
  if (newTags.length > 0) {
    const remainingSlots = 10 - prevTags.length;
    return [...prevTags, ...newTags.slice(0, remainingSlots)];
  }
  return prevTags;
}

describe('mergeAutoTags — [PHR-43]', () => {
  it('한글 IME 조합 단계별 커스텀 요리종류 입력 → 최종 1개만', () => {
    const typing = ['ㅍ', '퓨', '퓨ㅈ', '퓨저', '퓨전'].map(v => ({ ...base, cuisineType: 'other', customCuisineType: v }));
    expect(simulate([{ ...base, cuisineType: 'other' }, ...typing])).toEqual(['퓨전']);
  });

  it('영문 커스텀 입력 F→Fusion → 최종 1개, 커스텀 요리유형도 동일', () => {
    const typing = ['F', 'Fu', 'Fus', 'Fusi', 'Fusio', 'Fusion'].map(v => ({ ...base, cuisineType: 'other', customCuisineType: v }));
    expect(simulate(typing)).toEqual(['Fusion']);
    const dish = ['ㄷ', '도', '도ㅅ', '도시', '도시락'].map(v => ({ ...base, cuisineType: 'korean', dishType: 'other', customDishType: v }));
    expect(simulate(dish)).toEqual(['한식', 'KoreanFood', '도시락']);
  });

  it('한식 → 일식 변경 시 한식 태그 제거', () => {
    expect(simulate([{ ...base, cuisineType: 'korean' }, { ...base, cuisineType: 'japanese' }]))
      .toEqual(['일식', 'JapaneseFood']);
  });

  it('채식 on → off 시 채식 태그 제거, 다른 식단은 유지', () => {
    expect(simulate([{ ...base, isVegetarian: true }, { ...base }])).toEqual([]);
    expect(simulate([{ ...base, isVegetarian: true, isVegan: true }, { ...base, isVegan: true }])).toEqual(['비건', 'Vegan']);
  });

  it('사용자가 직접 입력한 태그는 자동태그 변화와 무관하게 보존(순서 유지)', () => {
    const tags = simulate(
      [{ ...base, cuisineType: 'korean' }, { ...base, cuisineType: 'korean', isVegetarian: true }, { ...base, cuisineType: 'japanese' }],
      ['내태그'],
      { 0: ['매운맛'] },
    );
    expect(tags).toEqual(['내태그', '매운맛', '일식', 'JapaneseFood']);
  });

  it('10개 상한 — 옛 동작과 동일하게 남은 슬롯만큼만 추가', () => {
    const nine = Array.from({ length: 9 }, (_, i) => `u${i}`);
    expect(mergeAutoTags(nine, [], ['채식', 'Vegetarian'])).toEqual([...nine, '채식']);
    const ten = Array.from({ length: 10 }, (_, i) => `u${i}`);
    expect(mergeAutoTags(ten, [], ['채식', 'Vegetarian'])).toEqual(ten);
    // 자동태그 교체로 빈 슬롯이 생기면 그만큼 새 자동태그 추가
    const eightPlusKo = [...Array.from({ length: 8 }, (_, i) => `u${i}`), '한식', 'KoreanFood'];
    expect(mergeAutoTags(eightPlusKo, ['한식', 'KoreanFood'], ['일식', 'JapaneseFood']))
      .toEqual([...eightPlusKo.slice(0, 8), '일식', 'JapaneseFood']);
  });

  it('직전 자동태그가 없으면(첫 실행) 옛 병합과 결과 동일', () => {
    const prevs: string[][] = [[], ['a'], ['한식'], ['채식', 'x'], Array.from({ length: 9 }, (_, i) => `u${i}`), Array.from({ length: 10 }, (_, i) => `u${i}`)];
    const autos: string[][] = [[], ['한식', 'KoreanFood'], ['채식', 'Vegetarian', '비건', 'Vegan'], ['퓨전']];
    for (const p of prevs) for (const a of autos) expect(mergeAutoTags(p, [], a)).toEqual(legacyMerge(p, a));
  });

  it('자동태그가 늘기만 하는 변화(on 추가)는 옛 병합과 결과 동일 — e2e "채식 → #Vegetarian 칩" 경로', () => {
    const prev = ['내태그', '한식', 'KoreanFood'];
    const next = ['한식', 'KoreanFood', '채식', 'Vegetarian'];
    expect(mergeAutoTags(prev, ['한식', 'KoreanFood'], next)).toEqual(legacyMerge(prev, next));
    expect(simulate([{ ...base, isVegetarian: true }])).toContain('Vegetarian');
  });

  it('변화 없으면 같은 참조 반환', () => {
    const prev = ['한식', 'KoreanFood', '내태그'];
    expect(mergeAutoTags(prev, ['한식', 'KoreanFood'], ['한식', 'KoreanFood'])).toBe(prev);
    expect(mergeAutoTags(prev, [], [])).toBe(prev);
  });
});
