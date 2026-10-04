import { describe, it, expect } from 'vitest'
import { restoreRemoved } from '@/lib/shopping-list/optimistic'
import type { ShoppingItem } from '@/lib/shopping-list/cache'

function item(id: string, partial: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id, ingredient_name: id, category: 'veggie', quantity: 1, unit: null, recipe_id: null, recipe_title: null,
    is_checked: false, is_owned: false, note: null, emoji: null, ...partial,
  }
}

describe('restoreRemoved (PAU-46)', () => {
  const a = item('a'), b = item('b', { is_checked: true }), c = item('c'), d = item('d', { is_checked: true })
  const prev = [a, b, c, d]

  it('단건 삭제 실패 → 원래 자리로 복원', () => {
    const after = [a, c, d]
    expect(restoreRemoved(after, prev, new Set(['b']))).toEqual([a, b, c, d])
  })

  it('완료 항목 비우기 실패 → 체크 항목들 원래 자리로', () => {
    expect(restoreRemoved([a, c], prev, new Set(['b', 'd']))).toEqual([a, b, c, d])
  })

  it('전체 비우기 실패 → 전부 복원', () => {
    expect(restoreRemoved([], prev, new Set(prev.map(i => i.id)))).toEqual(prev)
  })

  it('그 사이 다른 항목 변경·새 항목은 유지', () => {
    const cChecked = { ...c, is_checked: true }
    const e = item('e')
    expect(restoreRemoved([a, cChecked, d, e], prev, new Set(['b']))).toEqual([a, b, cChecked, d, e])
  })

  it('이미 있으면(서버 새로고침 등) 그대로 — 중복 없음', () => {
    const cur = [a, b, c, d]
    expect(restoreRemoved(cur, prev, new Set(['b']))).toBe(cur)
  })

  it('이번 삭제와 무관하게 사라진 항목은 되살리지 않는다', () => {
    // c 는 다른 경로(다른 기기 등)로 사라졌고, 이번에 지운 건 b
    expect(restoreRemoved([a, d], prev, new Set(['b']))).toEqual([a, b, d])
  })
})
