import type { Metadata } from 'next';
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
  return <AllRecipesClient />;
}
