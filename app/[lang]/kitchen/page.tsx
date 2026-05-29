import type { Metadata } from 'next';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import IngredientBrowseClient from './IngredientBrowseClient';
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
 * 두 가지 뷰 (상단 탭으로 전환):
 *  - 기본 (그리드): IngredientBrowseClient — 검색·카테고리·상세 패널
 *  - ?view=all (가나다순): KitchenAllClient — 한글 초성 + 영문 그룹화 사전
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const sp = await searchParams;
  if (sp.view === 'all') return <KitchenAllClient />;
  return <IngredientBrowseClient />;
}
