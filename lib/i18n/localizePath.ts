import { SUPPORTED_LANGUAGES, type Language } from './locales';

/**
 * 현재 경로의 첫 세그먼트([lang])를 새 언어로 교체하고 query·hash 를 보존한다.
 *
 * 언어 스위처가 `[lang]` 경로로 이동해 서버가 메타데이터(<title>)·콘텐츠를 새 언어로 재렌더하게
 * 하는 용도. `usePathname()` 은 query 를 포함하지 않으므로 search/hash 를 따로 받아 붙인다
 * (안 붙이면 언어 전환 시 필터·검색어가 날아간다 — 2026-06-03 회귀).
 *
 * @returns 이동할 경로(+query+hash), 또는 null(첫 세그먼트가 지원 언어가 아닌 예외 경로 → 이동 안 함)
 */
export function swapLangSegment(
  pathname: string,
  searchAndHash: string,
  code: Language,
): string | null {
  const segs = (pathname || '/').split('/');
  if (!segs[1] || !SUPPORTED_LANGUAGES.includes(segs[1] as Language)) return null;
  segs[1] = code;
  return (segs.join('/') || '/') + (searchAndHash || '');
}
