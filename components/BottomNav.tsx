'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';
import ShoppingCartDropdown, { useCartCount } from './ShoppingCartDropdown';
import { useAuth } from '@/lib/auth/context';
import UserDropdown from './Header/UserDropdown';
import SearchBar from './SearchBar';

// lucide-react(85KB)를 번들에서 제거하기 위해 실제로 사용하는 Home 아이콘만 인라인 SVG로 대체.
// Props는 lucide의 서명과 동일하게 유지해 교체가 투명함.
function Home({ size = 22, strokeWidth = 2, className = '' }: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchIcon({ size = 22, strokeWidth = 2, className = '' }: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FridgeIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
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
  );
}

interface NavItem {
  href: string;
  Icon: React.ElementType;
  label: string;
}

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user, profile, loading: authLoading } = useAuth();
  const [showCart, setShowCart] = useState(false);
  const [showCartHint, setShowCartHint] = useState(false);
  const [showFridgeHint, setShowFridgeHint] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { count: cartCount } = useCartCount();

  const handleLogout = async () => {
    localStorage.removeItem('naelum_auto_login');
    await fetch('/api/auth/signout', { method: 'POST', redirect: 'manual' });
    window.location.href = '/';
  };

  const username = profile?.username ?? null;

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

  const navItems: NavItem[] = [
    // 참고: profile/cart/search 탭의 Icon은 실제 렌더되지 않음 (UserDropdown / emoji / custom 사용)
    // 타입 만족을 위해 Home으로 통일.
    { href: '/', Icon: Home, label: t.bottomNav.home },
    { href: '#search', Icon: SearchIcon, label: t.bottomNav.search },
    { href: '/fridge', Icon: FridgeIcon, label: t.bottomNav.fridge },
    { href: '/cart', Icon: Home, label: t.bottomNav.cart },
    { href: '/profile', Icon: Home, label: t.bottomNav.profile },
  ];

  const getHref = (item: NavItem) => {
    if (item.href === '/profile') {
      if (authLoading) return '#';
      return user && username ? `/@${username}` : '/login';
    }
    return item.href;
  };

  const isActive = (item: NavItem) => {
    if (item.href === '/cart') return false;
    if (item.href === '/') return pathname === '/';
    if (item.href === '/profile') return pathname.startsWith('/@');
    return pathname.startsWith(item.href);
  };

  return (
    <>
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" aria-label={t.bottomNav.home}>
      <div className="absolute inset-0 bg-background-secondary/90 backdrop-blur-xl border-t border-white/10" />

      <div className="relative flex items-center justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const active = isActive(item);
          const { Icon } = item;
          const isProfileTab = item.href === '/profile';
          const isCartTab = item.href === '/cart';
          const isFridgeTab = item.href === '/fridge';
          const isSearchTab = item.href === '#search';
          const label = isProfileTab && !authLoading && !user ? '로그인' : item.label;

          if (isSearchTab) {
            const isFridgeHome = pathname === '/fridge-home';
            const onSearchClick = () => {
              if (isFridgeHome) {
                window.dispatchEvent(new CustomEvent('toggle-fridge-search'));
              } else {
                setShowSearch(true);
              }
            };
            return (
              <button
                key={item.href}
                onClick={onSearchClick}
                aria-label={item.label}
                className={`relative flex flex-col items-center justify-center min-w-[3.5rem] py-2 px-2 rounded-xl transition-all ${
                  showSearch ? 'text-accent-warm' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <SearchIcon size={22} strokeWidth={showSearch ? 2.5 : 1.8} className={`transition-transform ${showSearch ? 'scale-110' : ''}`} />
                {showSearch && (
                  <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent-warm" />
                )}
              </button>
            );
          }

          if (isCartTab) {
            return (
              <div key={item.href} className="relative">
                {showCartHint && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => {
                      setShowCartHint(false);
                      window.dispatchEvent(new Event('cart-hint-closed'));
                    }} />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-60 z-50">
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
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background-secondary border-r border-b border-accent-warm/30 rotate-45" />
                    </div>
                  </>
                )}
                <button
                  onClick={() => setShowCart(prev => !prev)}
                  aria-label={label}
                  className={`relative flex flex-col items-center justify-center min-w-[4rem] py-2 px-3 rounded-xl transition-all ${
                    showCart ? 'text-accent-warm' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {showCartHint && (
                    <span className="absolute inset-0 rounded-xl animate-ping bg-accent-warm/30 pointer-events-none" />
                  )}
                  <div className="relative">
                    <span className={`text-[22px] leading-none transition-transform inline-block ${showCart ? 'scale-110' : ''}`}>🛒</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent-warm text-background-primary text-[10px] flex items-center justify-center font-bold">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </div>
                  {showCart && (
                    <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent-warm" />
                  )}
                </button>
                <ShoppingCartDropdown isOpen={showCart} onClose={() => setShowCart(false)} fromBottom />
              </div>
            );
          }

          if (isFridgeTab) {
            return (
              <div key={item.href} className="relative">
                {showFridgeHint && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowFridgeHint(false)} />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-60 z-50">
                      <div className="relative rounded-xl border border-accent-warm/30 bg-background-secondary shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-warm/50 to-transparent" />
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-bold text-text-primary flex items-center gap-1.5"><FridgeIcon size={18} /> 냉장고</span>
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
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background-secondary border-r border-b border-accent-warm/30 rotate-45" />
                    </div>
                  </>
                )}
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex flex-col items-center justify-center min-w-[4rem] py-2 px-3 rounded-xl transition-all ${
                    active ? 'text-accent-warm' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {showFridgeHint && (
                    <span className="absolute inset-0 rounded-xl animate-ping bg-accent-warm/30 pointer-events-none" />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={`transition-transform ${active ? 'scale-110' : ''}`}
                  />
                  {active && (
                    <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent-warm" />
                  )}
                </Link>
              </div>
            );
          }

          if (isProfileTab && user) {
            return (
              <UserDropdown
                key={item.href}
                user={user}
                profile={profile}
                isOpen={showUserMenu}
                onOpen={() => setShowUserMenu(true)}
                onClose={() => setShowUserMenu(false)}
                onLogout={handleLogout}
                onShowContact={() => {}}
                fromBottom
                isActive={active}
              />
            );
          }

          return (
            <Link
              key={item.href}
              href={getHref(item)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-w-[4rem] py-2 px-3 rounded-xl transition-all ${
                active ? 'text-accent-warm' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {isProfileTab ? (
                <div className="w-[26px] h-[26px] rounded-full bg-background-tertiary overflow-hidden ring-1 ring-white/20 flex items-center justify-center text-sm">
                  👤
                </div>
              ) : (
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={`transition-transform ${active ? 'scale-110' : ''}`}
                />
              )}
              {active && (
                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent-warm" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>

    {showSearch && (
      <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-label="검색">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSearch(false)} />
        <div className="absolute top-0 left-0 right-0 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-background-secondary/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <SearchBar autoFocus />
            </div>
            <button
              onClick={() => setShowSearch(false)}
              aria-label="닫기"
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-background-tertiary hover:bg-white/10 text-text-primary transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
