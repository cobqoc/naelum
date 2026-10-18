import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveEmailLinkSession } from '../emailLinkSession';

type Auth = Parameters<typeof resolveEmailLinkSession>[0];

/** getSession/setSession 가짜 + 호출 순서 기록 */
function fakeAuth(opts: {
  session?: unknown;
  getSessionError?: unknown;
  setSessionData?: unknown;
  setSessionError?: unknown;
}) {
  const calls: string[] = [];
  const auth = {
    getSession: async () => {
      calls.push('getSession');
      return { data: { session: opts.session ?? null }, error: opts.getSessionError ?? null };
    },
    setSession: async (args: { access_token: string; refresh_token: string }) => {
      calls.push(`setSession ${args.access_token} ${args.refresh_token}`);
      return { data: { session: opts.setSessionData ?? null, user: null }, error: opts.setSessionError ?? null };
    },
  } as unknown as Auth;
  return { auth, calls };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('resolveEmailLinkSession — verify ↔ reset-password-verify 공용 흐름', () => {
  it('getSession 세션(user 있음) → 그 세션으로 성공, hash 는 읽지 않음', async () => {
    const session = { user: { id: 'u' }, access_token: 'A', refresh_token: 'R' };
    const { auth, calls } = fakeAuth({ session });
    const readHash = vi.fn(() => '#access_token=x&refresh_token=y');
    const r = await resolveEmailLinkSession(auth, readHash, { requireRecoveryType: false });
    expect(r).toEqual({ kind: 'session', session });
    expect(calls).toEqual(['getSession']);
    expect(readHash).not.toHaveBeenCalled();
  });

  it('getSession 에러 → error + "Session error:" 로그(원본과 동일)', async () => {
    const err = { message: 'Invalid token' };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { auth } = fakeAuth({ getSessionError: err });
    const r = await resolveEmailLinkSession(auth, () => '', { requireRecoveryType: false });
    expect(r).toEqual({ kind: 'error', error: err });
    expect(spy).toHaveBeenCalledWith('Session error:', err);
  });

  it('세션은 있으나 user 없음 → hash 경로로 진행(원본의 session?.user 조건)', async () => {
    const { auth, calls } = fakeAuth({ session: { user: null }, setSessionData: { user: { id: 'u2' } } });
    const r = await resolveEmailLinkSession(auth, () => '#access_token=a&refresh_token=b', { requireRecoveryType: false });
    expect(r).toEqual({ kind: 'session', session: { user: { id: 'u2' } } });
    expect(calls).toEqual(['getSession', 'setSession a b']);
  });

  it('hash 는 getSession *이후* 읽는다(Supabase 가 처리하며 hash 를 지울 수 있음)', async () => {
    const { auth, calls } = fakeAuth({});
    const readHash = vi.fn(() => { calls.push('readHash'); return ''; });
    await resolveEmailLinkSession(auth, readHash, { requireRecoveryType: false });
    expect(calls).toEqual(['getSession', 'readHash']);
  });

  it('가입 인증: type 무관하게 토큰 둘 다 있으면 setSession → 응답 세션(null 가능)으로 성공', async () => {
    const { auth, calls } = fakeAuth({});
    const r = await resolveEmailLinkSession(auth, () => '#access_token=a&refresh_token=b&type=signup', { requireRecoveryType: false });
    expect(r).toEqual({ kind: 'session', session: null });
    expect(calls).toEqual(['getSession', 'setSession a b']);
  });

  it('재설정: type=recovery 아니면 missing(setSession 안 함), recovery 면 성공', async () => {
    const a = fakeAuth({});
    expect(await resolveEmailLinkSession(a.auth, () => '#access_token=a&refresh_token=b&type=signup', { requireRecoveryType: true }))
      .toEqual({ kind: 'missing' });
    expect(a.calls).toEqual(['getSession']);
    const b = fakeAuth({ setSessionData: { user: { id: 'u' } } });
    expect(await resolveEmailLinkSession(b.auth, () => '#access_token=a&refresh_token=b&type=recovery', { requireRecoveryType: true }))
      .toEqual({ kind: 'session', session: { user: { id: 'u' } } });
  });

  it('토큰 하나라도 없으면 missing', async () => {
    for (const h of ['', '#', '#access_token=a', '#refresh_token=b', '#access_token=&refresh_token=b']) {
      const { auth, calls } = fakeAuth({});
      expect(await resolveEmailLinkSession(auth, () => h, { requireRecoveryType: false })).toEqual({ kind: 'missing' });
      expect(calls).toEqual(['getSession']);
    }
  });

  it('setSession 에러 → error (로그 없음 — 원본과 동일)', async () => {
    const err = { message: 'Token has expired' };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { auth } = fakeAuth({ setSessionError: err });
    const r = await resolveEmailLinkSession(auth, () => '#access_token=a&refresh_token=b', { requireRecoveryType: false });
    expect(r).toEqual({ kind: 'error', error: err });
    expect(spy).not.toHaveBeenCalled();
  });

  it('getSession 예외는 그대로 전파(호출처 catch 가 verifyError 처리)', async () => {
    const auth = { getSession: async () => { throw new Error('boom'); }, setSession: async () => ({}) } as unknown as Auth;
    await expect(resolveEmailLinkSession(auth, () => '', { requireRecoveryType: false })).rejects.toThrow('boom');
  });
});
