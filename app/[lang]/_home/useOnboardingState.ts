'use client';

import { useState, useEffect } from 'react';
import { LS_KEY_ONBOARDING_BANNER } from './constants';

// useAuth().user 의 최소 shape — 전체 Supabase User 가 아닌 우리 context 가 noise 줄여 노출하는 형태.
type AuthUser = { id: string; email: string } | null;

/**
 * 온보딩 banner/modal 상태 — HomeClient 분해 (2026-05-25).
 *
 * 독립 도메인 — 냉장고/추천 state 와 race 없음.
 * 임시 username(user_xxxxxxxxxxxx) 또는 onboarding_completed=false 유저에게 배너 표시.
 *
 * 표시 조건:
 *  - 임시 username (`user_` + 12 hex 패턴) — 정식 닉네임 설정 안 한 유저
 *  - 또는 `onboarding_completed=false` (명시적 미완료. skip 한 유저는 true 라 대상 아님)
 *  - 둘 다 아니면 needsOnboarding=false → 배너 미표시
 *
 * dismiss 동작:
 *  - X 버튼 또는 OnboardingWizard 완료 시 localStorage 영구 dismiss
 *  - 자동 dismiss 없음 (유저가 배너 읽을 시간 충분 보장)
 */
export interface UseOnboardingStateParams {
  user: AuthUser;
  /** SSR 초기 username (useAuth.profile hydration 전 fallback) */
  initialUsername: string | null;
  /** useAuth.profile.username (hydration 후 우선 사용) */
  profileUsername: string | null | undefined;
  /** SSR fetch한 profiles.onboarding_completed */
  initialOnboardingCompleted: boolean | null;
}

export interface UseOnboardingStateResult {
  showOnboardingBanner: boolean;
  setShowOnboardingBanner: (v: boolean) => void;
  showOnboardingModal: boolean;
  setShowOnboardingModal: (v: boolean) => void;
  /** 현재 사용자 username (profile.username 우선, 없으면 initialUsername) */
  currentUsername: string | null;
  /** 임시 username 사용 중 여부 */
  hasTempUsername: boolean;
  /** 온보딩 미완료 여부 (배너 + modal 표시 트리거) */
  needsOnboarding: boolean;
}

export function useOnboardingState({
  user,
  initialUsername,
  profileUsername,
  initialOnboardingCompleted,
}: UseOnboardingStateParams): UseOnboardingStateResult {
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // 클라이언트 hydration 후엔 useAuth 의 profile 을, SSR 초기 HTML 에선 initialUsername 을 사용.
  const currentUsername = profileUsername ?? initialUsername;
  const hasTempUsername = !!currentUsername && /^user_[a-f0-9]{12}$/.test(currentUsername);

  // 온보딩 미완료 판정:
  //  - 임시 username(user_xxxxxxxxxxxx) 유저 → 임시 username 탈출 필요
  //  - 또는 onboarding_completed=false (명시적 미완료. skip 한 유저는 true 라 대상 아님)
  const needsOnboarding = hasTempUsername || initialOnboardingCompleted === false;

  useEffect(() => {
    if (!user) return;
    if (!needsOnboarding) return;
    const dismissed = localStorage.getItem(LS_KEY_ONBOARDING_BANNER(user.id));
    if (!dismissed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage는 브라우저에서만 읽을 수 있어 render 단계에서 파생 불가
      setShowOnboardingBanner(true);
      // 자동 dismiss 제거 — X 버튼 또는 OnboardingWizard 완료 시에만 영구 dismiss.
    }
  }, [user, needsOnboarding]);

  return {
    showOnboardingBanner,
    setShowOnboardingBanner,
    showOnboardingModal,
    setShowOnboardingModal,
    currentUsername,
    hasTempUsername,
    needsOnboarding,
  };
}
