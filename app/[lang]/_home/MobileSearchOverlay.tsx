import Link from '@/components/Common/LocalizedLink';
import SearchBar from '@/components/SearchBar';

/**
 * 모바일 검색 오버레이 — BottomNav 검색 아이콘 → toggle-fridge-search 로 토글
 * (배경 블러 + 아이콘에서 나오는 스케일 애니메이션). presentational.
 *
 * god-file(HomeClient) 분해 down-payment — [[OnboardingBanner]]·
 * [[RecommendationPill]]·[[EmptyFridgeGuide]] 규약 동일:
 *  1. open 상태(showMobileSearch)·토글(toggle-fridge-search 리스너)·
 *     useEscapeKey 는 전부 부모(HomeClient)가 소유. 이 컴포넌트는 open
 *     플래그 + onClose + i18n 라벨만 받는 순수 표현(JSX byte-identical).
 *  2. 항상 DOM 상주 + opacity 토글이라 isVisible() 무의미 → 검증은
 *     aria-hidden={!open} 기준. e2e/mobile-search-overlay.spec.ts 가 회귀망.
 *  3. ⚠️ 도달성은 [[useLocalizedPathname]] 의존: BottomNav.isFridgeHome 이
 *     locale-aware 여야 toggle-fridge-search 가 발화(이전 i18n dead 버그 fix).
 *
 * 부모 렌더: `<MobileSearchOverlay open={showMobileSearch} onClose={...} ... />`
 */

interface MobileSearchOverlayProps {
  open: boolean;
  onClose: () => void;
  navRecipes: string;
  navTips: string;
  closeLabel: string;
}

export default function MobileSearchOverlay({
  open,
  onClose,
  navRecipes,
  navTips,
  closeLabel,
}: MobileSearchOverlayProps) {
  return (
    <>
      {/* 모바일 검색 오버레이 (배경 블러 + 아이콘에서 나오는 애니메이션) */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ease-out ${
          open
            ? 'opacity-100 bg-black/50 backdrop-blur-md pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        aria-hidden={!open}
        className={`fixed left-0 right-0 top-20 px-4 z-50 md:hidden origin-bottom transition-all duration-[450ms] ease-out ${
          open
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-[20vh] scale-[0.5] pointer-events-none'
        }`}
      >
        <div className="max-w-md mx-auto space-y-2">
          {/* 페이지 빠른 이동 — 홈에서 레시피·팁 페이지로 바로 이동 */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/recipes"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-secondary border border-white/10 shadow-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors active:scale-95"
            >
              <span>📋</span><span>{navRecipes}</span>
            </Link>
            <Link
              href="/tip"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-secondary border border-white/10 shadow-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors active:scale-95"
            >
              <span>💡</span><span>{navTips}</span>
            </Link>
          </div>
          {/* 검색창 */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar autoFocus={open} />
            </div>
            <button
              onClick={onClose}
              aria-label={closeLabel}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-background-secondary border border-white/10 shadow-lg text-text-primary hover:bg-background-tertiary transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
