import Link from '@/components/Common/LocalizedLink';
import SafeImage from '@/components/Common/SafeImage';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { getTimeAgo } from '@/lib/utils/timeAgo';
import type { Recipe, TabType } from './types';

/**
 * 레시피·낼름함·만들어봤어요 그리드 + 소유자 관리 메뉴 (순수 표현).
 *
 * god-file([username]/page) 분해 Phase 2 최대 블록. ⚠️ 모든 상태·async
 * 핸들러(fetch·delete·visibility·review)는 *부모* 소유 — 이 컴포넌트는 콜백만
 * 받아 호출. JSX·className·핸들러 시그니처 원본과 byte-identical → 행위 변경 0.
 * 회귀 가드: e2e/profile-decomposition.spec.ts (그리드 렌더·관리 메뉴·가시성 토글).
 */

interface ProfileRecipeGridProps {
  t: TranslationKeys;
  recipes: Recipe[];
  activeTab: TabType;
  isOwnProfile: boolean;
  menuOpenRecipeId: string | null;
  setMenuOpenRecipeId: (id: string | null) => void;
  onDeleteCooked: (recipeId: string, e: React.MouseEvent) => void;
  onOpenReview: (recipe: Recipe, e: React.MouseEvent) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onToggleVisibility: (recipeId: string, currentStatus: string) => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  loadingMore: boolean;
}

