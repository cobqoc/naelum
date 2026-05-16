import Link from '@/components/Common/LocalizedLink';
import type { TranslationKeys } from '@/lib/i18n/translations';

/**
 * 비로그인 cart 드롭다운 — 로그인 유도 뷰 (순수 표현).
 *
 * god-file(ShoppingCartDropdown) 분해 Phase 2. 상태·로직 0 — t/onClose/fromBottom
 * props 만 받는 순수 표현. JSX·className 원본과 byte-identical → 행위 변경 0.
 * 회귀 가드: e2e/cart.spec.ts:164 (BottomNav 비로그인 → 로그인 유도 콘텐츠).
 */

interface CartLoginPromptProps {
  t: TranslationKeys;
  onClose: () => void;
  fromBottom: boolean;
}

export default function CartLoginPrompt({ t, onClose, fromBottom }: CartLoginPromptProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={`rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col ${
          fromBottom
            ? 'fixed left-1/2 -translate-x-1/2 bottom-20 w-[92vw] max-w-sm'
            : 'absolute w-80 md:w-[30rem] max-w-[calc(100vw-2rem)] right-0 top-full mt-2'
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="font-bold text-sm">{t.cart.title}</span>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-base"
            aria-label={t.cart.closeAria}
          >
            ✕
          </button>
        </div>

        {/* 로그인 유도 */}
        <div className="px-5 pt-6 pb-5 text-center">
          <div className="text-5xl mb-3">🛍</div>
          <h3 className="text-sm font-bold text-text-primary mb-1.5">
            {t.cart.loginTitle}
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-4 whitespace-pre-line">
            {t.cart.loginDesc}
          </p>

          {/* 혜택 리스트 */}
          <ul className="text-left text-xs text-text-secondary space-y-1.5 mb-5 px-2">
            <li className="flex items-start gap-2">
              <span className="text-accent-warm shrink-0">✓</span>
              <span>{t.cart.loginBenefit1}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-warm shrink-0">✓</span>
              <span>{t.cart.loginBenefit2}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-warm shrink-0">✓</span>
              <span>{t.cart.loginBenefit3}</span>
            </li>
          </ul>

          <Link
            href="/login"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent-warm text-background-primary font-bold text-sm hover:bg-accent-hover active:scale-[0.98] transition-all"
          >
            {t.cart.loginCta} <span className="leading-none">→</span>
          </Link>

          <p className="text-[11px] text-text-muted mt-3">
            {t.cart.noAccountQuestion}{' '}
            <Link href="/signup" onClick={onClose} className="text-accent-warm underline">
              {t.common.signup}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
