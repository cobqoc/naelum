import Link from '@/components/Common/LocalizedLink';
import TipCard from '@/components/TipCard';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { type Tip } from './types';

/**
 * 팁 탭 그리드 (순수 표현).
 *
 * god-file([username]/page) 분해 Phase 2. fetchTips·상태는 부모 소유 —
 * 값 props 만. JSX·className 원본과 byte-identical → 행위 변경 0.
 */

interface TipsGridProps {
  t: TranslationKeys;
  tips: Tip[];
  tipsLoading: boolean;
  isOwnProfile: boolean;
}

export default function TipsGrid({ t, tips, tipsLoading, isOwnProfile }: TipsGridProps) {
  return (
    <div className="mt-6">
      {tipsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-background-secondary animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* 팁 작성 카드 */}
          {isOwnProfile && (
            <Link
              href="/tip/new"
              className="group relative rounded-2xl bg-gradient-to-br from-accent-warm/20 to-accent-warm/5 overflow-hidden border-2 border-dashed border-accent-warm/50 hover:border-accent-warm transition-all hover:scale-[1.02] active:scale-95"
            >
              <div className="aspect-square flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 rounded-full bg-accent-warm/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-accent-warm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-accent-warm font-bold text-center">{t.profile.writeTip}</p>
                <p className="text-text-muted text-xs text-center mt-2">{t.profile.writeTipHint}</p>
              </div>
            </Link>
          )}
          {tips.map(tip => (
            <TipCard key={tip.id} tip={tip} />
          ))}
          {tips.length === 0 && !isOwnProfile && (
            <div className="col-span-2 md:col-span-3 text-center py-20">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-text-muted text-lg">{t.profile.noTipsYet}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