export default function ProfileRecipeGrid({
  t,
  recipes,
  activeTab,
  isOwnProfile,
  menuOpenRecipeId,
  setMenuOpenRecipeId,
  onDeleteCooked,
  onOpenReview,
  onDeleteRecipe,
  onToggleVisibility,
  sentinelRef,
  loadingMore,
}: ProfileRecipeGridProps) {
  if (!['created', 'saved', 'cooked'].includes(activeTab)) return null;

  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
    {/* 레시피 작성 카드 (본인 프로필 + created 탭일 때만) */}
    {isOwnProfile && activeTab === 'created' && (
      <Link
        href="/recipes/new"
        className="group relative rounded-2xl bg-gradient-to-br from-accent-warm/20 to-accent-warm/5 overflow-hidden border-2 border-dashed border-accent-warm/50 hover:border-accent-warm transition-all hover:scale-[1.02] active:scale-95"
      >
        <div className="aspect-square flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 rounded-full bg-accent-warm/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 text-accent-warm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-accent-warm font-bold text-center">{t.recipe.writeRecipe}</p>
          <p className="text-text-muted text-xs text-center mt-2">{t.recipe.writeRecipeSub}</p>
        </div>
      </Link>
    )}

    {recipes.map((recipe) => (
      <div
        key={recipe.id}
        className="group relative rounded-2xl bg-background-secondary overflow-hidden border border-white/5 hover:border-accent-warm/30 transition-all"
      >
        <Link href={`/recipes/${recipe.id}`} className="block">
          {/* 이미지 영역 */}
          <div className="aspect-square relative">
            {/* 만들어본 음식 탭: 완성 사진 우선 표시 */}
            {activeTab === 'cooked' && recipe.completion_photo_url ? (
              <SafeImage
                src={recipe.completion_photo_url}
                alt={`${recipe.title} 완성 사진`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : recipe.display_image ? (
              <SafeImage
                src={recipe.display_image}
                alt={recipe.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-background-tertiary">
                <span className="text-6xl">🍽️</span>
              </div>
            )}

            {/* 비공개 표시 */}
            {recipe.status !== 'published' && isOwnProfile && activeTab === 'created' && (
              <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 text-white text-xs font-bold backdrop-blur-sm">
                🔒 비공개
              </div>
            )}

            {/* 만들어봄 배지 */}
            {activeTab !== 'cooked' && recipe.has_cooked && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-accent-warm text-background-primary text-xs font-bold shadow-lg">
                ✓ {t.recipe.cooked}
              </div>
            )}

            {/* 만들어본 음식 삭제 버튼 */}
            {activeTab === 'cooked' && isOwnProfile && (
              <button
                onClick={(e) => onDeleteCooked(recipe.id, e)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-error/80 backdrop-blur-sm text-white hover:bg-error transition-all flex items-center justify-center z-10"
                title={t.common.delete}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* 다른 탭: hover 시에만 정보 표시 */}
            {activeTab !== 'cooked' && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-bold line-clamp-2 mb-2">{recipe.title}</p>
                  <div className="flex items-center gap-3 text-xs text-white/80">
                    <span>⭐ {(recipe.average_rating ?? 0).toFixed(1)}</span>
                    <span>👁️ {recipe.views_count ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 낼름함 탭: 메모가 있으면 표시 */}
          {activeTab === 'saved' && recipe.save_notes && (
            <div className="p-2.5 bg-background-tertiary border-t border-white/5">
              <p className="text-xs text-text-secondary line-clamp-2">
                <span className="text-text-muted">📝</span> {recipe.save_notes}
              </p>
            </div>
          )}

          {/* 만들어본 음식 탭: 카드 하단에 정보 항상 표시 */}
          {activeTab === 'cooked' && (
            <div className="p-3 bg-background-tertiary">
              <p className="text-text-primary font-bold line-clamp-2 mb-2 text-sm">{recipe.title}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary mb-2">
                <span>⭐ {(recipe.average_rating ?? 0).toFixed(1)}</span>
                <span>👁️ {recipe.views_count ?? 0}</span>
                {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                  <span>⏱️ {(recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)}{t.profile.minuteSuffix}</span>
                )}
                {recipe.difficulty_level && (
                  <span>
                    {recipe.difficulty_level === 'easy' ? `🟢 ${t.recipe.easy}` :
                     recipe.difficulty_level === 'medium' ? `🟡 ${t.recipe.medium}` : `🔴 ${t.recipe.hard}`}
                  </span>
                )}
              </div>
              {recipe.completed_at && (
                <div className="text-xs text-accent-warm font-bold mb-2">
                  🎉 {getTimeAgo(recipe.completed_at, t.notifications)}
                </div>
              )}

              {/* 리뷰 버튼 (본인 프로필에만 표시) */}
              {isOwnProfile && (
                <button
                  onClick={(e) => onOpenReview(recipe, e)}
                  className="w-full py-2 px-3 rounded-lg bg-background-secondary hover:bg-background-primary transition-all text-xs font-bold flex items-center justify-center gap-1"
                >
                  {recipe.user_rating ? (
                    <>
                      <span>⭐ {recipe.user_rating}{t.profile.ratingSuffix}</span>
                      <span>·</span>
                      <span>{t.profile.editShort}</span>
                    </>
                  ) : (
                    <>
                      <span>⭐</span>
                      <span>{t.profile.writeReview}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </Link>

        {/* Recipe Management Menu (Own Profile Only) */}
        {isOwnProfile && activeTab === 'created' && (
          <div className="absolute top-3 right-3">
            <button
              onClick={() => setMenuOpenRecipeId(menuOpenRecipeId === recipe.id ? null : recipe.id)}
              className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm text-white hover:bg-black/90 transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>

            {menuOpenRecipeId === recipe.id && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpenRecipeId(null)}
                />
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-background-primary border border-white/10 shadow-2xl overflow-hidden z-50">
                  <Link
                    href={`/recipes/${recipe.id}/edit`}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-background-secondary transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t.recipe.modify}
                  </Link>
                  <button
                    onClick={() => onToggleVisibility(recipe.id, recipe.status)}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-background-secondary transition-colors text-sm text-left"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {recipe.status === 'published' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                    {recipe.status === 'published' ? t.recipe.hide : t.recipe.publish}
                  </button>
                  <button
                    onClick={() => onDeleteRecipe(recipe.id)}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-error/10 transition-colors text-sm text-error text-left"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t.common.delete}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    ))}
    <div ref={sentinelRef} className="mt-8 flex justify-center">
      {loadingMore && (
        <div className="flex items-center gap-2 text-text-muted text-sm py-4">
          <div className="w-4 h-4 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
          <span>{t.common.loading}</span>
        </div>
      )}
    </div>
    </div>
  );
}
