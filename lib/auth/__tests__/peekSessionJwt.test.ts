import { describe, it, expect } from 'vitest';
import { createChunks, stringToBase64URL } from '@supabase/ssr';
import { peekSessionJwt } from '../peekSessionJwt';

const URL_ = 'https://abcdefghijklmnop.supabase.co';
const KEY = 'sb-abcdefghijklmnop-auth-token';

const b64url = (s: string) => stringToBase64URL(s);
function jwt(payload: object) {
  return `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(payload))}.sig`;
}
function sessionCookieValue(payload: object, encoding: 'base64' | 'raw' = 'base64') {
  const json = JSON.stringify({ access_token: jwt(payload), refresh_token: 'r', expires_at: 0 });
  return encoding === 'base64' ? `base64-${b64url(json)}` : json;
}
const jar = (cookies: Record<string, string>) => (name: string) => cookies[name] ?? null;

describe('peekSessionJwt — 서명 미검증 sub/exp 읽기 (미리 시작 용도만)', () => {
  it('base64- 인코딩 단일 쿠키에서 sub·exp 를 읽는다', async () => {
    const v = sessionCookieValue({ sub: 'user-1', exp: 2000000000 });
    expect(await peekSessionJwt(jar({ [KEY]: v }), URL_)).toEqual({ sub: 'user-1', exp: 2000000000 });
  });

  it('원문 JSON 쿠키도 읽는다', async () => {
    const v = sessionCookieValue({ sub: 'user-2', exp: 1 }, 'raw');
    expect(await peekSessionJwt(jar({ [KEY]: v }), URL_)).toEqual({ sub: 'user-2', exp: 1 });
  });

  it('청크(.0, .1 …)로 나뉜 쿠키를 합쳐 읽는다', async () => {
    const big = sessionCookieValue({ sub: 'user-3', exp: 42, pad: 'x'.repeat(6000) });
    const chunks = createChunks(KEY, big);
    expect(chunks.length).toBeGreaterThan(1);
    const cookies = Object.fromEntries(chunks.map(c => [c.name, c.value]));
    expect(await peekSessionJwt(jar(cookies), URL_)).toEqual({ sub: 'user-3', exp: 42 });
  });

  it('다른 프로젝트 ref 쿠키는 무시한다', async () => {
    const v = sessionCookieValue({ sub: 'user-4', exp: 1 });
    expect(await peekSessionJwt(jar({ 'sb-otherproject-auth-token': v }), URL_)).toBeNull();
  });

  it.each([
    ['쿠키 없음', {}],
    ['깨진 base64', { [KEY]: 'base64-%%%notbase64' }],
    ['JSON 아님', { [KEY]: 'not-json' }],
    ['access_token 없음', { [KEY]: `base64-${b64url(JSON.stringify({ refresh_token: 'r' }))}` }],
    ['JWT 형식 아님', { [KEY]: `base64-${b64url(JSON.stringify({ access_token: 'abc' }))}` }],
    ['sub 누락', { [KEY]: sessionCookieValue({ exp: 1 }) }],
    ['exp 문자열', { [KEY]: sessionCookieValue({ sub: 'u', exp: '1' }) }],
  ])('%s → null (throw 하지 않음)', async (_label, cookies) => {
    expect(await peekSessionJwt(jar(cookies as Record<string, string>), URL_)).toBeNull();
  });

  it('잘못된 supabase URL → null', async () => {
    expect(await peekSessionJwt(jar({}), 'not a url')).toBeNull();
  });
});
