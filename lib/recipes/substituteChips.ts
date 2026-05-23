/**
 * SubstituteChipInput 의 순수 로직 — vitest 가능하도록 컴포넌트에서 분리.
 *
 * 정책:
 *  - 빈 입력(공백만) → 무변경
 *  - 양끝 trim
 *  - 대소문자 무시 dedup (입력 원형은 보존; 기존이 우선)
 */

export function addSubstituteChip(current: string[], raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return current;
  const lower = trimmed.toLowerCase();
  const exists = current.some(v => v.toLowerCase() === lower);
  if (exists) return current;
  return [...current, trimmed];
}

export function removeSubstituteChipAt(current: string[], index: number): string[] {
  if (index < 0 || index >= current.length) return current;
  return current.filter((_, i) => i !== index);
}
