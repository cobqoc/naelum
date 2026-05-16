import type { TabType } from './types';

/**
 * 프로필 탭 네비게이션 (순수 표현).
 *
 * god-file([username]/page) 분해 Phase 2. tabs 계산·activeTab·URL pushState 는
 * 부모 소유 — 자식은 목록+선택 콜백만. onClick 본문(setActiveTab + history
 * pushState)은 부모 handleSelectTab 에 byte-identical 보존. 회귀 가드:
 * e2e/profile-decomposition.spec.ts (탭 전환 → URL ?tab=).
 */

interface ProfileTabsProps {
  tabs: { key: TabType; label: string; icon: string }[];
  activeTab: TabType;
  onSelectTab: (key: TabType) => void;
}

export default function ProfileTabs({ tabs, activeTab, onSelectTab }: ProfileTabsProps) {
  return (
    <div className="mt-8 flex gap-2 border-b border-white/10">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onSelectTab(tab.key)}
          className={`px-6 py-3 text-sm font-bold rounded-t-xl transition-all ${
            activeTab === tab.key
              ? 'bg-background-secondary text-accent-warm border-b-2 border-accent-warm'
              : 'text-text-muted hover:text-text-primary hover:bg-background-secondary/50'
          }`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
