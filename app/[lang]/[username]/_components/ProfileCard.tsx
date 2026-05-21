import Image from 'next/image';
import type { TranslationKeys } from '@/lib/i18n/translations';
import { type Profile, type ProfileCounts, interestEmojis } from './types';

/**
 * 프로필 카드 — 아바타·소개·통계·관심사/식단/알레르기 (순수 표현).
 *
 * god-file([username]/page) 분해 Phase 2. 상태·로직 0 — 값 props 만.
 * hasExtraInfo 는 interests/dietary/allergies 에서만 파생돼 이 블록 전용이라
 * 함께 이동(부모 표면 축소, 동작 동일). 통계 블록은 레시피 단일 → 레시피·팁·
 * 임시저장·비공개 다중 통계로 확장(2026-05-21) — counts·isOwnProfile props 추가.
 * 회귀 가드: e2e/profile-decomposition.spec.ts (프로필 카드 렌더).
 */

interface ProfileCardProps {
  t: TranslationKeys;
  profile: Profile;
  counts: ProfileCounts;
  isOwnProfile: boolean;
  interests: string[];
  dietaryPreferences: string[];
  allergies: string[];
}

export default function ProfileCard({
  t,
  profile,
  counts,
  isOwnProfile,
  interests,
  dietaryPreferences,
  allergies,
}: ProfileCardProps) {
  const hasExtraInfo = interests.length > 0 || dietaryPreferences.length > 0 || allergies.length > 0;

  // 통계 블록 — 레시피 수는 비정규화 컬럼(recipes_count), 나머지는 API counts.
  // 임시저장·비공개는 비공개 정보 → 본인 프로필에서만 노출.
  const stats: { label: string; value: number }[] = [
    { label: t.profile.recipes, value: profile.recipes_count },
    { label: t.profile.tabTips, value: counts.tips },
    ...(isOwnProfile
      ? [
          { label: t.profile.tabDrafts, value: counts.drafts },
          { label: t.profile.tabPrivate, value: counts.private },
        ]
      : []),
  ];

  return (
    <div className="mt-8 bg-gradient-to-br from-background-secondary to-background-tertiary rounded-3xl p-6 md:p-8 border border-white/5">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar */}
        <div className="w-32 h-32 rounded-2xl bg-background-tertiary overflow-hidden ring-4 ring-accent-warm/30 shadow-lg">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={128}
              height={128}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-accent-warm/20 to-accent-warm/5">
              👤
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">@{profile.username}</h1>
          {profile.bio && (
            <p className="text-text-secondary text-base mb-4 max-w-xl">{profile.bio}</p>
          )}

          {/* Stats — 레시피·팁(+본인: 임시저장·비공개). 좁은 화면은 flex-wrap 으로 줄바꿈 */}
          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-3 mb-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <div className="font-bold text-2xl text-accent-warm">{stat.value}</div>
                <div className="text-text-muted text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {hasExtraInfo && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="space-y-4">
            {interests.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-text-muted mb-2">{t.profile.interestsLabel}</h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1.5 rounded-lg bg-accent-warm/10 text-accent-warm text-sm font-medium border border-accent-warm/20"
                    >
                      {interestEmojis[interest] || ''} {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {dietaryPreferences.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-text-muted mb-2">{t.profile.dietaryLabel}</h3>
                <div className="flex flex-wrap gap-2">
                  {dietaryPreferences.map((pref) => (
                    <span
                      key={pref}
                      className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium border border-success/20"
                    >
                      ✓ {pref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {allergies.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-text-muted mb-2">{t.profile.allergyLabel}</h3>
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="px-3 py-1.5 rounded-lg bg-error/10 text-error text-sm font-medium border border-error/20"
                    >
                      ⚠️ {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
