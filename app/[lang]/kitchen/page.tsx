import type { Metadata } from 'next';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import IngredientBrowseClient from './IngredientBrowseClient';
import KitchenHomeClient from './KitchenHomeClient';

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
    // 미완성 페이지 — 완성 전까지 검색 색인 제외 (크롤은 허용해 noindex 를 읽게 함).
    robots: { index: false, follow: true },
  };
}

/**
 * 부엌 도감 페이지.
 *
 * 두 가지 뷰:
 *  - 기본 (param 없음): KitchenHomeClient — 카테고리 카드 그리드 (허브)
 *  - ?category=X / ?q=X / ?highlight=X: IngredientBrowseClient — 가나다순 그룹 + 검색·상세 패널
 *
 * 가나다순 전체 탭(?view=all)은 제거 (2026-05-30) — 카테고리 뷰가 카테고리 내 가나다순/초성을
 * 이미 제공 + 검색이 "이름으로 찾기" 담당. 글로벌 평면 A-Z는 카테고리 구조보다 열등해 잉여.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; highlight?: string }>;
}) {
  const sp = await searchParams;
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
