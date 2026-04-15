'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { useAuth } from '@/lib/auth/context'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'

/**
 * /about 페이지.
 *
 * 주 타겟: 아직 낼름을 써보지 않은 방문자 (외국인, 커뮤니티에서 유입된 유저).
 * 목적: "낼름이 뭐 하는 앱인지" 30초 안에 이해시키고 회원가입 유도.
 *
 * 구조:
 * - Hero: tagline + 한 문장 소개
 * - Features: 4개 핵심 기능 카드
 * - Why: 만든 이유 (공감 포인트)
 * - CTA: 회원가입 또는 홈으로
 */
export default function AboutClient() {
  const { t } = useI18n()
  const { user } = useAuth()

  // 타입 안전성은 포기 — i18n 추가가 많아서 그냥 as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const about = (t as any).about as {
    heroTitle: string
    heroSub: string
    featuresTitle: string
    feature1Title: string
    feature1Desc: string
    feature2Title: string
    feature2Desc: string
    feature3Title: string
    feature3Desc: string
    feature4Title: string
    feature4Desc: string
    whyTitle: string
    whyBody: string
    ctaTitle: string
    ctaButton: string
    ctaLoggedIn: string
  } | undefined

  // fallback (i18n key 없는 경우 대비)
  const copy = about ?? {
    heroTitle: '낼름이 뭐예요?',
    heroSub: '냉장고 안 재료로 바로 만들 수 있는 한식 레시피를 여러 언어로.',
    featuresTitle: '무엇을 할 수 있나요',
    feature1Title: '냉장고 기반 추천',
    feature1Desc: '가지고 있는 재료만 입력하면 만들 수 있는 레시피를 찾아드려요.',
    feature2Title: '8개 언어 지원',
    feature2Desc: '한국어, 영어, 일본어, 중국어 등 8개 언어로 한식을 즐기세요.',
    feature3Title: '쿠킹 모드 + 타이머',
    feature3Desc: '단계별 조리 안내, 타이머, 음성 가이드.',
    feature4Title: '1,700+ 레시피',
    feature4Desc: '검증된 한식 레시피와 유저 공유 레시피.',
    whyTitle: '왜 만들었나요',
    whyBody: '혼자 사는 사람, 해외에서 한식이 그리운 사람, 요리 초보자를 위해.',
    ctaTitle: '지금 시작하세요',
    ctaButton: '무료 회원가입',
    ctaLoggedIn: '홈으로 가기',
  }

  const features = [
    { emoji: '🧊', title: copy.feature1Title, desc: copy.feature1Desc },
    { emoji: '🌐', title: copy.feature2Title, desc: copy.feature2Desc },
    { emoji: '⏱️', title: copy.feature3Title, desc: copy.feature3Desc },
    { emoji: '📚', title: copy.feature4Title, desc: copy.feature4Desc },
  ]

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />

      <main className="px-4 md:px-6 pt-20 md:pt-28 pb-24 md:pb-16 max-w-3xl mx-auto">
        {/* Hero */}
        <section className="text-center mb-14 md:mb-20">
          <div className="mb-6 text-5xl md:text-6xl">🍳</div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            {copy.heroTitle}
          </h1>
          <p className="text-base md:text-lg text-text-muted leading-relaxed max-w-xl mx-auto">
            {copy.heroSub}
          </p>
        </section>

        {/* Features grid */}
        <section className="mb-14 md:mb-20">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">
            {copy.featuresTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl bg-background-secondary border border-white/5 p-5 md:p-6"
              >
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="text-base md:text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why */}
        <section className="mb-14 md:mb-20">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">{copy.whyTitle}</h2>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-2xl mx-auto text-center">
            {copy.whyBody}
          </p>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-6">{copy.ctaTitle}</h2>
          <Link
            href={user ? '/' : '/signup'}
            className="inline-block px-8 py-3.5 rounded-2xl bg-accent-warm text-background-primary font-bold text-base hover:bg-accent-hover transition-all shadow-[0_0_30px_rgba(255,153,102,0.3)]"
          >
            {user ? copy.ctaLoggedIn : copy.ctaButton}
          </Link>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  )
}
