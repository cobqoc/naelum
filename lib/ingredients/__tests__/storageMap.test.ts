import { describe, it, expect } from 'vitest'
import { lookupStorageByName, inferStorageLocation } from '../storageMap'

describe('storageMap (ICL-19)', () => {
  it('1글자 키 부분일치로 오분류하지 않는다', () => {
    expect(lookupStorageByName('갓김치')).toBe('냉장')
    expect(lookupStorageByName('알배추')).toBe('냉장')
    expect(lookupStorageByName('미니파프리카')).toBe('냉장')
  })

  it('중복 키는 냉장 쪽으로', () => {
    expect(lookupStorageByName('참치')).toBe('냉장')
    expect(lookupStorageByName('참치캔')).toBe('상온')
    expect(lookupStorageByName('메이플시럽')).toBe('냉장')
  })

  it('정확 일치·부분 포함 기존 동작', () => {
    expect(lookupStorageByName('파')).toBe('상온')
    expect(lookupStorageByName('김')).toBe('상온')
    expect(lookupStorageByName('다진마늘')).toBe('냉장')
    expect(lookupStorageByName('냉동만두')).toBe('냉동')
    expect(lookupStorageByName('알 수 없는 것')).toBeNull()
  })

  it('현행 카테고리 fallback', () => {
    expect(inferStorageLocation('무명재료', 'egg')).toBe('냉장')
    expect(inferStorageLocation('무명재료', 'fermented')).toBe('냉장')
    expect(inferStorageLocation('무명재료', 'nuts')).toBe('상온')
    expect(inferStorageLocation('무명재료', null)).toBe('상온')
  })
})
