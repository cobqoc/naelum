import Link from '@/components/Common/LocalizedLink';
import SafeImage from '@/components/Common/SafeImage';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { type Recipe, type Tip, TIP_CATEGORY_ICONS } from './types';

/**
 * 임시저장/비공개 탭 — 레시피 + 팁 섹션 (순수 표현).
 *
 * god-file([username]/page) 분해 Phase 2. fetch·상태·loadMore 는 부모 소유 —
 * 값+콜백만. JSX·className 원본과 byte-identical → 행위 변경 0.
 */

interface DraftsPrivateViewProps {
  t: TranslationKeys;
  activeTab: 'drafts' | 'private';
  recipes: Recipe[];
  tips: Tip[];
  tipsLoading: boolean;
  recipePage: number;
  recipeTotalPages: number;
  loadMore: () => void;
  loadingMore: boolean;
}

export default function DraftsPrivateView({
  t,
  activeTab,
  recipes,
  tips,
  tipsLoading,
  recipePage,
  recipeTotalPages,
  loadMore,
  loadingMore,
}: DraftsPrivateViewProps) {
  return (
    <div className="mt-6 space-y-8">
      {/* 레시피 섹션 */}
      <div>
        <h3 className="text-sm font-bold text-text-muted mb-3">
          {activeTab === 'drafts' ? t.profile.draftRecipes : t.profile.privateRecipes}
          {recipes.length > 0 && <span className="ml-2 text-accent-warm">{recipes.length}</span>}
        </h3>
        {recipes.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recipes.map(recipe => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}/edit`} className="group rounded-2xl bg-background-secondary overflow-hidden border border-white/5 hover:border-accent-warm/30 transition-all">
                  <div className="aspect-square relative bg-background-tertiary flex items-center justify-center">
                    {recipe.display_image ? (
                      <SafeImage src={recipe.display_image} alt={recipe.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-5xl">🍽️</span>
                    )}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-bold backdrop-blur-sm">
                      {activeTab === 'drafts' ? t.profile.draftBadge : t.profile.privateBadge}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-text-primary font-bold text-sm line-clamp-2">{recipe.title}</p>
                    <p className="text-xs text-accent-warm mt-1">{t.profile.tapToEdit}</p>
                  </div>
                </Link>
              ))}
            </div>
            {recipePage < recipeTotalPages && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-full border border-white/10 text-sm text-text-secondary hover:border-accent-warm/50 hover:text-accent-warm transition-colors disabled:opacity-50"
                >
                  {loadingMore ? t.profile.loadingMore : t.profile.loadMore}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-text-muted text-sm py-4">{t.profile.none}</p>
        )}
      </div>

      {/* 팁 섹션 */}
      <div>
        <h3 className="text-sm font-bold text-text-muted mb-3">
          {activeTab === 'drafts' ? t.profile.draftTips : t.profile.privateTips}
          {tips.length > 0 && <span className="ml-2 text-accent-warm">{tips.length}</span>}
        </h3>
        {tipsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-background-secondary animate-pulse" />)}
          </div>
        ) : tips.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {tips.map(tip => (
              <Link key={tip.id} href={`/tip/${tip.id}`} className="group rounded-2xl bg-background-secondary overflow-hidden border border-white/5 hover:border-accent-warm/30 transition-all">
                <div className="aspect-square relative bg-background-tertiary flex items-center justify-center">
                  {tip.thumbnail_url ? (
                    <SafeImage src={tip.thumbnail_url} alt={tip.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-5xl">{TIP_CATEGORY_ICONS[tip.category] || '💡'}</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-text-primary font-bold text-sm line-clamp-2">{tip.title}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-background-tertiary text-text-muted">{tip.category}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm py-4">{t.profile.none}</p>
        )}
      </div>
    </div>
  );
}
