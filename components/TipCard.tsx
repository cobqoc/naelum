'use client';

import { memo } from 'react';
import Link from '@/components/Common/LocalizedLink';
import SafeImage from '@/components/Common/SafeImage';
import { useI18n } from '@/lib/i18n/context';

// 팁 카테고리 → 아이콘. category 는 DB 저장 한글 값(고정 enum) — locale key 아님.
export const TIP_CATEGORY_ICONS: Record<string, string> = {
  '손질법': '🔪', '보관법': '🧊', '조리법': '🍳',
  '도구 사용법': '🥄', '계량법': '⚖️', '기타': '💡',
};

interface TipCardTip {
  id: string;
  title: string;
  category: string;
  thumbnail_url?: string | null;
  duration_minutes?: number | null;
  views_count?: number;
  is_public?: boolean;
  author?: { username: string } | null;
}

interface TipCardProps {
  tip: TipCardTip;
  showAuthor?: boolean;
  priority?: boolean;
}

/**
 * 요리 팁 카드 — /tip 목록·프로필 팁 탭 공용 단일 컴포넌트.
 * 레시피와 다른 엔티티(난이도·평점·재료 없음)라 RecipeCard 와 별개.
 * is_public === false 면 🔒 배지(프로필 비공개 팁), showAuthor 면 작성자 표기.
 */
export default memo(function TipCard({ tip, showAuthor = false, priority = false }: TipCardProps) {
  const { t } = useI18n();
  const icon = TIP_CATEGORY_ICONS[tip.category] ?? '💡';

  return (
    <Link href={`/tip/${tip.id}`} className="block group">
      <div className="rounded-2xl bg-background-secondary overflow-hidden border border-white/5 transition-all group-hover:border-accent-warm/50 group-hover:shadow-lg group-hover:shadow-accent-warm/10">
        {/* 이미지 */}
        <div className="aspect-[4/3] w-full relative">
          {tip.thumbnail_url ? (
            <SafeImage
              src={tip.thumbnail_url}
              alt={tip.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent-warm/20 via-background-tertiary to-background-secondary flex items-center justify-center">
              <span className="text-5xl md:text-6xl opacity-60" aria-hidden="true">{icon}</span>
            </div>
          )}
          {/* 카테고리 배지 */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-xs">
            {icon} {tip.category}
          </div>
          {/* 비공개 배지 (프로필 비공개 팁) */}
          {tip.is_public === false && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-xs font-bold backdrop-blur-sm">
              🔒 {t.profile.privateBadge}
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="p-3 space-y-1">
          <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-accent-warm transition-colors">
            {tip.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
            {tip.duration_minutes != null && <span>⏱ {tip.duration_minutes}{t.recipe.minuteUnit}</span>}
            <span>👁 {tip.views_count ?? 0}</span>
          </div>
          {showAuthor && (
            <p className="text-[11px] text-text-muted truncate">@{tip.author?.username ?? t.tip.anonymous}</p>
          )}
        </div>
      </div>
    </Link>
  );
});
