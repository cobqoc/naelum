'use client'

// 장보기 리스트 공유 캐시 — useCartCount와 ShoppingCartDropdown이 동일한 데이터를 공유.
// 이전: useCartCount와 dropdown이 각자 /api/shopping-list를 fetch → dropdown 클릭 시 수 초 대기.
// 이후: 첫 렌더 시 한 번 fetch → 모든 consumer가 즉시 캐시에서 읽음 → dropdown 즉시 열림.

export interface ShoppingItem {
  id: string
  ingredient_name: string
  category: string
  quantity: number | null
  unit: string | null
  recipe_id: string | null
  recipe_title: string | null
  is_checked: boolean
  is_owned: boolean
}

type Subscriber = (items: ShoppingItem[] | null) => void

let cachedItems: ShoppingItem[] | null = null
let inflightFetch: Promise<ShoppingItem[]> | null = null
const subscribers = new Set<Subscriber>()

function notifySubscribers() {
  subscribers.forEach((cb) => cb(cachedItems))
}

export function getCachedShoppingList(): ShoppingItem[] | null {
  return cachedItems
}

export function setCachedShoppingList(items: ShoppingItem[]): void {
  cachedItems = items
  notifySubscribers()
}

export function invalidateShoppingListCache(): void {
  cachedItems = null
  inflightFetch = null
}

export async function loadShoppingList(force = false): Promise<ShoppingItem[]> {
  // 강제가 아니면 캐시 사용
  if (!force && cachedItems) return cachedItems
  // 이미 진행 중인 fetch가 있으면 공유
  if (inflightFetch) return inflightFetch

  inflightFetch = (async () => {
    try {
      const res = await fetch('/api/shopping-list')
      if (res.ok) {
        const data = await res.json()
        cachedItems = data.items || []
        notifySubscribers()
      }
    } catch {
      // silent
    } finally {
      inflightFetch = null
    }
    return cachedItems ?? []
  })()

  return inflightFetch
}

export function subscribeShoppingList(cb: Subscriber): () => void {
  subscribers.add(cb)
  return () => {
    subscribers.delete(cb)
  }
}
