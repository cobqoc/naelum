import { describe, expect, it } from 'vitest';
import {
  addSubstituteChip,
  removeSubstituteChipAt,
  updateSubstituteNote,
  normalizeSubstitutes,
  type SubstituteEntry,
} from '@/lib/recipes/substituteChips';

describe('addSubstituteChip', () => {
  it('appends a trimmed chip to empty list', () => {
    expect(addSubstituteChip([], '페페론치노')).toEqual([{ name: '페페론치노' }]);
  });

  it('trims surrounding whitespace', () => {
    expect(addSubstituteChip([], '  풋고추  ')).toEqual([{ name: '풋고추' }]);
  });

  it('appends to non-empty list preserving order', () => {
    expect(addSubstituteChip([{ name: '페페론치노' }], '풋고추')).toEqual([
      { name: '페페론치노' },
      { name: '풋고추' },
    ]);
  });

  it('skips empty / whitespace-only input (no change)', () => {
    const start: SubstituteEntry[] = [{ name: '페페론치노' }];
    expect(addSubstituteChip(start, '')).toEqual([{ name: '페페론치노' }]);
    expect(addSubstituteChip(start, '   ')).toEqual([{ name: '페페론치노' }]);
  });

  it('dedups exact duplicate (no change)', () => {
    expect(addSubstituteChip([{ name: '페페론치노' }], '페페론치노')).toEqual([{ name: '페페론치노' }]);
  });

  it('dedups case-insensitively, preserves first form', () => {
    expect(addSubstituteChip([{ name: 'Pepperoncino' }], 'pepperoncino')).toEqual([{ name: 'Pepperoncino' }]);
  });

  it('preserves existing note when deduping', () => {
    expect(addSubstituteChip([{ name: '멸치 다시다', note: '1큰술' }], '멸치 다시다')).toEqual([
      { name: '멸치 다시다', note: '1큰술' },
    ]);
  });

  it('returns a new array reference (no mutation)', () => {
    const original: SubstituteEntry[] = [{ name: '페페론치노' }];
    const next = addSubstituteChip(original, '풋고추');
    expect(next).not.toBe(original);
    expect(original).toEqual([{ name: '페페론치노' }]);
  });
});

describe('removeSubstituteChipAt', () => {
  it('removes the chip at given index', () => {
    const list: SubstituteEntry[] = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
    expect(removeSubstituteChipAt(list, 1)).toEqual([{ name: 'a' }, { name: 'c' }]);
  });

  it('removes first / last chip', () => {
    const list: SubstituteEntry[] = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
    expect(removeSubstituteChipAt(list, 0)).toEqual([{ name: 'b' }, { name: 'c' }]);
    expect(removeSubstituteChipAt(list, 2)).toEqual([{ name: 'a' }, { name: 'b' }]);
  });

  it('returns input unchanged on out-of-range index', () => {
    const original: SubstituteEntry[] = [{ name: 'a' }, { name: 'b' }];
    expect(removeSubstituteChipAt(original, -1)).toBe(original);
    expect(removeSubstituteChipAt(original, 2)).toBe(original);
    expect(removeSubstituteChipAt(original, 99)).toBe(original);
  });

  it('returns empty list when removing only element', () => {
    expect(removeSubstituteChipAt([{ name: 'solo' }], 0)).toEqual([]);
  });
});

describe('updateSubstituteNote', () => {
  it('sets a new note on a chip without one', () => {
    expect(updateSubstituteNote([{ name: '멸치 다시다' }], 0, '1큰술')).toEqual([
      { name: '멸치 다시다', note: '1큰술' },
    ]);
  });

  it('replaces existing note', () => {
    expect(updateSubstituteNote([{ name: '멸치 다시다', note: '1큰술' }], 0, '2큰술')).toEqual([
      { name: '멸치 다시다', note: '2큰술' },
    ]);
  });

  it('removes note when input is empty (drops note key)', () => {
    expect(updateSubstituteNote([{ name: '멸치 다시다', note: '1큰술' }], 0, '')).toEqual([
      { name: '멸치 다시다' },
    ]);
  });

  it('trims whitespace and treats blank as removal', () => {
    expect(updateSubstituteNote([{ name: '멸치 다시다', note: '1큰술' }], 0, '   ')).toEqual([
      { name: '멸치 다시다' },
    ]);
    expect(updateSubstituteNote([{ name: '멸치 다시다' }], 0, '  1큰술  ')).toEqual([
      { name: '멸치 다시다', note: '1큰술' },
    ]);
  });

  it('returns input unchanged on out-of-range index', () => {
    const original: SubstituteEntry[] = [{ name: 'a' }];
    expect(updateSubstituteNote(original, -1, '1큰술')).toBe(original);
    expect(updateSubstituteNote(original, 1, '1큰술')).toBe(original);
  });

  it('leaves other chips untouched', () => {
    const original: SubstituteEntry[] = [{ name: 'a' }, { name: 'b', note: '약간' }];
    expect(updateSubstituteNote(original, 0, '1큰술')).toEqual([
      { name: 'a', note: '1큰술' },
      { name: 'b', note: '약간' },
    ]);
  });
});

describe('normalizeSubstitutes', () => {
  it('handles legacy string[] from DB', () => {
    expect(normalizeSubstitutes(['멸치 다시다', '가쓰오부시'])).toEqual([
      { name: '멸치 다시다' },
      { name: '가쓰오부시' },
    ]);
  });

  it('handles new object[] form', () => {
    expect(normalizeSubstitutes([{ name: '멸치 다시다', note: '1큰술' }, { name: '가쓰오부시' }])).toEqual([
      { name: '멸치 다시다', note: '1큰술' },
      { name: '가쓰오부시' },
    ]);
  });

  it('handles mixed (string + object)', () => {
    expect(normalizeSubstitutes(['멸치 다시다', { name: '가쓰오부시', note: '약간' }])).toEqual([
      { name: '멸치 다시다' },
      { name: '가쓰오부시', note: '약간' },
    ]);
  });

  it('trims and skips empty/whitespace entries', () => {
    expect(normalizeSubstitutes(['', '  ', '멸치 다시다', { name: '   ' }])).toEqual([
      { name: '멸치 다시다' },
    ]);
  });

  it('returns [] for non-array input', () => {
    expect(normalizeSubstitutes(null)).toEqual([]);
    expect(normalizeSubstitutes(undefined)).toEqual([]);
    expect(normalizeSubstitutes('string')).toEqual([]);
    expect(normalizeSubstitutes(42)).toEqual([]);
  });

  it('drops malformed entries (no name or non-string name)', () => {
    expect(normalizeSubstitutes([{ name: null }, { note: 'orphan' }, { name: 123 }])).toEqual([]);
  });

  it('drops note key when note is empty/whitespace', () => {
    expect(normalizeSubstitutes([{ name: '멸치', note: '' }, { name: '가쓰오', note: '   ' }])).toEqual([
      { name: '멸치' },
      { name: '가쓰오' },
    ]);
  });
});
