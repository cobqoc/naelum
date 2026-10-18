import type { ShoppingItem } from '@/lib/shopping-list/cache'

/**
 * 장보기 옵티미스틱 삭제 되돌리기 — 순수 함수 (PAU-46, 2026-10-04).
 *
 * 삭제(단건·전체 비우기·완료 항목 비우기)를 화면에 먼저 반영했다가 서버 요청이 실패하면, 지웠던 항목들을
 * `prev`(삭제 직전 목록)의 원래 자리로 `current` 에 다시 끼운다. 그 사이 `current` 에 생긴 다른 변경
 * (다른 항목의 체크·수량·새로 추가된 항목)은 그대로 유지하고, 이미 있는 항목은 중복으로 넣지 않는다.
 *
 * @param current    지금 목록(삭제가 반영된 뒤 다른 변경이 있었을 수 있음)
 * @param prev       삭제 직전 목록 — 순서 기준
 * @param removedIds 이번 삭제로 지운 id 들
 */
export function restoreRemoved(
  current: ShoppingItem[],
  prev: ShoppingItem[],
  removedIds: ReadonlySet<string>,
): ShoppingItem[] {
  const currentById = new Map(current.map(i => [i.id, i]))
  const missing = prev.some(p => removedIds.has(p.id) && !currentById.has(p.id))
  if (!missing) return current

  const prevIds = new Set(prev.map(p => p.id))
  const merged: ShoppingItem[] = []
  for (const p of prev) {
    const cur = currentById.get(p.id)
    if (cur) merged.push(cur) // 남아 있던 항목 — 현재 값(그 사이 변경) 우선
    else if (removedIds.has(p.id)) merged.push(p) // 이번에 지웠던 항목 — 원래 자리로 복원
    // 그 외(이번 삭제와 무관하게 사라진 항목)는 되살리지 않음
  }
  for (const c of current) if (!prevIds.has(c.id)) merged.push(c) // 그 사이 새로 생긴 항목
  return merged
}
