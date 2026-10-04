/**
 * 로그인 후 이동할 `?redirect=` 값 검증 — *같은 출처의 경로*만 허용한다.
 *
 * 2026-10-04 (AG2-48 open redirect): 옛 검증 `startsWith('/') && !startsWith('//')` 는
 * `/\evil.com` 을 통과시켰다. WHATWG URL 은 http(s) 에서 `\` 를 `/` 로 취급하고 탭·개행을
 * 지워 버리므로 `/\evil.com`·`/\t/evil.com` 이 `//evil.com`(프로토콜-상대) 으로 해석돼
 * 외부 사이트로 이동했다. 두 번째 문자 검사 + 실제 URL 해석 결과의 origin 비교로 막는다.
 *
 * 정상 내부 경로(`/ko/tip/new`, `/recipes/new?x=1` 등)는 입력 문자열을 *그대로* 돌려주므로
 * 이동 위치가 기존과 같다. 거부되면 fallback('/').
 *
 * @param raw     검증할 값(보통 searchParams.get('redirect'))
 * @param origin  현재 출처(브라우저에선 window.location.origin)
 */
export function safeRedirectPath(
  raw: string | null | undefined,
  origin: string,
  fallback = '/',
): string {
  if (!raw) return fallback;
  // 경로('/...')만 허용 — 'https://…'·'javascript:…'·상대경로 거부
  if (!raw.startsWith('/')) return fallback;
  // '//evil.com'(프로토콜-상대)·'/\evil.com'(브라우저가 '//' 로 해석) 거부
  if (raw[1] === '/' || raw[1] === '\\') return fallback;
  // 최종 방어: 실제 URL 해석 결과가 같은 출처여야 한다(탭·개행 제거 후 '//' 가 되는 변형 등)
  try {
    if (new URL(raw, origin).origin !== new URL(origin).origin) return fallback;
  } catch {
    return fallback;
  }
  return raw;
}
