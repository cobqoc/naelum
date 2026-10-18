// GET /api/favorites 로더 — 동시 in-flight 요청 공유(dedupe)만 한다. 결과 캐시 없음.
// Header·BottomNav 의 ShoppingCartDropdown 이 같은 commit 에서 useFavorites(20) 을 두 번 reload 하던 것을
// HTTP 1회로 합친다(perf 2026-09-27). 정착 즉시 해제되므로 다음 reload 는 오늘과 같이 새 요청.
// 키 = userId:limit — 다른 사용자(크로스탭 SIGNED_IN)·다른 limit 은 절대 섞이지 않는다.
// 클라이언트 전용: useEffect 안에서만 호출할 것. 렌더/SSR 중 호출 금지(모듈 Map 은 서버에서 요청 간 공유됨).

export interface FavoriteItem {
  ingredient_name: string;
  category: string | null;
  score: number;
  last_added_at: string;
  emoji: string | null;
}

const inflight = new Map<string, Promise<FavoriteItem[] | null>>();

/** 성공 → items 배열(비배열이면 []). !ok 또는 throw → null (호출자는 오늘처럼 기존 items 유지). 절대 reject 하지 않음. */
export function loadFavorites(userId: string, limit: number): Promise<FavoriteItem[] | null> {
  const key = `${userId}:${limit}`;
  const existing = inflight.get(key);
  if (existing) return existing;

  const p = (async (): Promise<FavoriteItem[] | null> => {
    try {
      const res = await fetch(`/api/favorites?limit=${limit}`);
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data.items) ? (data.items as FavoriteItem[]) : [];
    } catch {
      return null;
    }
  })();
  inflight.set(key, p);
  // 정착 즉시 해제. 생성 직후 등록하므로 소비자의 .then 보다 먼저 실행 → 정착된 p 가 재사용되는 창이 없다.
  const release = () => {
    if (inflight.get(key) === p) inflight.delete(key);
  };
  p.then(release, release);
  return p;
}

/** vitest 전용 — 테스트 간 격리 */
export function _resetInflightForTests(): void {
  inflight.clear();
}
