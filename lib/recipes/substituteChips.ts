/**
 * SubstituteChipInput 의 순수 로직 — vitest 가능하도록 컴포넌트에서 분리.
 *
 * 데이터 모델:
 *  - 기존: string[] (예: ['멸치 다시다', '가쓰오부시'])
 *  - 신규: SubstituteEntry[] = { name; note? }[] — note 는 *대체 수량/단위* 자유 텍스트
 *    (예: [{ name: '멸치 다시다', note: '1큰술' }])
 *
 * DB(jsonb)·legacy 데이터·새 데이터 양쪽 처리:
 *  - `normalizeSubstitutes`: 읽기 boundary 에서 어느 형식이든 SubstituteEntry[] 로 정규화
 *  - 저장은 항상 SubstituteEntry[] 객체 형태로 (jsonb 그대로 보존)
 *
 * 정책:
 *  - 빈 이름(공백만) → 무변경/제외
 *  - 양끝 trim
 *  - 대소문자 무시 dedup (입력 원형은 보존; 기존이 우선)
 *  - note 없으면 `{ name }` (note 키 자체 미존재) → 비어있을 때 jsonb 깔끔
 */

export type SubstituteEntry = { name: string; note?: string };

/** DB·legacy·신규 데이터 어느 형식이든 SubstituteEntry[] 로 정규화. */
export function normalizeSubstitutes(raw: unknown): SubstituteEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: SubstituteEntry[] = [];
  for (const v of raw) {
    if (typeof v === 'string') {
      const t = v.trim();
      if (t) out.push({ name: t });
    } else if (v && typeof v === 'object' && 'name' in v) {
      const obj = v as { name?: unknown; note?: unknown };
      const name = typeof obj.name === 'string' ? obj.name.trim() : '';
      if (!name) continue;
      const note = typeof obj.note === 'string' ? obj.note.trim() : '';
      out.push(note ? { name, note } : { name });
    }
  }
  return out;
}

export function addSubstituteChip(current: SubstituteEntry[], rawName: string): SubstituteEntry[] {
  const trimmed = rawName.trim();
  if (!trimmed) return current;
  const lower = trimmed.toLowerCase();
  const exists = current.some(v => v.name.toLowerCase() === lower);
  if (exists) return current;
  return [...current, { name: trimmed }];
}

export function removeSubstituteChipAt(current: SubstituteEntry[], index: number): SubstituteEntry[] {
  if (index < 0 || index >= current.length) return current;
  return current.filter((_, i) => i !== index);
}

/** chip 의 note 갱신. 빈 문자열이면 note 키 제거(객체 깔끔 유지). */
export function updateSubstituteNote(current: SubstituteEntry[], index: number, note: string): SubstituteEntry[] {
  if (index < 0 || index >= current.length) return current;
  const trimmed = note.trim();
  return current.map((entry, i) => {
    if (i !== index) return entry;
    return trimmed ? { ...entry, note: trimmed } : { name: entry.name };
  });
}
