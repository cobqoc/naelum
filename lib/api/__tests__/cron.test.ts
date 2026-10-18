import { describe, it, expect } from 'vitest';
import { isAuthorizedCronRequest } from '../cron';

const h = (authorization?: string) =>
  new Headers(authorization === undefined ? {} : { authorization });

// 2026-10-04 AG2-16: CRON_SECRET 미설정 시 "Bearer undefined" 통과 차단.
describe('isAuthorizedCronRequest', () => {
  it('시크릿이 설정돼 있고 헤더가 정확히 일치하면 true (정상 경로 동일)', () => {
    expect(isAuthorizedCronRequest(h('Bearer s3cret'), 's3cret')).toBe(true);
  });

  it('틀린 시크릿·헤더 없음·Bearer 없음은 false', () => {
    expect(isAuthorizedCronRequest(h('Bearer nope'), 's3cret')).toBe(false);
    expect(isAuthorizedCronRequest(h(), 's3cret')).toBe(false);
    expect(isAuthorizedCronRequest(h('s3cret'), 's3cret')).toBe(false);
  });

  it('시크릿 미설정(undefined)·빈 문자열이면 어떤 헤더도 false — "Bearer undefined"·"Bearer " 포함', () => {
    expect(isAuthorizedCronRequest(h('Bearer undefined'), undefined)).toBe(false);
    expect(isAuthorizedCronRequest(h('Bearer '), '')).toBe(false);
    expect(isAuthorizedCronRequest(h(), undefined)).toBe(false);
  });
});
