import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// Geist Mono 는 제거됨 (perf 2026-09-27): --font-geist-mono 를 참조하는 CSS 가 없고 Tailwind `font-mono`
// 는 기본 ui-monospace 스택을 쓰므로 어떤 요소도 이 폰트로 렌더되지 않았는데 매 로드마다 23KB woff2 를
// preload 하고 있었다. 필요해지면 Geist_Mono 를 다시 추가하고 globals.css 에서 변수를 연결할 것.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://naelum.app';

// 루트 layout — locale-independent shell만 담당.
// <html lang>은 ko 기본값(정적). 비한국 locale은 [lang]/layout의 useEffect가 client-side 업데이트.
// metadata도 ko 기본. 페이지별 generateMetadata가 locale 반영해 override.
export const metadata: Metadata = {
  title: {
    default: "낼름 - 레시피 공유 플랫폼",
    template: "%s | 낼름",
  },
  description: "재료 기반 스마트 레시피 추천 및 공유 플랫폼. 보유한 재료로 만들 수 있는 요리를 찾아보세요.",
  keywords: ["레시피", "요리", "음식", "재료", "추천", "한식", "양식", "recipe", "cooking"],
  authors: [{ name: "낼름 Team" }],
  metadataBase: new URL(BASE_URL),
  // 검색엔진 소유확인. Google 은 DNS(도메인 속성)로 인증해 태그 불필요 — Naver 만 태그 방식.
  verification: {
    other: {
      "naver-site-verification": "c0f3a5150bbb02e2adc8ae615f26f77194ee34dc",
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "낼름",
    title: "낼름 - 레시피 공유 플랫폼",
    description: "재료 기반 스마트 레시피 추천 및 공유 플랫폼",
    url: BASE_URL,
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "낼름",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "낼름 - 레시피 공유 플랫폼",
    description: "재료 기반 스마트 레시피 추천 및 공유 플랫폼",
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "낼름",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    // data-theme 는 아래 인라인 스크립트가 첫 페인트 전에 붙인다 → React 가 모르는 속성이라 html 만 경고 억제
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 테마를 첫 페인트 전에 적용 — 예전엔 hydration 뒤 effect 에서만 붙여 라이트 사용자가 매 로드마다
            다크 화면을 0.2s 봤다(2026-10-19 감사 PAU-51). lib/theme/context.tsx 의 저장 키·계산과 같다.
            CSP script-src 가 'unsafe-inline' 을 허용(next.config.ts). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}",
          }}
        />
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} />}
        {supabaseUrl && <link rel="dns-prefetch" href={supabaseUrl} />}
      </head>
      <body
        className={`${geistSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
