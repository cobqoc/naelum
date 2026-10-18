import { describe, it, expect } from 'vitest';
import { getClientIp } from '../clientIp';

const h = (init: Record<string, string>) => new Headers(init);

// 라우트들에 복붙돼 있던 원래 식 — 헬퍼가 이것과 같은 값을 내는지(행위 보존) 대조하는 오라클.
const legacy = (x: Headers) =>
  x.get('cf-connecting-ip') || x.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
const legacyRealIp = (x: Headers) =>
  x.get('cf-connecting-ip') || x.get('x-forwarded-for')?.split(',')[0]?.trim() || x.get('x-real-ip') || 'unknown';

const CASES: Record<string, string>[] = [
  {},
  { 'cf-connecting-ip': '1.1.1.1' },
  { 'x-forwarded-for': '2.2.2.2' },
  { 'x-forwarded-for': ' 3.3.3.3 , 10.0.0.1' },
  { 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' },
  { 'x-forwarded-for': '' },
  { 'x-forwarded-for': ' , 4.4.4.4' },
  { 'x-real-ip': '5.5.5.5' },
  { 'x-forwarded-for': '2.2.2.2', 'x-real-ip': '5.5.5.5' },
  { 'cf-connecting-ip': '', 'x-real-ip': '5.5.5.5' },
];

describe('getClientIp', () => {
  it('기본: 기존 복붙 식(cf → xff 첫 값 → unknown)과 모든 경우 동일', () => {
    for (const c of CASES) expect(getClientIp(h(c))).toBe(legacy(h(c)));
  });

  it('realIpFallback: signin·signup 의 기존 식(cf → xff → x-real-ip → unknown)과 모든 경우 동일', () => {
    for (const c of CASES) expect(getClientIp(h(c), { realIpFallback: true })).toBe(legacyRealIp(h(c)));
  });

  it('Cloudflare 헤더가 있으면 X-Forwarded-For 보다 우선한다', () => {
    expect(getClientIp(h({ 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '172.70.0.1' }))).toBe('1.1.1.1');
  });

  it('기본 모드는 x-real-ip 를 보지 않는다', () => {
    expect(getClientIp(h({ 'x-real-ip': '5.5.5.5' }))).toBe('unknown');
  });
});
