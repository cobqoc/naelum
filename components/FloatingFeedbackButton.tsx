'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

// ContactModal은 무겁고(이미지 업로드 등) 거의 열리지 않으므로 lazy load
const ContactModal = dynamic(() => import('./ContactModal'), { ssr: false })

/**
 * 플로팅 피드백 버튼 — 모든 페이지 우측 하단에 떠있는 의견 수집 버튼.
 *
 * 초기 유저가 이탈 직전에 의견을 남길 수 있는 창구. Day 3 런칭 준비물.
 *
 * 숨김 조건:
 * - /auth/* — 인증 플로우 중엔 UI 방해
 * - /signup, /login — 가입/로그인 중엔 숨김
 * - /recipes/[id]/cook — 쿠킹 모드 풀스크린
 * - 관리자 페이지 — 별도 도구 사용
 *
 * 위치는 모바일에서 BottomNav 위, 데스크톱에서 우측 하단 고정.
 */
export default function FloatingFeedbackButton() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const shouldHide =
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/admin') ||
    pathname === '/' ||
    /\/recipes\/[^/]+\/cook/.test(pathname)

  if (shouldHide) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="의견 보내기"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 rounded-full bg-background-secondary/90 backdrop-blur-md border border-accent-warm/30 px-3 py-2 md:px-4 md:py-3 text-sm font-medium text-text-primary hover:bg-background-secondary hover:border-accent-warm/60 hover:scale-105 active:scale-95 transition-all shadow-xl"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <span className="text-base md:text-lg">💬</span>
        <span className="hidden md:inline">피드백</span>
      </button>

      <ContactModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
