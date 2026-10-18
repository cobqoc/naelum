/**
 * 관리자 행동 분석(events) 집계 — 순수 함수 (perf 2026-09-28).
 * 이전엔 /api/admin/analytics/events 가 최대 10,000행 원본(ua·viewport_h·id 포함)을 브라우저로 보내고
 * 페이지가 아래 네 집계를 했다. 같은 코드를 서버에서 같은 행(같은 필터·정렬·10k 상한)에 실행해
 * 요약(~1KB)만 보낸다 → 화면의 모든 숫자·차트는 동일. SQL GROUP BY 로 바꾸지 않는 이유: 10k 상한을
 * 넘는 행까지 세게 되어 숫자가 달라진다.
 */
export interface EventRow {
  event_type: string;
  page: string | null;
  payload: Record<string, unknown> | null;
  viewport_w: number | null;
  user_id: string | null;
  session_id: string;
  created_at: string;
}

function deviceCategory(w: number | null): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (!w) return 'unknown';
  if (w < 768) return 'mobile';
  if (w < 1280) return 'tablet';
  return 'desktop';
}

/** 일별 페이지뷰 추이 */
export function dailyPageViews(events: EventRow[]) {
  const byDay = new Map<string, number>();
  for (const e of events) {
    if (e.event_type !== 'page_view') continue;
    const day = e.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  return Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date: date.slice(5), count }));
}

/** Top events */
export function topEvents(events: EventRow[]) {
  const byType = new Map<string, number>();
  for (const e of events) byType.set(e.event_type, (byType.get(e.event_type) ?? 0) + 1);
  return Array.from(byType.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }));
}

/** Top pages */
export function topPages(events: EventRow[]) {
  const byPage = new Map<string, number>();
  for (const e of events) {
    if (e.event_type !== 'page_view' || !e.page) continue;
    byPage.set(e.page, (byPage.get(e.page) ?? 0) + 1);
  }
  return Array.from(byPage.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));
}

/** 디바이스 분포 + 보류 이슈 카드 데이터 */
export function eventStats(events: EventRow[]) {
  const dev = { mobile: 0, tablet: 0, desktop: 0, unknown: 0 };
  const uniqueSessions = new Set<string>();
  const uniqueUsers = new Set<string>();
  let pageViews = 0;
  let pendantClicks = 0;
  let bannerClicks = 0;
  let fabClicks = 0;
  let emptyCta = 0;
  let recipePill = 0;
  let recipePillModeReady = 0;
  let recipePillModeAlmost = 0;
  let recipePillModeAll = 0;
  let bottomNavSearch = 0;
  let overlayPillRecipes = 0;
  let overlayPillTips = 0;
  let ingredientAdd = 0;
  let ingredientDelete = 0;

  for (const e of events) {
    dev[deviceCategory(e.viewport_w)]++;
    uniqueSessions.add(e.session_id);
    if (e.user_id) uniqueUsers.add(e.user_id);
    if (e.event_type === 'page_view') pageViews++;
    else if (e.event_type === 'pendant_click') pendantClicks++;
    else if (e.event_type === 'expiring_banner_click') bannerClicks++;
    else if (e.event_type === 'fab_add_click') fabClicks++;
    else if (e.event_type === 'empty_cta_click') emptyCta++;
    else if (e.event_type === 'recipe_pill_click') {
      recipePill++;
      const m = e.payload?.mode;
      if (m === 'ready') recipePillModeReady++;
      else if (m === 'almost') recipePillModeAlmost++;
      else if (m === 'all') recipePillModeAll++;
    }
    else if (e.event_type === 'bottomnav_search_click') bottomNavSearch++;
    else if (e.event_type === 'search_overlay_pill_click') {
      if (e.payload?.pill === 'recipes') overlayPillRecipes++;
      else if (e.payload?.pill === 'tips') overlayPillTips++;
    }
    else if (e.event_type === 'ingredient_add') ingredientAdd++;
    else if (e.event_type === 'ingredient_delete') ingredientDelete++;
  }
  return {
    dev, uniqueSessions: uniqueSessions.size, uniqueUsers: uniqueUsers.size,
    pageViews, pendantClicks, bannerClicks, fabClicks, emptyCta,
    recipePill, recipePillModeReady, recipePillModeAlmost, recipePillModeAll,
    bottomNavSearch, overlayPillRecipes, overlayPillTips,
    ingredientAdd, ingredientDelete,
  };
}

export type EventStats = ReturnType<typeof eventStats>;
