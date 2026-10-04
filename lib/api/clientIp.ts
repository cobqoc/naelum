/**
 * 요청자 IP — rate limit 키 등에 쓰는 단일 출처.
 *
 * naelum.app 은 Cloudflare 뒤에 있으므로 `CF-Connecting-IP`(실제 접속자)를 우선하고, 없으면(로컬·Vercel
 * 직접 접속) `X-Forwarded-For` 의 첫 값을 쓴다. CLAUDE.md "Cloudflare IP: CF-Connecting-IP 헤더 우선 사용".
 *
 * 이전엔 라우트 21곳이 같은 식을 각자 복붙했고, 문의·저작권 신고 2곳은 CF 헤더를 빠뜨려 Cloudflare
 * 엣지 IP 단위로 rate limit 이 묶였다(무관한 사용자들이 시간당 5회를 공유, 2026-10-04 수정).
 *
 * @param realIpFallback signin·signup 처럼 `X-Real-IP` 까지 보던 라우트용(기존 동작 그대로).
 */
export function getClientIp(
  headers: Pick<Headers, 'get'>,
  { realIpFallback = false }: { realIpFallback?: boolean } = {},
): string {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    (realIpFallback ? headers.get('x-real-ip') : null) ||
    'unknown'
  );
}
