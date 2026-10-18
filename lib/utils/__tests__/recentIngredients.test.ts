import { describe, it, expect, beforeEach, vi } from 'vitest'

// node 환경 — window·localStorage 최소 스텁
const store = new Map<string, string>()
vi.stubGlobal('window', {})
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
})

const { addRecentIngredient, getRecentIngredients } = await import('../recentIngredients')

const ing = (id: string) => ({ id, name: id, name_en: null, category: null })

describe('addRecentIngredient — 축출 (ICL-12)', () => {
  beforeEach(() => store.clear())

  it('가득 찬 목록에 새 재료를 고르면 새 재료는 남고, 가장 적게 쓴 기존 항목이 빠진다', () => {
    for (let i = 0; i < 10; i++) {
      addRecentIngredient(ing(`old${i}`))
      addRecentIngredient(ing(`old${i}`)) // 각 2회
    }
    addRecentIngredient(ing('old9')) // old9 3회 — 가장 덜 쓴 건 old0(2회, 가장 오래됨)
    addRecentIngredient(ing('rucola'))
    const ids = getRecentIngredients().map(i => i.id)
    expect(ids).toHaveLength(10)
    expect(ids).toContain('rucola')
    expect(ids).not.toContain('old0')
    expect(ids).toContain('old9')
  })
})
