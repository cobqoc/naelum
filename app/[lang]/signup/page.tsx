import type { Metadata } from 'next';
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from '@/lib/i18n/locales';
import SignupClient from './SignupClient';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);
  const title = t.meta.signupTitle;
  const description = t.meta.signupDescription;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default function Page() {
  return <SignupClient />;
}
