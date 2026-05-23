import { describe, expect, it } from 'vitest';
import { addSubstituteChip, removeSubstituteChipAt } from '@/lib/recipes/substituteChips';

describe('addSubstituteChip', () => {
  it('appends a trimmed chip to empty list', () => {
    expect(addSubstituteChip([], '페페론치노')).toEqual(['페페론치노']);
  });

  it('trims surrounding whitespace', () => {
    expect(addSubstituteChip([], '  풋고추  ')).toEqual(['풋고추']);
  });

  it('appends to non-empty list preserving order', () => {
    expect(addSubstituteChip(['페페론치노'], '풋고추')).toEqual(['페페론치노', '풋고추']);
  });

  it('skips empty / whitespace-only input (no change)', () => {
    expect(addSubstituteChip(['페페론치노'], '')).toEqual(['페페론치노']);
    expect(addSubstituteChip(['페페론치노'], '   ')).toEqual(['페페론치노']);
  });

  it('dedups exact duplicate (no change)', () => {
    expect(addSubstituteChip(['페페론치노'], '페페론치노')).toEqual(['페페론치노']);
  });

  it('dedups case-insensitively, preserves first form', () => {
    expect(addSubstituteChip(['Pepperoncino'], 'pepperoncino')).toEqual(['Pepperoncino']);
    expect(addSubstituteChip(['페페론치노'], '페페론치노')).toEqual(['페페론치노']);
  });

  it('returns a new array reference (no mutation)', () => {
    const original = ['페페론치노'];
    const next = addSubstituteChip(original, '풋고추');
    expect(next).not.toBe(original);
    expect(original).toEqual(['페페론치노']);
  });
});

describe('removeSubstituteChipAt', () => {
  it('removes the chip at given index', () => {
    expect(removeSubstituteChipAt(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
  });

  it('removes first / last chip', () => {
    expect(removeSubstituteChipAt(['a', 'b', 'c'], 0)).toEqual(['b', 'c']);
    expect(removeSubstituteChipAt(['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
  });

  it('returns input unchanged on out-of-range index', () => {
    const original = ['a', 'b'];
    expect(removeSubstituteChipAt(original, -1)).toBe(original);
    expect(removeSubstituteChipAt(original, 2)).toBe(original);
    expect(removeSubstituteChipAt(original, 99)).toBe(original);
  });

  it('returns empty list when removing only element', () => {
    expect(removeSubstituteChipAt(['solo'], 0)).toEqual([]);
  });
});
