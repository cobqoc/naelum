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
 */

interface ProfileTabsProps {
  tabs: { key: TabType; label: string; icon: string }[];
  activeTab: TabType;
  onSelectTab: (key: TabType) => void;
}

export default function ProfileTabs({ tabs, activeTab, onSelectTab }: ProfileTabsProps) {
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // 활성 탭을 viewport 중앙 근처로. block: 'nearest' 로 *세로 스크롤은 안 일어남*.
    activeBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  return (
    <div className="mt-8 flex gap-2 border-b border-white/10 overflow-x-auto scrollbar-hide">
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            ref={isActive ? activeBtnRef : null}
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
  );
}
