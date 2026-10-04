'use client';

import { useState, useRef } from 'react';
import Link from '@/components/Common/LocalizedLink';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n/context';
import type { Language } from '@/lib/i18n/translations';
import { useTheme } from '@/lib/theme/context';
import { useOutsideClick } from '@/lib/hooks/useOutsideClick';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { useListKeyboardNav } from '@/lib/hooks/useListKeyboardNav';
import { LANG_OPTIONS, useLanguageSwitch } from './useLanguageSwitch';

interface UserProfile {
  username: string;
  avatar_url: string | null;
}

interface UserDropdownProps {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onLogout: () => void;
}

// 2026-10-04 PAU-30: 모바일 하단 네비용 `fromBottom`/`isActive` 분기(약 130줄)는 호출처가 Header 한 곳뿐이고
// 그 prop 을 넘기지 않아 렌더된 적이 없는 죽은 코드라 삭제(BottomNav 는 프로필 슬롯을 헤더로 이관함).
export default function UserDropdown({
  user, profile, isOpen, onOpen, onClose, onLogout,
}: UserDropdownProps) {
  const { t, language } = useI18n();
  const { theme, setTheme } = useTheme();
  const [showLangPanel, setShowLangPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const switchLanguage = useLanguageSwitch();

  const handleOpen = () => {
    setShowLangPanel(false);
    onOpen();
  };

  const handleClose = () => {
    setShowLangPanel(false);
    onClose();
  };

  // 언어 선택 — 컨텍스트 전환 + [lang] 경로 이동(헤더 스위처와 같은 useLanguageSwitch). 경로 안 바꾸면
  // /ko 가 다른 언어 콘텐츠를 서빙해 <title>·메타데이터가 이전 언어로 남는다(로그인 메뉴 회귀).
  const handleLangSelect = (code: Language) => {
    switchLanguage(code);
    handleClose();
  };

  // 외부 클릭 시 닫기 — overlay div 대신 document-level listener (이슈 #1).
  useOutsideClick(isOpen, panelRef, handleClose, triggerRef);
  // ESC 키로 닫기 — a11y baseline.
  useEscapeKey(handleClose, isOpen);
  // Tab focus trap.
  useFocusTrap(isOpen, panelRef, triggerRef);
  // 화살표 키 list navigation.
  useListKeyboardNav(isOpen, panelRef);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={isOpen ? handleClose : handleOpen}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t.common.profileMenuAria}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-background-tertiary overflow-hidden">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-base md:text-lg">
              👤
            </div>
          )}
        </div>
      </button>

      {isOpen && (
        <>
          <div ref={panelRef} className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1rem)] rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-[70] overflow-hidden">
            {profile && (
              <Link
                href={`/@${profile.username}`}
                onClick={handleClose}
                className="px-4 py-3 border-b border-white/10 flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-background-tertiary overflow-hidden flex-shrink-0">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">@{profile.username}</p>
                  <p className="text-xs text-text-muted truncate">{user?.email}</p>
                </div>
              </Link>
            )}

            <div className="py-2">
              <Link
                href="/settings"
                onClick={handleClose}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
              >
                <span>⚙️</span> {t.common.settings}
              </Link>

              {/* Language Selector */}
              <div className="px-4 py-2">
                <button
                  onClick={() => setShowLangPanel(p => !p)}
                  className="w-full flex items-center justify-between py-1.5 group"
                >
                  <div className="flex items-center gap-3">
                    <span>🌐</span>
                    <span className="text-sm">{t.common.language}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* 2026-10-04 PAU-31: 국기 `fi fi-xx` 빈 span 제거 — flag-icons CSS 는 2026-04-16 제거돼 늘 빈 칸이었다.
                        이 묶음은 justify-between 오른쪽 끝 정렬이라 라벨 위치는 그대로. */}
                    <span className="text-sm text-text-muted flex items-center gap-1.5">
                      {LANG_OPTIONS.find(l => l.code === language)?.label}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${showLangPanel ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {showLangPanel && (
                  <div className="mt-1.5 grid grid-cols-2 gap-1">
                    {/* 2026-10-04 PAU-31: 빈 국기 span 제거. 그 span(폭 0) + gap-1.5(0.375rem) 만큼 라벨이 밀려 있었으므로
                        왼쪽 패딩을 px-2.5(0.625rem) → pl-4(1rem) 로 바꿔 라벨 위치를 그대로 유지. */}
                    {LANG_OPTIONS.map(({ code, label }) => (
                      <button
                        key={code}
                        onClick={() => handleLangSelect(code)}
                        className={`flex items-center gap-1.5 pl-4 pr-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          language === code
                            ? 'bg-accent-warm/15 text-accent-warm font-medium'
                            : 'hover:bg-white/5 text-text-secondary'
                        }`}
                      >
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Selector */}
              <div className="px-4 py-2">
                <div className="flex items-center gap-3 mb-2">
                  <span>🌓</span>
                  <span className="text-sm">{t.common.theme}</span>
                </div>
                <div className="flex bg-background-tertiary rounded-lg p-0.5 gap-0.5">
                  {([
                    { value: 'light' as const, icon: '☀️', label: t.theme.light },
                    { value: 'dark' as const, icon: '🌙', label: t.theme.dark },
                    { value: 'system' as const, icon: '⚙️', label: t.theme.system },
                  ]).map(({ value, icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      title={label}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                        theme === value
                          ? 'bg-background-secondary text-text-primary shadow-sm'
                          : 'text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      <span aria-hidden="true">{icon}</span>
                      <span className="sr-only">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { handleClose(); onLogout(); }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors w-full text-left text-error"
              >
                <span>🚪</span> {t.common.logout}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
