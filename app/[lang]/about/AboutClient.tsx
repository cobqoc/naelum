'use client'

import Link from '@/components/Common/LocalizedLink'
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

  // about 카피는 8개 로케일 전부에 t.about 으로 존재 — 직접 사용(이전 as any 캐스트+한글 fallback은 도달 불가 죽은 코드였음).
  const copy = t.about

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
