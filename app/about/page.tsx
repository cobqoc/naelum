import type { Metadata } from 'next'
import AboutClient from './AboutClient'

// 정적 페이지 — ISR 60초 캐싱 (콘텐츠 거의 안 변함)
export const revalidate = 60

export const metadata: Metadata = {
  title: '낼름 소개 — 냉장고에서 바로 만드는 한식 레시피',
  description:
    '낼름은 냉장고에 있는 재료로 바로 만들 수 있는 한식 레시피를 8개 언어로 제공하는 앱입니다. 외국인, 해외교포, 자취생 누구나 쉽게 한식을 즐기세요.',
  openGraph: {
    title: '낼름 소개',
    description: '냉장고에 있는 재료로 바로 만드는 한식 — 8개 언어 지원',
    type: 'website',
    images: ['/icons/icon-512.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '낼름 소개',
    description: '냉장고에 있는 재료로 바로 만드는 한식 — 8개 언어 지원',
    images: ['/icons/icon-512.png'],
  },
}

export default function AboutPage() {
  return <AboutClient />
}
