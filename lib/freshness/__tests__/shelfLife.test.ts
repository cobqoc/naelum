import { describe, it, expect } from 'vitest';
import {
  normalizeStorage,
  normalizeCategory,
  resolveShelfLifeDays,
  estimateExpiry,
  CATEGORY_STORAGE_DAYS,
} from '../shelfLife';

describe('normalizeStorage', () => {
  it('정규 3종은 그대로', () => {
    expect(normalizeStorage('냉장')).toBe('냉장');
    expect(normalizeStorage('냉동')).toBe('냉동');
    expect(normalizeStorage('상온')).toBe('상온');
  });
  it("'기타'·null·미지·빈문자는 null (추정 불가 신호, H5)", () => {
    expect(normalizeStorage('기타')).toBeNull();
    expect(normalizeStorage(null)).toBeNull();
    expect(normalizeStorage(undefined)).toBeNull();
    expect(normalizeStorage('')).toBeNull();
    expect(normalizeStorage('실온')).toBeNull(); // 오타/비정규
  });
  it('공백 트림', () => {
    expect(normalizeStorage('  냉장 ')).toBe('냉장');
  });
});

describe('normalizeCategory', () => {
  it('알려진 카테고리는 그대로(소문자)', () => {
    expect(normalizeCategory('veggie')).toBe('veggie');
    expect(normalizeCategory('SEAFOOD')).toBe('seafood');
    expect(normalizeCategory(' Meat ')).toBe('meat');
  });
  it('미지/null 은 other 로 fallback', () => {
    expect(normalizeCategory(null)).toBe('other');
    expect(normalizeCategory('우주식량')).toBe('other');
    expect(normalizeCategory('')).toBe('other');
  });
});

describe('resolveShelfLifeDays — 사다리 ②→③', () => {
  it('보관위치 불명이면 무조건 null (모르면 추정 안 함)', () => {
    expect(resolveShelfLifeDays({ category: 'veggie', storageLocation: '기타' })).toBeNull();
    expect(resolveShelfLifeDays({ category: 'veggie', storageLocation: null })).toBeNull();
    // 재료별 데이터가 있어도 보관위치 모르면 null
    expect(resolveShelfLifeDays({ shelfLifeDays: { 냉장: 7 }, storageLocation: null })).toBeNull();
  });

  it('tier②: 재료별 shelf_life_days[보관위치] 우선', () => {
    expect(resolveShelfLifeDays({
      shelfLifeDays: { 냉장: 60, 냉동: 240 },
      category: 'veggie', // tier③ veggie 냉장=14 이지만 tier②가 이김
      storageLocation: '냉장',
    })).toBe(60);
  });

  it('tier②에 해당 보관위치 키 없으면 tier③로 폴백', () => {
    // 양파 상온만 정의 → 냉동 요청 시 카테고리(veggie 냉동=180)로
    expect(resolveShelfLifeDays({
      shelfLifeDays: { 상온: 60 },
      category: 'veggie',
      storageLocation: '냉동',
    })).toBe(CATEGORY_STORAGE_DAYS.veggie.냉동);
  });

  it('tier③: 재료별 없으면 카테고리×보관위치', () => {
    expect(resolveShelfLifeDays({ category: 'seafood', storageLocation: '냉장' })).toBe(2);
    expect(resolveShelfLifeDays({ category: 'meat', storageLocation: '냉동' })).toBe(120);
  });

  it('미지 카테고리는 other 표로', () => {
    expect(resolveShelfLifeDays({ category: '미지', storageLocation: '냉장' }))
      .toBe(CATEGORY_STORAGE_DAYS.other.냉장);
  });

  it('음수 shelf_life 값은 무시하고 tier③', () => {
    expect(resolveShelfLifeDays({
      shelfLifeDays: { 냉장: -1 },
      category: 'dairy',
      storageLocation: '냉장',
    })).toBe(CATEGORY_STORAGE_DAYS.dairy.냉장);
  });
});

describe('estimateExpiry — 예상 만료일(UTC, SSR-stable)', () => {
  it('구매일 + 보관일수 = 예상 만료일', () => {
    // 2026-06-03 구매, 양파 냉장(tier② 60일) → 2026-08-02
    expect(estimateExpiry({
      purchaseDate: '2026-06-03',
      shelfLifeDays: { 냉장: 60 },
      storageLocation: '냉장',
    })).toBe('2026-08-02');
  });

  it('tier③ 폴백으로도 계산 (seafood 냉장 2일)', () => {
    expect(estimateExpiry({
      purchaseDate: '2026-06-03',
      category: 'seafood',
      storageLocation: '냉장',
    })).toBe('2026-06-05');
  });

  it('구매일 없으면 null', () => {
    expect(estimateExpiry({ category: 'veggie', storageLocation: '냉장' })).toBeNull();
    expect(estimateExpiry({ purchaseDate: null, category: 'veggie', storageLocation: '냉장' })).toBeNull();
  });

  it('보관위치 불명이면 null (추정 안 함)', () => {
    expect(estimateExpiry({ purchaseDate: '2026-06-03', category: 'veggie', storageLocation: '기타' })).toBeNull();
  });

  it('월말/연말 경계 (UTC 산술)', () => {
    expect(estimateExpiry({ purchaseDate: '2026-12-30', shelfLifeDays: { 상온: 5 }, storageLocation: '상온' }))
      .toBe('2027-01-04');
  });
});
