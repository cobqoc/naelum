'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/context'

interface WaitlistFormProps {
  /** 수집 소스 (추적용). 예: "home_hero", "about_cta" */
  source: string
  /** 컴팩트 모드 (홈 인라인). false면 카드형 */
  compact?: boolean
}

export default function WaitlistForm({ source, compact = false }: WaitlistFormProps) {
  const { t, language } = useI18n()
  // 타입 안전성은 포기 — i18n key가 동적으로 늘어나서
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = (t as any).waitlist ?? {
    title: '🚀 런칭 알림 받기',
    subtitle: '새 레시피와 런칭 소식을 가장 먼저 받아보세요',
    placeholder: '이메일 주소',
    submit: '구독하기',
    submitting: '처리 중...',
    success: '구독 완료! 감사합니다 🎉',
    alreadySubscribed: '이미 구독하신 이메일이에요 ✓',
    errorInvalid: '유효한 이메일을 입력해주세요',
    errorGeneric: '잠시 후 다시 시도해주세요',
  }

  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === 'loading') return

    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setState('error')
      setErrorMsg(w.errorInvalid)
      return
    }

    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source, language }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState('error')
        setErrorMsg(data.error || w.errorGeneric)
        return
      }
      setState(data.alreadySubscribed ? 'already' : 'success')
      setEmail('')
    } catch {
      setState('error')
      setErrorMsg(w.errorGeneric)
    }
  }

  const isSubmitted = state === 'success' || state === 'already'

  if (compact) {
    // 컴팩트 — 홈페이지 inline용. 제목 없이 input + 버튼만.
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={w.placeholder}
            disabled={state === 'loading' || isSubmitted}
            className="flex-1 rounded-xl bg-background-secondary border border-white/10 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm/50 disabled:opacity-50"
            aria-label={w.placeholder}
          />
          <button
            type="submit"
            disabled={state === 'loading' || isSubmitted}
            className="px-5 py-3 rounded-xl bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {state === 'loading' ? w.submitting : w.submit}
          </button>
        </div>
        {state === 'success' && (
          <p className="mt-2 text-xs text-success">{w.success}</p>
        )}
        {state === 'already' && (
          <p className="mt-2 text-xs text-text-muted">{w.alreadySubscribed}</p>
        )}
        {state === 'error' && errorMsg && (
          <p className="mt-2 text-xs text-error">{errorMsg}</p>
        )}
      </form>
    )
  }

  // 카드형 — /about CTA 등
  return (
    <div className="w-full max-w-md mx-auto rounded-2xl bg-background-secondary border border-white/10 p-5 md:p-6">
      <h3 className="text-base md:text-lg font-bold mb-1 text-text-primary">{w.title}</h3>
      <p className="text-xs md:text-sm text-text-muted mb-4">{w.subtitle}</p>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={w.placeholder}
            disabled={state === 'loading' || isSubmitted}
            className="flex-1 rounded-xl bg-background-tertiary border border-white/10 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm/50 disabled:opacity-50"
            aria-label={w.placeholder}
          />
          <button
            type="submit"
            disabled={state === 'loading' || isSubmitted}
            className="px-5 py-3 rounded-xl bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {state === 'loading' ? w.submitting : w.submit}
          </button>
        </div>
        {state === 'success' && (
          <p className="mt-3 text-xs text-success">{w.success}</p>
        )}
        {state === 'already' && (
          <p className="mt-3 text-xs text-text-muted">{w.alreadySubscribed}</p>
        )}
        {state === 'error' && errorMsg && (
          <p className="mt-3 text-xs text-error">{errorMsg}</p>
        )}
      </form>
    </div>
  )
}
