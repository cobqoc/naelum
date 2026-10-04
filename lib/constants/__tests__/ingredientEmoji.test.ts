import { describe, it, expect } from 'vitest';
import { suggestEmoji } from '../ingredientEmoji';

// ICL-38 (2026-10-04): 1글자 키 부분일치를 "끝 글자"로 제한 — 기존에 맞던 매핑은 그대로, 오매칭만 빈 문자열.
describe('suggestEmoji', () => {
  it('정확 매칭은 그대로 (1글자 키 포함)', () => {
    const exact: Record<string, string> = {
      '양파': '🧅', '고추': '🌶️', '식빵': '🍞', '꽃게': '🦀', '새송이버섯': '🍄',
      '귤': '🍊', '배': '🍐', '햄': '🍖', '게': '🦀', '굴': '🦪', '쌀': '🍚', '밥': '🍚', '빵': '🍞', '꿀': '🍯', '잣': '🌰',
    };
    for (const [name, emoji] of Object.entries(exact)) expect(suggestEmoji(name), name).toBe(emoji);
  });

  it('2글자 이상 키의 부분 매칭은 그대로', () => {
    const partial: Record<string, string> = {
      '방울토마토': '🍅', '양송이버섯': '🍄', '냉동새우': '🦐', '훈제연어': '🐟', '체다치즈': '🧀',
      '무염버터': '🧈', '저지방우유': '🥛', '닭다리살': '🍗', '청양고추가루': '🌶️',
    };
    for (const [name, emoji] of Object.entries(partial)) expect(suggestEmoji(name), name).toBe(emoji);
  });

  it('1글자 키가 끝 글자(중심어)면 이전처럼 맞춘다', () => {
    const suffix: Record<string, string> = {
      '제주귤': '🍊', '감귤': '🍊', '신고배': '🍐', '통조림햄': '🍖', '대게': '🦀', '생굴': '🦪',
      '찹쌀': '🍚', '비빔밥': '🍚', '호빵': '🍞', '벌꿀': '🍯', '볶은잣': '🌰',
    };
    for (const [name, emoji] of Object.entries(suffix)) expect(suggestEmoji(name), name).toBe(emoji);
  });

  it('1글자 키가 다른 낱말의 일부면 빈 문자열 (이전 오매칭)', () => {
    for (const name of ['알배추', '양배추', '배추', '봄동배추', '방울양배추', '배추김치', '굴소스', '쌀국수', '햄버거', '게맛살', '꿀떡', '빵가루']) {
      expect(suggestEmoji(name), name).toBe('');
    }
  });

  it('공백 trim·빈 입력', () => {
    expect(suggestEmoji('  귤 ')).toBe('🍊');
    expect(suggestEmoji('')).toBe('');
    expect(suggestEmoji('   ')).toBe('');
    expect(suggestEmoji('알 수 없는 재료')).toBe('');
  });
});
