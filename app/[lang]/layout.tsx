import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/lib/theme/context";
import { I18nProvider } from "@/lib/i18n/context";
import { ToastProvider } from "@/lib/toast/context";
import ToastContainer from "@/components/Common/ToastContainer";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import CookieConsent from "@/components/CookieConsent";
import { ConsentProvider } from "@/lib/cookieConsent/context";
import AccessibilityProvider from "@/components/Common/AccessibilityProvider";
import { AuthProvider } from "@/lib/auth/context";
import { loadLocale, SUPPORTED_LANGUAGES, type Language } from "@/lib/i18n/locales";
import HtmlLangSync from "./_lang/HtmlLangSync";
import PageViewTracker from "@/components/Analytics/PageViewTracker";

// 8개 locale 각각 정적 prerender 대상.
// generateStaticParams가 있어야 [lang] 라우트의 정적 변형들이 빌드 시 생성됨.
export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) return {};
  const t = await loadLocale(lang as Language);
  const title = `낼름 — ${t.home.tagline}`;
  const description = t.home.taglineSub;
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description },
  };
}

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!SUPPORTED_LANGUAGES.includes(lang as Language)) {
    notFound();
  }

  // server에서 locale 미리 로드 → I18nProvider에 전달. SSR 첫 렌더부터 정확한 t.
  // path별 빌드 타임에 결정되므로 정적 prerender 호환.
  const initialT = await loadLocale(lang as Language);

  return (
    <>
      <HtmlLangSync lang={lang} />
      <ServiceWorkerRegister />
      <ThemeProvider>
        <I18nProvider initialLanguage={lang as Language} initialT={initialT}>
          <AuthProvider>
            <ToastProvider>
              <ConsentProvider>
                <AccessibilityProvider>
                  {children}
                  <CookieConsent />
                  <ToastContainer />
                  {/* 자체 analytics 페이지뷰 트래킹 */}
                  <PageViewTracker />
                </AccessibilityProvider>
              </ConsentProvider>
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </>
  );
}
