'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useI18n } from '@/lib/i18n/context';
import type { Language } from '@/lib/i18n/translations';
import ShoppingCartDropdown, { useCartCount } from '../ShoppingCartDropdown';
import FridgeDropdown, { useFridgeCount } from '../FridgeDropdown';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCartHint, setShowCartHint] = useState(false);
  const [showFridge, setShowFridge] = useState(false);
  const [showFridgeHint, setShowFridgeHint] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { count: cartCount } = useCartCount();
  const { expiringCount, totalCount: fridgeTotalCount } = useFridgeCount();

  // 힌트 표시: 매 페이지 로드마다 표시, "다시 보지 않기" 누르면 영구 숨김
  const hintInitRef = useRef(false);
  useEffect(() => {
    if (!user || hintInitRef.current) return;
    hintInitRef.current = true;
    const showCart = !localStorage.getItem('cart_hint_v3_never');
    const showFridge = !showCart && !localStorage.getItem('fridge_hint_v3_never');
    if (showCart || showFridge) {
      queueMicrotask(() => {
        if (showCart) setShowCartHint(true);
        else if (showFridge) setShowFridgeHint(true);
      });
    }
  }, [user]);

  // 스크롤 감지
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 장보기 힌트 닫히면 냉장고 힌트 표시
  useEffect(() => {
    const handler = () => {
      if (!localStorage.getItem('fridge_hint_v3_never')) {
        setShowFridgeHint(true);
      }
    };
    window.addEventListener('cart-hint-closed', handler);
    return () => window.removeEventListener('cart-hint-closed', handler);
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
    setShowFridge(false);
    setShowDropdown(false);
    setShowFridgeHint(false);
    setShowCartHint(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-background-secondary/90 py-2 md:py-3 backdrop-blur-xl shadow-lg'
            : 'bg-transparent py-3 md:py-6'
        }`}
      >
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

                {/* Fridge */}
                <div className="relative hidden md:block">
                  <button
                    onClick={() => {
                      const next = !showFridge;
                      closeAll();
                      setShowFridge(next);
                      if (showFridgeHint) setShowFridgeHint(false);
                    }}
                    className="relative min-w-[44px] min-h-[44px] p-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label="냉장고"
                  >
                    {showFridgeHint && (
                      <span className="absolute inset-0 rounded-full animate-ping bg-accent-warm/30 pointer-events-none" />
                    )}
                    <svg className="relative" width="22" height="22" viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="4" y="4" width="60" height="92" rx="6" fill="#5BA8B5" stroke="#111" strokeWidth="5"/>
                      <rect x="4" y="4" width="28" height="62" rx="6" fill="#4A8F9C"/>
                      <rect x="4" y="66" width="60" height="4" fill="#111"/>
                      <rect x="9" y="14" width="17" height="10" rx="2" fill="#F5C842" stroke="#111" strokeWidth="2.5"/>
                      <rect x="32" y="4" width="32" height="62" fill="#A8DDE8"/>
                      <rect x="55" y="12" width="3" height="16" rx="1" fill="#111" opacity="0.4"/>
                      <rect x="59" y="12" width="3" height="16" rx="1" fill="#111" opacity="0.4"/>
                      <ellipse cx="47" cy="30" rx="7" ry="5" fill="#C8925A" stroke="#111" strokeWidth="2"/>
                      <path d="M42 42 L52 42 L50 50 L44 50 Z" fill="#B07840" stroke="#111" strokeWidth="2"/>
                      <rect x="42" y="52" width="4" height="8" rx="1" fill="#E07070" stroke="#111" strokeWidth="2"/>
                      <rect x="48" y="52" width="4" height="8" rx="1" fill="#E07070" stroke="#111" strokeWidth="2"/>
                      <rect x="64" y="4" width="20" height="62" rx="4" fill="#5BA8B5" stroke="#111" strokeWidth="4"/>
                      <rect x="68" y="18" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
                      <rect x="68" y="26" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
                      <rect x="68" y="34" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
                      <rect x="28" y="20" width="8" height="14" rx="4" fill="#111"/>
                      <rect x="28" y="42" width="8" height="14" rx="4" fill="#111"/>
                      <rect x="4" y="70" width="60" height="26" rx="6" fill="#5BA8B5"/>
                      <rect x="28" y="80" width="12" height="6" rx="3" fill="#111"/>
                    </svg>
                    {expiringCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-xs flex items-center justify-center font-bold">
                        {expiringCount > 9 ? '9+' : expiringCount}
                      </span>
                    )}
                    {expiringCount === 0 && fridgeTotalCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-warm text-background-primary text-xs flex items-center justify-center font-bold">
                        {fridgeTotalCount > 9 ? '9+' : fridgeTotalCount}
                      </span>
                    )}
                  </button>

                  {showFridgeHint && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowFridgeHint(false)} />
                      <div className="absolute right-0 top-full mt-3 w-60 z-50">
                        <div className="absolute -top-2 right-4 w-4 h-4 bg-background-secondary border-l border-t border-accent-warm/30 rotate-45" />
                        <div className="relative rounded-xl border border-accent-warm/30 bg-background-secondary shadow-2xl overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-warm/50 to-transparent" />
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">🧊 냉장고</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowFridgeHint(false); }}
                                className="w-5 h-5 flex items-center justify-center rounded-full bg-error/20 hover:bg-error/30 text-error transition-all flex-shrink-0"
                                aria-label="닫기"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed mb-3">
                              보유한 재료를 등록하면<br />
                              <span className="text-accent-warm font-medium">만들 수 있는 레시피</span>를 바로 추천해드려요!
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                localStorage.setItem('fridge_hint_v3_never', '1');
                                setShowFridgeHint(false);
                              }}
                              className="w-full py-1.5 rounded-lg bg-accent-warm/15 hover:bg-accent-warm/25 text-xs text-accent-warm font-medium transition-colors"
                            >
                              다시 보지 않기
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <FridgeDropdown isOpen={showFridge} onClose={() => setShowFridge(false)} />
                </div>

                {/* Shopping Cart */}
                <div className="relative hidden md:block">
                  <button
                    onClick={() => {
                      const next = !showCart;
                      closeAll();
                      setShowCart(next);
                      if (showCartHint) {
                        setShowCartHint(false);
                        window.dispatchEvent(new Event('cart-hint-closed'));
                      }
                    }}
                    className="relative min-w-[44px] min-h-[44px] p-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label="장보기 리스트"
                  >
                    {showCartHint && (
                      <span className="absolute inset-0 rounded-full animate-ping bg-accent-warm/30 pointer-events-none" />
                    )}
                    <span className="text-xl relative">🛒</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-warm text-background-primary text-xs flex items-center justify-center font-bold">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </button>

                  {showCartHint && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => {
                        setShowCartHint(false);
                        window.dispatchEvent(new Event('cart-hint-closed'));
                      }} />
                      <div className="absolute right-0 top-full mt-3 w-60 z-50">
                        <div className="absolute -top-2 right-4 w-4 h-4 bg-background-secondary border-l border-t border-accent-warm/30 rotate-45" />
                        <div className="relative rounded-xl border border-accent-warm/30 bg-background-secondary shadow-2xl overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-warm/50 to-transparent" />
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-sm font-bold text-text-primary flex items-center gap-1.5">🛒 장보기 리스트</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCartHint(false);
                                  window.dispatchEvent(new Event('cart-hint-closed'));
                                }}
                                className="w-5 h-5 flex items-center justify-center rounded-full bg-error/20 hover:bg-error/30 text-error transition-all flex-shrink-0"
                                aria-label="닫기"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed mb-3">
                              레시피 재료를 추가하면<br />
                              <span className="text-accent-warm font-medium">여기서 바로 확인</span>하고 체크할 수 있어요!
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                localStorage.setItem('cart_hint_v3_never', '1');
                                setShowCartHint(false);
                                window.dispatchEvent(new Event('cart-hint-closed'));
                              }}
                              className="w-full py-1.5 rounded-lg bg-accent-warm/15 hover:bg-accent-warm/25 text-xs text-accent-warm font-medium transition-colors"
                            >
                              다시 보지 않기
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

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
                <Link
                  href="/login"
                  className="inline-flex px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-accent-warm text-background-primary text-sm font-medium hover:bg-accent-hover transition-colors"
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
