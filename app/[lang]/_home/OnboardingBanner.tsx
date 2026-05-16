/**
 * 홈 상단 "온보딩 미완료" 배너 (presentational).
 *
 * god-file(HomeClient) 분해 down-payment — [[TagsField]] 규약 동일:
 *  1. 상태(showOnboardingBanner/Modal)·판정(needsOnboarding)·localStorage 영구
 *     dismiss 로직은 전부 부모(HomeClient)가 소유. 이 컴포넌트는 값+콜백만.
 *  2. JSX 는 원본과 byte-identical (마크업·className 동일) → 행위 변경 0
 *  3. 검증: npm run build(strict props) + e2e/logged-in-home.spec.ts
 *     ("온보딩 배너 …" 회귀 2종이 노출·CTA→위자드·X→영구 dismiss 를 exercise)
 *
 * 부모 렌더: `{showOnboardingBanner && <OnboardingBanner ... />}`
 * (노출 조건 가드는 부모가 유지 — 이 컴포넌트는 "보일 때의 모양"만 책임)
 */

interface OnboardingBannerProps {
  title: string;
  ctaLabel: string;
  /** X 버튼 aria-label (t.common.close) */
  closeLabel: string;
  /** CTA 클릭 → 부모가 OnboardingWizard 오픈 */
  onCta: () => void;
  /** X 클릭 → 부모가 localStorage 영구 dismiss + 배너 hide */
  onDismiss: () => void;
}

export default function OnboardingBanner({
  title,
  ctaLabel,
  closeLabel,
  onCta,
  onDismiss,
}: OnboardingBannerProps) {
  return (
    <div className="w-full border-b border-accent-warm/15 bg-gradient-to-r from-accent-warm/15 via-accent-warm/8 to-accent-warm/15 flex-shrink-0">
      <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex-shrink-0 text-sm leading-none" aria-hidden="true">✨</span>
          <p className="text-[12px] md:text-sm text-text-primary font-medium truncate">
            {title}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onCta}
            className="px-2.5 py-0.5 rounded-full bg-accent-warm hover:bg-accent-hover text-background-primary text-[11px] font-bold active:scale-95 transition-all whitespace-nowrap"
          >
            {ctaLabel}
          </button>
          <button
            onClick={onDismiss}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
            aria-label={closeLabel}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
