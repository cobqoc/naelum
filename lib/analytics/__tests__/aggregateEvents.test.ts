import { describe, it, expect } from "vitest";
import { dailyPageViews, topEvents, topPages, eventStats, type EventRow } from "../aggregateEvents";

// 오라클: git HEAD 의 app/[lang]/admin/analytics/events/page.tsx 집계 코드 그대로 (useMemo 만 즉시실행으로)
function deviceCategory(w: number | null): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (!w) return 'unknown';
  if (w < 768) return 'mobile';
  if (w < 1280) return 'tablet';
  return 'desktop';
}


function legacy(data: { events: EventRow[] } | null) {
  // 일별 페이지뷰 추이
  const dailyPageViews = (() => {
    if (!data) return [];
    const byDay = new Map<string, number>();
    for (const e of data.events) {
      if (e.event_type !== 'page_view') continue;
      const day = e.created_at.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    return Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  })();

  // Top events
  const topEvents = (() => {
    if (!data) return [];
    const byType = new Map<string, number>();
    for (const e of data.events) byType.set(e.event_type, (byType.get(e.event_type) ?? 0) + 1);
    return Array.from(byType.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));
  })();

  // Top pages
  const topPages = (() => {
    if (!data) return [];
    const byPage = new Map<string, number>();
    for (const e of data.events) {
      if (e.event_type !== 'page_view' || !e.page) continue;
      byPage.set(e.page, (byPage.get(e.page) ?? 0) + 1);
    }
    return Array.from(byPage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));
  })();

  // 디바이스 분포 + 보류 이슈 카드 데이터
  const stats = (() => {
    if (!data) return null;
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

    for (const e of data.events) {
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
  })();


  return { dailyPageViews, topEvents, topPages, stats };
}

const TYPES = ["page_view","pendant_click","expiring_banner_click","fab_add_click","empty_cta_click","recipe_pill_click","bottomnav_search_click","search_overlay_pill_click","ingredient_add","ingredient_delete","other_event","page_view","page_view"];
const PAGES = ["/ko", "/ko/recipes", "/en", null, "/ko/tip", "/ko/search"];
function fixture(n: number): EventRow[] {
  const rows: EventRow[] = [];
  for (let i = 0; i < n; i++) {
    const t = TYPES[(i * 7) % TYPES.length];
    rows.push({
      event_type: t,
      page: PAGES[(i * 5) % PAGES.length],
      payload: t === "recipe_pill_click" ? { mode: ["ready","almost","all","weird"][i % 4] } : t === "search_overlay_pill_click" ? { pill: ["recipes","tips","x"][i % 3] } : (i % 11 === 0 ? null : {}),
      viewport_w: [null, 375, 800, 1440, 0][i % 5],
      user_id: i % 4 === 0 ? null : "u" + (i % 9),
      session_id: "s" + (i % 13),
      created_at: new Date(Date.UTC(2026, 8, 1 + (i % 12), i % 24)).toISOString(),
    });
  }
  return rows;
}

describe("aggregateEvents — 이전 페이지 집계와 동일", () => {
  for (const n of [0, 1, 37, 400]) {
    it("rows=" + n, () => {
      const rows = fixture(n);
      const old = legacy({ events: rows });
      expect(dailyPageViews(rows)).toEqual(old.dailyPageViews);
      expect(topEvents(rows)).toEqual(old.topEvents);
      expect(topPages(rows)).toEqual(old.topPages);
      expect(eventStats(rows)).toEqual(old.stats);
    });
  }
});
