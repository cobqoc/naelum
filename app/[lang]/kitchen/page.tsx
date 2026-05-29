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
 * 세 가지 뷰:
 *  - 기본 (param 없음): KitchenHomeClient — 카테고리 카드 그리드 (V2 첫 디자인)
 *  - ?view=all: KitchenAllClient — 한글 초성 + 영문 그룹화 가나다순
 *  - ?category=X / ?q=X / ?highlight=X: IngredientBrowseClient — 검색·필터·상세 패널
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; highlight?: string; view?: string }>;
}) {
  const sp = await searchParams;
  if (sp.view === 'all') return <KitchenAllClient />;
  if (sp.category || sp.q || sp.highlight) {
    return (
      <IngredientBrowseClient
        initialCategory={sp.category ?? ''}
        initialQuery={sp.q ?? ''}
        highlightId={sp.highlight ?? ''}
      />
    );
  }
  return <KitchenHomeClient />;
}
