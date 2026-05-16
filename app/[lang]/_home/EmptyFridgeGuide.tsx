/**
 * 빈 냉장고 가이드 — 로그인 신규 유저(items=0) 전용 안내 overlay (presentational).
 *
 * god-file(HomeClient) 분해 down-payment — [[OnboardingBanner]]·[[RecommendationPill]]
 * 규약 동일:
 *  1. 노출 가드(user && !loading && items.length===0)·상태(showAuthPrompt/addModalLocation)·
 *     CTA 분기(track→auth면 prompt, 아니면 add modal)는 전부 부모(HomeClient)가 소유.
 *     이 컴포넌트는 라벨 + onCtaClick 만 받는 순수 표현(JSX byte-identical).
 *  2. 검증: npm run build(strict props) + e2e/logged-in-home.spec.ts
 *     ("빈 냉장고 → 모달 → 양파 1탭 → DB 저장 + 빈 가이드 사라짐",
 *      "UI 진입 + 재료 추가 → 배너 자동 등장 + 빈 가이드 사라짐")
 *
 * 부모 렌더: `{user && !loading && items.length === 0 && <EmptyFridgeGuide ... />}`
 * (선반 overlay 경로는 items.length===0 시 자연히 렌더 결과 없으므로 영향 없음)
 */

interface EmptyFridgeGuideProps {
  title: string;
  desc: string;
  cta: string;
  /** 부모가 track + auth 분기(prompt/add modal)를 묶어 전달 */
  onCtaClick: () => void;
}

export default function EmptyFridgeGuide({ title, desc, cta, onCtaClick }: EmptyFridgeGuideProps) {
  return (
    <div className="absolute inset-0 z-[25] flex items-center justify-center pointer-events-none px-6">
      <div className="pointer-events-auto bg-background-secondary/95 backdrop-blur-sm border border-accent-warm/30 rounded-2xl shadow-2xl p-5 max-w-[280px] text-center">
        <div className="text-5xl mb-2" aria-hidden="true">🥕</div>
        <h2 className="text-base md:text-lg font-bold mb-1.5">{title}</h2>
        <p className="text-xs md:text-sm text-text-secondary mb-4 leading-relaxed">{desc}</p>
        <button
          onClick={onCtaClick}
          className="w-full px-4 py-2.5 rounded-xl bg-accent-warm hover:bg-accent-hover text-background-primary text-sm font-bold active:scale-95 transition-all"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
