'use client';

import { useEffect, useState } from 'react';
import Link from '@/components/Common/LocalizedLink';
import dynamic from 'next/dynamic';
import { useI18n } from '@/lib/i18n/context';
import type { Language } from '@/lib/i18n/translations';
import ShoppingCartDropdown, { useCartCount } from '../ShoppingCartDropdown';
import CartIcon from '../icons/CartIcon';
import SearchIcon from '../icons/SearchIcon';
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { count: cartCount } = useCartCount();

  // 레시피 chip → 레시피 페이지 navigate 후 뒤로 돌아왔을 때 cart 자동 재오픈.
  // BottomNav도 동일 로직을 갖고 있어서 PC/모바일 viewport 어느 쪽에서도 복원됨.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('naelum_cart_restore') === '1') {
      // queueMicrotask: effect 안에서 동기 setState는 cascading render 경고를 일으킴
      queueMicrotask(() => {
        setShowCart(true);
        sessionStorage.removeItem('naelum_cart_restore');
      });
    }
  }, []);

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
    setShowMoreMenu(false);
  };

  return (
    <>
      <header className="fixed top-0 z-50 w-full bg-transparent py-3 md:py-6 pointer-events-none">
        <nav className="container mx-auto flex items-center justify-between px-4 md:px-6" aria-label="메인 네비게이션">
          {/* Logo + 정책 메뉴 — 로그인/비로그인 동일 위치. 우측 핵심 CTA(언어·로그인·프로필) 분리. */}
          <div className="flex items-center gap-1 md:gap-2 pointer-events-auto">
            <Link href="/" className="flex items-center gap-2" aria-label="낼름 홈으로 이동">
              <span className="text-xl md:text-2xl font-bold tracking-tighter text-accent-warm">낼름</span>
            </Link>
            {/* 정책 메뉴 — 약관·개인정보·저작권·문의 진입점 */}
            <div className="relative">
              <button
                onClick={() => {
                  const next = !showMoreMenu;
                  closeAll();
                  setShowMoreMenu(next);
                }}
                className="min-w-[40px] min-h-[40px] md:min-w-[44px] md:min-h-[44px] p-2 md:p-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                aria-label={t.common.moreMenu}
                aria-expanded={showMoreMenu}
                aria-haspopup="true"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
                  <circle cx="5" cy="12" r="1.2" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                  <circle cx="19" cy="12" r="1.2" fill="currentColor" />
                </svg>
              </button>
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div className="absolute left-0 top-full mt-2 w-52 rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden py-1.5">
                    <Link
                      href="/terms"
                      onClick={() => setShowMoreMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                    >
                      <span aria-hidden="true">📜</span>
                      <span>{t.meta.termsTitle}</span>
                    </Link>
                    <Link
                      href="/privacy"
                      onClick={() => setShowMoreMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                    >
                      <span aria-hidden="true">🔒</span>
                      <span>{t.meta.privacyTitle}</span>
                    </Link>
                    <Link
                      href="/copyright"
                      onClick={() => setShowMoreMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                    >
                      <span aria-hidden="true">©</span>
                      <span>{t.meta.copyrightTitle}</span>
                    </Link>
                    <div className="my-1 border-t border-white/5" />
                    <button
                      type="button"
                      onClick={() => { setShowMoreMenu(false); setShowContactModal(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors text-left"
                    >
                      <span aria-hidden="true">✉️</span>
                      <span>{t.contact.title.replace(/^✉️\s*/, '')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
            {/* 검색 — 데스크톱 전용. 모바일은 BottomNav 검색 아이콘으로 접근 */}
            <Link
              href="/search"
              aria-label={t.bottomNav.search}
              className="hidden md:flex min-w-[44px] min-h-[44px] p-2.5 rounded-full hover:bg-white/10 transition-colors items-center justify-center"
            >
              <SearchIcon size={24} />
            </Link>
            {user ? (
              <>
                {/* 글쓰기 버튼 — PC: solid orange + 텍스트. */}
                <button
                  onClick={() => setShowWriteModal(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-warm text-background-primary text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  ✏️ <span>{t.common.write}</span>
                </button>
                {/* 글쓰기 버튼 — 모바일: ghost 아이콘 (다른 헤더 아이콘들과 톤 통일). */}
                <button
                  onClick={() => setShowWriteModal(true)}
                  aria-label={t.common.write}
                  className="md:hidden min-w-[40px] min-h-[40px] p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  <span className="text-lg leading-none" aria-hidden="true">✏️</span>
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
                    <CartIcon size={24} active={showCart} />
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

                {/* Profile Dropdown — PC + 모바일 모두 노출. BottomNav에도 프로필 슬롯이 있지만
                    모바일 헤더 우측이 비어 보이는 문제 해결을 위해 헤더에도 추가. */}
                <UserDropdown
                  user={user}
                  profile={profile}
                  isOpen={showDropdown}
                  onOpen={() => { closeAll(); setShowDropdown(true); }}
                  onClose={() => setShowDropdown(false)}
                  onLogout={handleLogout}
                />
              </>
            ) : (
              <>
                {/* 언어 선택 (비로그인) */}
                <div className="relative">
                  <button
                    onClick={() => setShowLangSelector(!showLangSelector)}
                    className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-2 min-h-[44px] rounded-full hover:bg-white/10 transition-colors"
                    aria-label={t.common.languageSelect}
                  >
                    <span className="text-base">{LANG_OPTIONS.find(l => l.code === language)?.flag ?? '🇰🇷'}</span>
                    <span className="hidden md:inline text-xs text-text-secondary">{LANG_OPTIONS.find(l => l.code === language)?.label ?? '한국어'}</span>
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
                {/* 로그인/가입 버튼 — PC/모바일 모두 헤더에 노출. 회원가입 진입점도 명시. */}
                <Link
                  href="/login"
                  className="inline-flex px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-accent-warm text-background-primary text-xs md:text-sm font-medium hover:bg-accent-hover transition-colors whitespace-nowrap"
                >
                  {t.common.loginOrSignup}
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
