import { describe, it, expect } from 'vitest';
import { getTimeAgo, type TimeAgoLabels } from '@/lib/utils/timeAgo';

const L: TimeAgoLabels = {
  minutesAgo: '분 전',
  hoursAgo: '시간 전',
  daysAgo: '일 전',
  monthsAgo: '개월 전',
  yearsAgo: '년 전',
};

function ago(ms: number) {
  return new Date(Date.now() - ms).toISOString();
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('getTimeAgo', () => {
  it('60분 미만 → 분 단위', () => {
    expect(getTimeAgo(ago(5 * MIN), L)).toBe('5분 전');
    expect(getTimeAgo(ago(0), L)).toBe('0분 전');
    expect(getTimeAgo(ago(59 * MIN), L)).toBe('59분 전');
  });

  it('60분~24시간 → 시간 단위', () => {
    expect(getTimeAgo(ago(60 * MIN), L)).toBe('1시간 전');
    expect(getTimeAgo(ago(23 * HOUR), L)).toBe('23시간 전');
  });

  it('24시간~30일 → 일 단위', () => {
    expect(getTimeAgo(ago(DAY), L)).toBe('1일 전');
    expect(getTimeAgo(ago(29 * DAY), L)).toBe('29일 전');
  });

  it('30일~12개월 → 개월 단위 (diffDays/30)', () => {
    expect(getTimeAgo(ago(30 * DAY), L)).toBe('1개월 전');
    expect(getTimeAgo(ago(60 * DAY), L)).toBe('2개월 전');
  });

  it('1년 이상 → 년 단위 (diffDays/365)', () => {
    expect(getTimeAgo(ago(365 * DAY), L)).toBe('1년 전');
    expect(getTimeAgo(ago(730 * DAY), L)).toBe('2년 전');
  });

  it('경계: 정확히 60분은 시간 단위(>=60min, diffMins<60 false)', () => {
    expect(getTimeAgo(ago(60 * MIN), L)).toBe('1시간 전');
  });
});
