import { describe, it, expect } from 'vitest';
import { formatTime } from '@/lib/utils/formatTime';

describe('formatTime', () => {
  it('0초 → 00:00', () => expect(formatTime(0)).toBe('00:00'));
  it('한 자리 초 zero-pad', () => expect(formatTime(5)).toBe('00:05'));
  it('59초', () => expect(formatTime(59)).toBe('00:59'));
  it('정확히 1분', () => expect(formatTime(60)).toBe('01:00'));
  it('분+초', () => expect(formatTime(90)).toBe('01:30'));
  it('10분 이상 분 자리 유지', () => expect(formatTime(630)).toBe('10:30'));
  it('큰 값(99:59)', () => expect(formatTime(99 * 60 + 59)).toBe('99:59'));
});
