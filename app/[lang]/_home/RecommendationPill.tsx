import Link from '@/components/Common/LocalizedLink';

/**
 * 홈 냉장고 위 "레시피 추천 말풍선" pill (presentational).
 *
 * god-file(HomeClient) 분해 down-payment — [[OnboardingBanner]] 규약 동일:
 *  1. 노출 가드(showRecipeBubble=items.length>0)·상태(matchingCount/resolvedMode)·
 *     href 계산(items/auth)·track 은 전부 부모(HomeClient)가 소유.
 *     이 컴포넌트는 값+href+onClick 만 받는 순수 표현(JSX byte-identical).
 *  2. 검증: npm run build(strict props) + e2e/logged-in-home.spec.ts
 *     ("임박 재료로 실제 추천 매칭 — pill 노출 + /recommendations 이동")
 *
 * 부모 렌더: `{showRecipeBubble && <RecommendationPill ... />}`
 * (matchingCount===null=로딩 shimmer / >0+resolvedMode=라벨 pill — 표시 파생만 담당)
 */

interface RecommendationPillProps {
  matchingCount: number | null;
  resolvedMode: 'ready' | 'almost' | 'all' | null;
  /** 부모가 items/isAuthenticated 로 계산한 이동 경로 */
  href: string;
  /** 부모의 track 클로저 */
  onClick: () => void;
  pillDefault: string;
  pillReady: string;
  pillAlmost: string;
  pillAll: string;
  ariaSuffix: string;
}

export default function RecommendationPill({
  matchingCount,
  resolvedMode,
  href,
  onClick,
  pillDefault,
  pillReady,
  pillAlmost,
  pillAll,
  ariaSuffix,
}: RecommendationPillProps) {
  // 로딩 중이면 shimmer pill
  if (matchingCount === null) {
    return (
      <div className="absolute top-[63%] right-[4%] -translate-y-1/2 z-20 flex items-center gap-1.5 px-3.5 py-2 md:px-5 md:py-2.5 rounded-full bg-accent-warm/60 text-background-primary text-xs md:text-base font-bold whitespace-nowrap animate-pulse">
        <span className="text-base md:text-lg leading-none">💡</span>
        <span>{pillDefault}</span>
      </div>
    );
  }
  // 라벨 결정
  let icon = '💡';
  let label = pillDefault;
  if (matchingCount > 0 && resolvedMode) {
    const countStr = matchingCount >= 30 ? '30+' : String(matchingCount);
    if (resolvedMode === 'ready') { icon = '🔥'; label = pillReady.replace('{count}', countStr); }
    else if (resolvedMode === 'almost') { icon = '🛒'; label = pillAlmost.replace('{count}', countStr); }
    else { icon = '📋'; label = pillAll.replace('{count}', countStr); }
  }
  return (
    <Link
      href={href}
      onClick={onClick}
      className="absolute top-[63%] right-[4%] -translate-y-1/2 z-20 flex items-center gap-1.5 px-3.5 py-2 md:px-5 md:py-2.5 rounded-full bg-accent-warm text-background-primary text-xs md:text-base font-bold shadow-xl shadow-accent-warm/60 ring-2 ring-accent-warm/30 hover:bg-accent-hover hover:scale-105 active:scale-95 transition-transform whitespace-nowrap"
      style={{ animation: 'naelum-bubble-pulse 2.4s ease-in-out infinite' }}
      aria-label={`${label} — ${ariaSuffix}`}
    >
      <span className="text-base md:text-lg leading-none">{icon}</span>
      <span>{label}</span>
      <span className="leading-none text-sm md:text-base">→</span>
    </Link>
  );
}
