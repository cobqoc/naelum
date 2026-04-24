'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useI18n } from '@/lib/i18n/context';
import type { Language } from '@/lib/i18n/translations';
import ShoppingCartDropdown, { useCartCount } from '../ShoppingCartDropdown';
import NotificationPanel from './NotificationPanel';
import UserDropdown from './UserDropdown';
import { useAuth } from '@/lib/auth/context';

const WriteModal = dynamic(() => import('../WriteModal'), { ssr: false });
const ContactModal = dynamic(() => import('../ContactModal'), { ssr: false });

const LANG_OPTIONS = [
  { code: 'ko' as Language, label: '한국어', flag: '🇰🇷' },
  { code: 'en' as Language, label: 'English', flag: '🇺🇸' },
  { code: 'ja' as Language, label: '日本語', flag: '🇯🇵' },
  { code: 'zh' as Language, label: '中文', flag: '🇨🇳' },
  { code: 'es' as Language, label: 'Español', flag: '🇪🇸' },
  { code: 'fr' as Language, label: 'Français', flag: '🇫🇷' },
  { code: 'de' as Language, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it' as Language, label: 'Italiano', flag: '🇮🇹' },
];

export default function Header() {
  const { language, setLanguage, t } = useI18n();
  const { user, profile } = useAuth();
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { count: cartCount } = useCartCount();

  const handleLogout = async () => {
    localStorage.removeItem('naelum_auto_login');
    // 서버 사이드 로그아웃: 서버가 쿠키를 직접 제거하고 홈으로 리다이렉트
    await fetch('/api/auth/signout', { method: 'POST', redirect: 'manual' });
    window.location.href = '/';
  };

  const closeAll = () => {
    setShowNotifications(false);
    setShowCart(false);
    setShowDropdown(false);
  };

  return (
    <>
      <header className="fixed top-0 z-50 w-full bg-transparent py-3 md:py-6">
        <nav className="container mx-auto flex items-center justify-between px-4 md:px-6" aria-label="메인 네비게이션">
          {/* Logo */}
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="flex items-center gap-2" aria-label="낼름 홈으로 이동">
              <span className="text-xl md:text-2xl font-bold tracking-tighter text-accent-warm">낼름</span>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 md:gap-3">
            {user ? (
              <>
                {/* 글쓰기 버튼 */}
                <button
                  onClick={() => setShowWriteModal(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-warm text-background-primary text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  ✏️ <span>글쓰기</span>
                </button>

                {/* Shopping Cart */}
                <div className="relative hidden md:block">
                  <button
                    onClick={() => {
                      const next = !showCart;
                      closeAll();
                      setShowCart(next);
                    }}
                    className="relative min-w-[44px] min-h-[44px] p-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label={t.bottomNav.cart}
                  >
                    <span className="text-xl relative">🛒</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-warm text-background-primary text-xs flex items-center justify-center font-bold">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </button>

                  <ShoppingCartDropdown isOpen={showCart} onClose={() => setShowCart(false)} />
                </div>

                {/* Notifications */}
                <NotificationPanel
                  userId={user.id}
                  isOpen={showNotifications}
                  onOpen={() => { closeAll(); setShowNotifications(true); }}
                  onClose={() => setShowNotifications(false)}
                />

                {/* Profile Dropdown */}
                <div className="hidden md:block">
                  <UserDropdown
                    user={user}
                    profile={profile}
                    isOpen={showDropdown}
                    onOpen={() => { closeAll(); setShowDropdown(true); }}
                    onClose={() => setShowDropdown(false)}
                    onLogout={handleLogout}
                    onShowContact={() => setShowContactModal(true)}
                  />
                </div>
              </>
            ) : (
              <>
                {/* 언어 선택 (비로그인) */}
                <div className="relative">
                  <button
                    onClick={() => setShowLangSelector(!showLangSelector)}
                    className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-full hover:bg-white/10 transition-colors"
                    aria-label="언어 선택"
                  >
                    <span className="text-base">{LANG_OPTIONS.find(l => l.code === language)?.flag ?? '🇰🇷'}</span>
                    <span className="text-xs text-text-secondary">{LANG_OPTIONS.find(l => l.code === language)?.label ?? '한국어'}</span>
                    <svg className={`w-3 h-3 text-text-muted transition-transform duration-200 ${showLangSelector ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showLangSelector && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowLangSelector(false)} />
                      <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden py-2">
                        <div className="grid grid-cols-2 gap-1 px-2">
                          {LANG_OPTIONS.map(({ code, label, flag }) => (
                            <button
                              key={code}
                              onClick={() => { setLanguage(code); setShowLangSelector(false); }}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                language === code
                                  ? 'bg-accent-warm/15 text-accent-warm font-medium'
                                  : 'hover:bg-white/5 text-text-secondary'
                              }`}
                            >
                              <span className="text-base">{flag}</span>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {/* 로그인 버튼은 데스크톱에서만 — 모바일은 BottomNav에 전용 "로그인" 탭이 대신 노출됨 */}
                <Link
                  href="/login"
                  className="hidden md:inline-flex px-4 py-2 rounded-full bg-accent-warm text-background-primary text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  {t.common.login}
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
      <WriteModal isOpen={showWriteModal} onClose={() => setShowWriteModal(false)} />
    </>
  );
}
