import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    <html lang="ko">
      <head>
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} />}
        {supabaseUrl && <link rel="dns-prefetch" href={supabaseUrl} />}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
