/**
 * 레시피 `video_url` 쓰기 규칙 — 본인이 recipe-videos 버킷에 올린 영상의 공개 URL 만 받는다.
 *
 * 2026-10-20: KMP 앱은 영상을 올린 뒤 그 공개 URL 을 `video_url` 로 보내는데, H1 화이트리스트
 * (`EDITABLE_RECIPE_COLUMNS`)에 없어 6월부터 조용히 버려지고 있었다. 웹은 이 값을 링크(href)로
 * 렌더하므로 아무 URL 이나 받으면 레시피 페이지에 임의 외부 링크를 심을 수 있다 → 본인 폴더 영상만 허용.
 *
 * - 키가 없으면 변경 없음 (`{}`)
 * - `null`/빈 문자열이면 영상 제거 (`{ video_url: null }`)
 * - `{본인 폴더 공개 URL 접두사}{파일명}` 이면 저장
 * - 그 밖(외부 URL·남의 폴더 등)은 다른 비화이트리스트 컬럼처럼 무시 — 앱 수정 화면은 기존 값을
 *   통째로 다시 보내므로(운영진이 넣은 YouTube 출처 등) 400 으로 막으면 수정 자체가 깨진다.
 */
export function pickOwnVideoUrl(
  body: Record<string, unknown>,
  ownVideoPrefix: string,
): { video_url?: string | null } {
  if (!('video_url' in body)) return {};
  const v = body.video_url;
  if (v === null || v === '') return { video_url: null };
  if (typeof v !== 'string' || !v.startsWith(ownVideoPrefix)) return {};
  // 접두사 뒤는 파일명 하나만 — 경로 이동·쿼리 붙이기 차단
  return /^[\w-]+\.(mp4|mov|webm)$/.test(v.slice(ownVideoPrefix.length)) ? { video_url: v } : {};
}
