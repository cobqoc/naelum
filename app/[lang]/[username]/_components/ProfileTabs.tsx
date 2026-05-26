'use client';

import { useEffect, useRef } from 'react';
import type { TabType } from './types';

/**
 * 프로필 탭 네비게이션 (순수 표현).
 *
 * god-file([username]/page) 분해 Phase 2. tabs 계산·activeTab·URL pushState 는
 * 부모 소유 — 자식은 목록+선택 콜백만. onClick 본문(setActiveTab + history
 * pushState)은 부모 handleSelectTab 에 byte-identical 보존. 회귀 가드:
 * e2e/profile-decomposition.spec.ts (탭 전환 → URL ?tab=).
 *
 * 모바일 wrap fix (2026-05-25):
 *  - `overflow-x-auto scrollbar-hide` 컨테이너 + `whitespace-nowrap shrink-0` 버튼
 *    → 좁은 모바일(예: 6탭 fit 안 됨)에서 button 안 텍스트가 세로로 wrap 되던 회귀 차단.
 *  - 라벨은 *항상* 표시 — 시스템 이모지(📖·🎉 등)는 OS 별 렌더 다르고 브랜드 정체성
 *    없어 인지 anchor 역할 못함. 향후 낼름 커스텀 아이콘 셋 만들면 이모지 단독 노출 검토.
 *  - activeTab 변경 시 자동 scrollIntoView — 사용자가 *어디 탭에 있는지* + 인접 탭이
 *    뭐 있는지 자연 발견. URL `?tab=cooked` 직접 접근 시 해당 탭 즉시 보임.
 *
 * 우측 fade gradient (2026-05-25):
 *  - 6탭이 모바일 폭 초과해 가로 스크롤 발생 — 사용자가 *오른쪽 끝 탭 너머 더 있다*는
 *    걸 알기 어려움 (임시저장 탭 옆이 비어있는 듯 보이던 사용자 피드백).
 *  - 우측 끝 fade-to-bg overlay 추가 — Twitter·Slack 등 익숙한 패턴.
 *  - `pointer-events-none` 으로 fade 아래 탭 클릭 차단 X. `bottom-px` 로 border 보존.
 *  - 좌측 fade 는 첫 탭부터 자연 시작이라 생략 (A1 안).
 */

interface ProfileTabsProps {
  tabs: { key: TabType; label: string; icon: string }[];
  activeTab: TabType;
  onSelectTab: (key: TabType) => void;
  ariaLabel?: string;
}

export default function ProfileTabs({ tabs, activeTab, onSelectTab, ariaLabel }: ProfileTabsProps) {
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // 활성 탭을 viewport 중앙 근처로. block: 'nearest' 로 *세로 스크롤은 안 일어남*.
    activeBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  return (
    <div className="relative mt-8">
      <div role="tablist" aria-label={ariaLabel} className="flex gap-2 border-b border-white/10 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              ref={isActive ? activeBtnRef : null}
              role="tab"
              id={`profile-tab-${tab.key}`}
              aria-selected={isActive}
              aria-controls={`profile-panel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectTab(tab.key)}
              className={`shrink-0 whitespace-nowrap px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${
                isActive
                  ? 'bg-background-secondary text-accent-warm border-b-2 border-accent-warm'
                  : 'text-text-muted hover:text-text-primary hover:bg-background-secondary/50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>
      {/* 우측 fade — 가로 스크롤 콘텐츠가 더 있다는 시각 신호.
          pointer-events-none 으로 fade 아래 탭 클릭 가능. bottom-px 로 border 1px 보존. */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 bottom-px w-12 bg-gradient-to-l from-background-primary to-transparent"
      />
    </div>
  );
}
