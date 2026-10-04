import type { AuthError, Session, SupabaseClient } from '@supabase/supabase-js';

/**
 * 이메일 링크(가입 인증·비밀번호 재설정)로 열린 탭의 세션 확립 — auth/verify ↔
 * auth/reset-password-verify 에 복제돼 있던 흐름 1벌 (2026-10-04 PAU-16).
 *
 * 순서는 추출 전과 동일:
 *  1) getSession() — Supabase 가 URL 토큰을 자동 처리한 세션. 에러면 'Session error:' 로그 후 error.
 *  2) 세션(user 포함)이 있으면 그 세션으로 성공.
 *  3) 없으면 *getSession 이후* URL hash 의 access_token·refresh_token(+재설정은 type=recovery)으로
 *     setSession — 에러면 error, 성공이면 응답 세션(null 일 수 있음)으로 성공.
 *  4) hash 토큰이 없으면(또는 recovery 아님) missing.
 * 성공 후 동작(이벤트 송신·이동)과 실패 문구는 화면마다 달라 호출처가 처리한다.
 */
export type EmailLinkSessionResult =
  | { kind: 'session'; session: Session | null }
  | { kind: 'error'; error: AuthError }
  | { kind: 'missing' };

export async function resolveEmailLinkSession(
  auth: Pick<SupabaseClient['auth'], 'getSession' | 'setSession'>,
  /** getSession 뒤에 읽는다(원본 순서 — Supabase 가 처리하며 hash 를 지울 수 있음) */
  readHash: () => string,
  { requireRecoveryType }: { requireRecoveryType: boolean },
): Promise<EmailLinkSessionResult> {
  const { data: { session }, error } = await auth.getSession();

  if (error) {
    console.error('Session error:', error);
    return { kind: 'error', error };
  }

  if (session?.user) {
    return { kind: 'session', session };
  }

  // 세션이 없으면 URL hash 에서 토큰 처리 시도
  const hashParams = new URLSearchParams(readHash().substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const typeOk = !requireRecoveryType || hashParams.get('type') === 'recovery';

  if (!(accessToken && refreshToken && typeOk)) {
    return { kind: 'missing' };
  }

  const { data, error: setSessionError } = await auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (setSessionError) {
    return { kind: 'error', error: setSessionError };
  }

  return { kind: 'session', session: data.session };
}
