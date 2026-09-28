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
import FavoritesSyncBoot from "@/components/FavoritesSyncBoot";
import FloatingFeedbackButton from "@/components/FloatingFeedbackButton";

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
  // ko 는 클라이언트 번들에 정적 포함된 defaultLocale(=동일한 ko 객체)이라 RSC 페이로드로 다시 보내지
  // 않는다 — 페이지당 ~56KB(HTML·RSC) 중복 제거 (perf 2026-09-27). I18nProvider 는 initialT 부재 시
  // defaultLocale 로 시작하고 ko 면 추가 로드 없이 그대로 유지하므로 첫 렌더·hydration 결과가 동일하다.
  // 비-ko 는 SSR 첫 렌더 정확성(번역 깜빡임 방지)을 위해 계속 전달한다.
  const clientInitialT = lang === 'ko' ? undefined : initialT;

  return (
    <>
      <HtmlLangSync lang={lang} />
      <ServiceWorkerRegister />
      <ThemeProvider>
        <I18nProvider initialLanguage={lang as Language} initialT={clientInitialT}>
          <AuthProvider>
            <ToastProvider>
              <ConsentProvider>
                <AccessibilityProvider>
                  {children}
                  <CookieConsent />
                  <ToastContainer />
                  {/* 자체 analytics 페이지뷰 트래킹 */}
                  <PageViewTracker />
                  {/* 로그인 사용자 첫 진입 시 자주 사용 재료 localStorage → DB 1회 이전 */}
                  <FavoritesSyncBoot />
                  {/* 초기 유저 피드백 수집 — 자체 hide 로직(/auth·/signin·/admin·/·cook
                      + i18n useLocalizedPathname)으로 노출 페이지 한정. 홈은 미니멀 유지 위해 숨김 */}
                  <FloatingFeedbackButton />
                </AccessibilityProvider>
              </ConsentProvider>
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </>
  );
}
