/**
 * 재료명 정규화 — 조리법 접두사 제거 + 별칭 통일
 *
 * 목적:
 *   "다진마늘" ↔ "마늘", "다진파" ↔ "대파" 처럼 같은 재료이지만 표기가 다른
 *   경우를 동일 재료로 처리하기 위해 정규화한다.
 *
 * 규칙:
 *   1. 조리법 접두사 제거 (남은 부분이 2자 이상일 때만 — "간장"의 "간" 오박리 방지)
 *   2. 표기 별칭 통일 (파 → 대파, 무우 → 무)
 *
 * 주의:
 *   - 재료 원문은 변경하지 않음 — 매칭·집계 시점에만 적용
 *   - "가루" 접미사 제거 금지 (고추 ≠ 고춧가루)
 *   - 쪽파는 대파로 변환하지 않음 (다른 재료)
 */

// 긴 패턴을 먼저 배치 — "잘게 썬"이 "잘게"보다 먼저 매칭되도록
const PREP_PREFIXES: string[] = [
  '잘게 썬',
  '채 썬',
  '채썬',
  '잘게',
  '굵게',
  '다진',
  '볶은',
  '구운',
  '삶은',
  '데친',
  '말린',
  '으깬',
  '냉동',
];

const ALIASES: Record<string, string> = {
  '파': '대파',
  '무우': '무',
};

export function normalizeIngredientName(name: string): string {
  let n = name.trim();

  for (const prefix of PREP_PREFIXES) {
    if (n.startsWith(prefix)) {
      const rest = n.slice(prefix.length).trim();
      // 남은 부분이 비어있으면 스킵 ("파" 같은 1자 재료는 허용)
      if (rest.length >= 1) {
        n = rest;
        break;
      }
    }
  }

  return ALIASES[n] ?? n;
}
