import { combineChunks, stringFromBase64URL } from '@supabase/ssr';

/**
 * 요청의 Supabase 세션 쿠키에서 access_token JWT payload 의 `sub`·`exp` 를 *서명 검증 없이* 읽는다.
 *
 * 용도는 오직 "미리 시작"이다 (proxy.ts, perf 2026-09-27): 미들웨어가 getUser(Auth 왕복)로 사용자를 검증하는
 * 동안 온보딩/권한 게이트용 profiles 조회를 겹쳐 시작하고, 검증된 user.id 가 이 sub 와 같을 때만 그 결과를 쓴다.
 * 판정·권한 결정에는 절대 쓰지 않는다. 어떤 형식 오류든 null(=겹치기 안 함 → 기존 직렬 경로).
 *
 * 쿠키 형식(@supabase/ssr 0.8): 이름 `sb-<project-ref>-auth-token`(길면 `.0`, `.1` … 청크),
 * 값은 `base64-<base64url(JSON 세션)>` 또는 원문 JSON.
 */
export async function peekSessionJwt(
  getCookie: (name: string) => string | null | undefined,
  supabaseUrl: string,
): Promise<{ sub: string; exp: number } | null> {
  try {
    const ref = new URL(supabaseUrl).hostname.split('.')[0];
    const raw = await combineChunks(`sb-${ref}-auth-token`, async (name) => getCookie(name) ?? null);
    if (!raw) return null;
    const json = raw.startsWith('base64-') ? stringFromBase64URL(raw.slice('base64-'.length)) : raw;
    const token: unknown = JSON.parse(json)?.access_token;
    if (typeof token !== 'string') return null;
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const payload = JSON.parse(stringFromBase64URL(payloadPart));
    return typeof payload?.sub === 'string' && typeof payload?.exp === 'number'
      ? { sub: payload.sub, exp: payload.exp }
      : null;
  } catch {
    return null;
  }
}
