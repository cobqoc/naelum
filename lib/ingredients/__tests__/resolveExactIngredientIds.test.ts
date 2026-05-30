import { describe, it, expect } from 'vitest'
import { resolveExactIngredientIds } from '@/lib/ingredients/resolveIngredientId'

// 승인 마스터 mock — 정확일치/별칭/공백무시 해석 검증용.
const MASTER = [
  { id: 'id-마늘', name: '마늘', aliases: ['통마늘', 'garlic'] },
  { id: 'id-다진마늘', name: '다진마늘', aliases: null },
  { id: 'id-후추', name: '후추', aliases: ['후춧가루', 'pepper'] },
  { id: 'id-소금', name: '소금', aliases: ['salt'] },
]

// 최소 supabase 스텁: from(...).select(...).eq('status','approved') → { data }
function fakeSupabase(rows: typeof MASTER) {
  const thenable = {
    eq: () => Promise.resolve({ data: rows }),
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { from: () => ({ select: () => thenable }) } as any
}

describe('resolveExactIngredientIds', () => {
  it('정확 이름 일치', async () => {
    const r = await resolveExactIngredientIds(['마늘', '소금'], fakeSupabase(MASTER))
    expect(r.get('마늘')).toBe('id-마늘')
    expect(r.get('소금')).toBe('id-소금')
  })

  it('큐레이션 별칭 일치 (통마늘→마늘, 후춧가루→후추)', async () => {
    const r = await resolveExactIngredientIds(['통마늘', '후춧가루'], fakeSupabase(MASTER))
    expect(r.get('통마늘')).toBe('id-마늘')
    expect(r.get('후춧가루')).toBe('id-후추')
  })

  it('공백 무시 정확 일치 (다진 마늘 → 다진마늘, 마늘 아님)', async () => {
    const r = await resolveExactIngredientIds(['다진 마늘'], fakeSupabase(MASTER))
    expect(r.get('다진 마늘')).toBe('id-다진마늘')
  })

  it('영어 별칭 대소문자 무시', async () => {
    const r = await resolveExactIngredientIds(['Garlic'], fakeSupabase(MASTER))
    expect(r.get('Garlic')).toBe('id-마늘')
  })

  it('사전에 없는 이름은 Map 에서 제외 (추측 안 함)', async () => {
    const r = await resolveExactIngredientIds(['베이컨', '모짜렐라치즈'], fakeSupabase(MASTER))
    expect(r.has('베이컨')).toBe(false)
    expect(r.has('모짜렐라치즈')).toBe(false)
  })

  it('접두사 분리는 하지 않는다 (볶은마늘 ≠ 마늘)', async () => {
    const r = await resolveExactIngredientIds(['볶은마늘'], fakeSupabase(MASTER))
    expect(r.has('볶은마늘')).toBe(false)
  })

  it('빈 입력 → 빈 Map', async () => {
    const r = await resolveExactIngredientIds(['', '  '], fakeSupabase(MASTER))
    expect(r.size).toBe(0)
  })
})
