import type { Metadata } from 'next';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import IngredientBrowseClient from './IngredientBrowseClient';
import KitchenHomeClient from './KitchenHomeClient';
import KitchenAllClient from './KitchenAllClient';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);
  const title = t.meta.ingredientsTitle;
  const description = t.meta.ingredientsDescription;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

/**
 * 부엌 도감 페이지 (V2, 2026-05-29).
 *
 * 두 가지 모드:
 *  1. 메인 (query 없음) → KitchenHomeClient: 카테고리 카드 그리드
 *  2. 카테고리/검색 (`?category=X` or `?q=X`) → IngredientBrowseClient: 그리드·검색·상세
 *
 * 둘 다 같은 URL `/[lang]/kitchen` 사용 — 사용자 흐름 자연 (메인에서 카테고리 클릭 → 그리드).
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; highlight?: string; view?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  // view=all → 가나다순 사전 뷰 (전체 보기)
  if (sp.view === 'all' || sp.sort === 'name') return <KitchenAllClient />;
  // category/q/highlight 있으면 그리드 필터 페이지
  if (sp.category || sp.q || sp.highlight) return <IngredientBrowseClient />;
  // 기본 — 카테고리 카드 그리드
  return <KitchenHomeClient />;
}
