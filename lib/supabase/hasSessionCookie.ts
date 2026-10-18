/**
 * 브라우저에서 Supabase 세션 쿠키(`sb-<ref>-auth-token*`) 존재 여부를 동기적으로 판정한다.
 *
 * proxy.ts 의 `hasSessionCookie` 와 *같은 기준* — 서버는 이 쿠키가 없으면 Supabase 를 호출하지 않고
 * 인증 필요 API 는 401 로 끝난다. 클라이언트도 같은 기준으로 "결과가 정해진 요청"을 생략할 수 있다
 * (예: 비로그인 방문자의 쿠키동의 DB 동기화·검색 히스토리 조회 — 서버 응답이 항상 no-op 이었음).
 * @supabase/ssr 은 이 쿠키를 JS 가 읽을 수 있게 저장한다(DEFAULT_COOKIE_OPTIONS.httpOnly=false;
 * lib/supabase/client.ts 가 document.cookie 로 읽음). 판정만 하고 값은 읽지 않는다. (perf 2026-09-27)
 */
export function hasSupabaseSessionCookie(): boolean {
  if (typeof document === 'undefined') return false
  let raw: string
  try {
    raw = document.cookie
  } catch {
    // opaque-origin sandboxed iframe 등에서는 document.cookie getter 가 SecurityError 를 던진다.
    // 그런 컨텍스트에선 fetch 도 쿠키를 못 실어 서버 응답이 항상 no-op → false 가 등가.
    return false
  }
  return raw.split(';').some((c) => {
    const name = c.trim().split('=')[0] ?? ''
    return name.startsWith('sb-') && name.includes('-auth-token')
  })
}
