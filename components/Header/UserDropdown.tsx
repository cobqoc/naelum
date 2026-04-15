'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n/context';
import type { Language } from '@/lib/i18n/translations';
import { useTheme } from '@/lib/theme/context';

const LANGUAGES = [
  { code: 'ko' as Language, label: '한국어', flagClass: 'fi fi-kr' },
  { code: 'en' as Language, label: 'English', flagClass: 'fi fi-us' },
  { code: 'ja' as Language, label: '日本語', flagClass: 'fi fi-jp' },
  { code: 'zh' as Language, label: '中文', flagClass: 'fi fi-cn' },
  { code: 'es' as Language, label: 'Español', flagClass: 'fi fi-es' },
  { code: 'fr' as Language, label: 'Français', flagClass: 'fi fi-fr' },
  { code: 'de' as Language, label: 'Deutsch', flagClass: 'fi fi-de' },
  { code: 'it' as Language, label: 'Italiano', flagClass: 'fi fi-it' },
];

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
  onShowContact: () => void;
  /** 모바일 하단 네비바에서 사용할 때 true — 버튼을 nav탭 스타일로, 패널을 화면 하단에서 위로 표시 */
  fromBottom?: boolean;
  /** fromBottom 모드에서의 active 상태 */
  isActive?: boolean;
}

export default function UserDropdown({
  user, profile, isOpen, onOpen, onClose, onLogout, onShowContact, fromBottom = false, isActive = false,
}: UserDropdownProps) {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const [showLangPanel, setShowLangPanel] = useState(false);

  const handleOpen = () => {
    setShowLangPanel(false);
    onOpen();
  };

  const handleClose = () => {
    setShowLangPanel(false);
    onClose();
  };

  if (fromBottom) {
    return (
      <div className="relative">
        <button
          onClick={isOpen ? handleClose : handleOpen}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="프로필 메뉴"
          className={`relative flex flex-col items-center justify-center min-w-[4rem] py-2 px-3 rounded-xl transition-all ${
            isOpen || isActive ? 'text-accent-warm' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <div className={`w-[26px] h-[26px] rounded-full bg-background-tertiary overflow-hidden transition-transform ring-1 ${
            isOpen || isActive ? 'scale-110 ring-accent-warm' : 'ring-white/20'
          }`}>
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.username ?? '프로필'} width={26} height={26} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm">👤</div>
            )}
          </div>
          <span className={`text-[11px] mt-0.5 font-medium ${isOpen || isActive ? 'text-accent-warm' : ''}`}>
            {t.bottomNav?.profile ?? '프로필'}
          </span>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={handleClose} />
            <div className="fixed inset-x-4 bottom-20 z-[70] rounded-xl bg-background-secondary border border-white/10 shadow-2xl overflow-hidden max-w-sm mx-auto">
              {profile && (
                <Link
                  href={`/@${profile.username}`}
                  onClick={handleClose}
                  className="px-4 py-3 border-b border-white/10 flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-background-tertiary overflow-hidden flex-shrink-0">
                    {profile.avatar_url ? (
                      <Image src={profile.avatar_url} alt={profile.username} width={40} height={40} className="object-cover w-full h-full" />
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
                <Link href="/settings" onClick={handleClose} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">
                  <span>⚙️</span> {t.common.settings}
                </Link>

                <div className="px-4 py-2">
                  <button
                    onClick={() => setShowLangPanel(p => !p)}
                    className="w-full flex items-center justify-between py-1.5"
                    aria-expanded={showLangPanel}
                  >
                    <div className="flex items-center gap-3">
                      <span>🌐</span>
                      <span className="text-sm">{t.common.language ?? '언어'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-text-muted flex items-center gap-1.5">
                        <span className={`${LANGUAGES.find(l => l.code === language)?.flagClass ?? 'fi fi-kr'} text-xs`} />
                        {LANGUAGES.find(l => l.code === language)?.label}
                      </span>
                      <svg className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${showLangPanel ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {showLangPanel && (
                    <div className="mt-1.5 grid grid-cols-2 gap-1">
                      {LANGUAGES.map(({ code, label, flagClass }) => (
                        <button
                          key={code}
                          onClick={() => { setLanguage(code); setShowLangPanel(false); }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            language === code
                              ? 'bg-accent-warm/15 text-accent-warm font-medium'
                              : 'hover:bg-white/5 text-text-secondary'
                          }`}
                        >
                          <span className={`${flagClass} text-xs`} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { onShowContact(); handleClose(); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors w-full text-left"
                >
                  <span>✉️</span> 개발자에게 문의
                </button>
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

  return (
    <div className="relative">
      <button
        onClick={isOpen ? handleClose : handleOpen}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="프로필 메뉴"
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
          <div className="fixed inset-0 z-[60]" onClick={handleClose} />
          <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1rem)] rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-[70] overflow-hidden">
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
                    <span className="text-sm">언어</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-text-muted flex items-center gap-1.5">
                      <span className={`${LANGUAGES.find(l => l.code === language)?.flagClass ?? 'fi fi-kr'} text-xs`} />
                      {LANGUAGES.find(l => l.code === language)?.label}
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
                    {LANGUAGES.map(({ code, label, flagClass }) => (
                      <button
                        key={code}
                        onClick={() => { setLanguage(code); setShowLangPanel(false); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          language === code
                            ? 'bg-accent-warm/15 text-accent-warm font-medium'
                            : 'hover:bg-white/5 text-text-secondary'
                        }`}
                      >
                        <span className={`${flagClass} text-xs`} />
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
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                        theme === value
                          ? 'bg-background-secondary text-text-primary shadow-sm'
                          : 'text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { onShowContact(); handleClose(); }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors w-full text-left"
              >
                <span>✉️</span> 개발자에게 문의
              </button>

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
