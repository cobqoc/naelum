import { describe, it, expect } from 'vitest';
import { getInitialGroup, GROUP_ORDER, groupSort, groupByInitial } from '../initialGroup';

// 부엌 도감 초성 그룹화 — 가나다순 뷰·카테고리 뷰 공용 순수 로직.

describe('getInitialGroup', () => {
  it('한글 음절 → 초성', () => {
    expect(getInitialGroup('가지')).toBe('ㄱ');
    expect(getInitialGroup('깻잎')).toBe('ㄲ');   // 쌍자음 초성
    expect(getInitialGroup('당근')).toBe('ㄷ');
    expect(getInitialGroup('땅콩')).toBe('ㄸ');
    expect(getInitialGroup('호박')).toBe('ㅎ');
  });

  it('영문 → 대문자', () => {
    expect(getInitialGroup('apple')).toBe('A');
    expect(getInitialGroup('Zucchini')).toBe('Z');
  });

  it('그 외/빈 문자열 → #', () => {
    expect(getInitialGroup('123')).toBe('#');
    expect(getInitialGroup('   ')).toBe('#');
    expect(getInitialGroup('')).toBe('#');
  });

  it('앞뒤 공백 무시', () => {
    expect(getInitialGroup('  마늘 ')).toBe('ㅁ');
  });
});

describe('groupSort / GROUP_ORDER', () => {
  it('한글 → 영문 → # 순', () => {
    expect(groupSort('ㄱ', 'ㅎ')).toBeLessThan(0);
    expect(groupSort('ㅎ', 'A')).toBeLessThan(0);
    expect(groupSort('A', '#')).toBeLessThan(0);
  });

  it('GROUP_ORDER 는 ㄱ 으로 시작하고 # 으로 끝난다', () => {
    expect(GROUP_ORDER[0]).toBe('ㄱ');
    expect(GROUP_ORDER[GROUP_ORDER.length - 1]).toBe('#');
  });
});

describe('groupByInitial', () => {
  it('초성별로 묶고 그룹/내부 모두 정렬', () => {
    const items = [
      { name: '당근' }, { name: '가지' }, { name: '깻잎' }, { name: '감자' },
    ];
    const result = groupByInitial(items);
    expect(result.map(g => g.group)).toEqual(['ㄱ', 'ㄲ', 'ㄷ']);
    // ㄱ 그룹 내부 가나다순: 가지 < 감자
    expect(result[0].list.map(i => i.name)).toEqual(['가지', '감자']);
    expect(result[1].list.map(i => i.name)).toEqual(['깻잎']);
    expect(result[2].list.map(i => i.name)).toEqual(['당근']);
  });

  it('빈 배열 → 빈 결과', () => {
    expect(groupByInitial([])).toEqual([]);
  });

  it('원본 배열을 변형하지 않는다 (순수)', () => {
    const items = [{ name: '나' }, { name: '가' }];
    groupByInitial(items);
    expect(items.map(i => i.name)).toEqual(['나', '가']);
  });
});
