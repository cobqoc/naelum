/**
 * 부엌 도감 — 한글 초성 그룹화 (가나다순 뷰 + 카테고리 뷰 공용).
 *
 * KitchenAllClient(가나다순 전체)와 IngredientBrowseClient(카테고리 필터) 둘 다
 * 동일한 초성 그룹화를 쓴다 — 순수 로직이라 단일 출처로 추출 + vitest.
 *
 * 정렬: 한글 초성(ㄱ-ㅎ) → 영문(A-Z) → 기타(#). 그룹 내부는 이름 가나다순.
 */

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

/**
 * 이름의 첫 글자로 그룹 키 추출.
 * 한글 음절 → 초성(ㄱ…ㅎ), 영문 → 대문자(A-Z), 그 외 → '#'.
 */
export function getInitialGroup(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '#';
  const c = trimmed[0];
  const code = c.charCodeAt(0);
  // 한글 음절 (가-힣)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const idx = Math.floor((code - 0xac00) / 588);
    return CHO[idx] ?? '#';
  }
  if (/[a-zA-Z]/.test(c)) return c.toUpperCase();
  return '#';
}

/** 정렬 우선순위 — 한글(ㄱ-ㅎ) → 영문(A-Z) → 기타(#) */
export const GROUP_ORDER: string[] = [
  ...CHO,
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  '#',
];

export function groupSort(a: string, b: string): number {
  const ai = GROUP_ORDER.indexOf(a);
  const bi = GROUP_ORDER.indexOf(b);
  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
}

/**
 * 이름을 가진 항목 배열을 초성 그룹으로 묶고 정렬한다.
 * - 그룹 순서: GROUP_ORDER
 * - 그룹 내부: 이름 가나다순(localeCompare 'ko')
 */
export function groupByInitial<T extends { name: string }>(
  items: T[],
): { group: string; list: T[] }[] {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const g = getInitialGroup(item.name);
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(item);
  }
  return Array.from(grouped.entries())
    .map(([group, list]) => ({
      group,
      list: [...list].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    }))
    .sort((a, b) => groupSort(a.group, b.group));
}
