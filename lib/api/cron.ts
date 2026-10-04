/**
 * Vercel Cron 요청 인증 — `Authorization: Bearer <CRON_SECRET>` 일 때만 true. (2026-10-04 AG2-16)
 *
 * CRON_SECRET 이 비어 있으면(미설정·빈 문자열) 항상 false. 이전 비교식
 * `authHeader !== \`Bearer ${process.env.CRON_SECRET}\`` 은 미설정 환경에서 `Bearer undefined` 헤더를
 * 통과시켜 누구나 크론(유통기한 OS 푸시 발송 등)을 돌릴 수 있었다. 시크릿이 설정된 정상 경로는 동일.
 */
export function isAuthorizedCronRequest(
  headers: Headers,
  secret: string | undefined = process.env.CRON_SECRET,
): boolean {
  if (!secret) return false;
  return headers.get('authorization') === `Bearer ${secret}`;
}
