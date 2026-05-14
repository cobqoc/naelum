import type { Metadata } from 'next';
import { Suspense } from 'react';

// 레시피 목록 페이지 셸은 정적 캐시 (실제 레시피 데이터는 AllRecipesClient가 클라이언트에서 fetch)
export const revalidate = 3600;
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import AllRecipesClient from './AllRecipesClient';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);
  const title = t.meta.recipesTitle;
  const description = t.meta.recipesDescription;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default function Page() {
  return (
    <Suspense>
      <AllRecipesClient />
    </Suspense>
  );
}
