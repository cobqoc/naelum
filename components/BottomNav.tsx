'use client';

import Link from '@/components/Common/LocalizedLink';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';
import ShoppingCartDropdown, { useCartCount } from './ShoppingCartDropdown';
import SearchBar from './SearchBar';
import { track } from '@/lib/analytics/track';

// 홈 탭 아이콘 — PC 헤더 원본 실루엣 + 홈 FridgeSVG 팔레트 (teal→terracotta 빨강, 블랙→다크레드, 골드 유지).
function FridgeIcon({ size = 30, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 90 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-opacity"
      style={{ opacity: active ? 1 : 0.72 }}
    >
      {/* 바디 (terracotta — FridgeSVG bodyG) */}
      <rect x="4" y="4" width="60" height="92" rx="6" fill="#e85a3a" stroke="#7a1810" strokeWidth="5"/>
      {/* 왼쪽 냉동실 도어 (어두운 terracotta — bodyDark) */}
      <rect x="4" y="4" width="28" height="62" rx="6" fill="#c93820"/>
      {/* 냉장↔냉동 구분 레일 */}
      <rect x="4" y="66" width="60" height="4" fill="#7a1810"/>
      {/* 왼쪽 도어 표시(골드 라벨) — creamFrontG */}
      <rect x="9" y="14" width="17" height="10" rx="2" fill="#f4c030" stroke="#7a1810" strokeWidth="2.5"/>
      {/* 오른쪽 냉장실 내부 (interiorG 라이트 블루) */}
      <rect x="32" y="4" width="32" height="62" fill="#e8f7ff"/>
      {/* 선반 레일 (크롬톤 대신 어두운 terracotta) */}
      <rect x="55" y="12" width="3" height="16" rx="1" fill="#7a1810" opacity="0.4"/>
      <rect x="59" y="12" width="3" height="16" rx="1" fill="#7a1810" opacity="0.4"/>
      {/* 식재료: 닭고기 (bottleAmber 톤) */}
      <ellipse cx="47" cy="30" rx="7" ry="5" fill="#e09848" stroke="#7a3c10" strokeWidth="2"/>
      {/* 식재료: 스테이크 (진한 amber) */}
      <path d="M42 42 L52 42 L50 50 L44 50 Z" fill="#b07840" stroke="#7a1810" strokeWidth="2"/>
      {/* 식재료: 빨간 병/캔디 (bottleRed) */}
      <rect x="42" y="52" width="4" height="8" rx="1" fill="#e85040" stroke="#7a1810" strokeWidth="2"/>
      <rect x="48" y="52" width="4" height="8" rx="1" fill="#e85040" stroke="#7a1810" strokeWidth="2"/>
      {/* 오른쪽 사이드 패널 (terracotta) */}
      <rect x="64" y="4" width="20" height="62" rx="4" fill="#e85a3a" stroke="#7a1810" strokeWidth="4"/>
      {/* 사이드 패널 장식 라인 */}
      <rect x="68" y="18" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35"/>
      <rect x="68" y="26" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35"/>
      <rect x="68" y="34" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35"/>
      {/* 도어 손잡이 (다크 terracotta) */}
      <rect x="28" y="20" width="8" height="14" rx="4" fill="#7a1810"/>
      <rect x="28" y="42" width="8" height="14" rx="4" fill="#7a1810"/>
      {/* 하단 냉동실 (terracotta) */}
      <rect x="4" y="70" width="60" height="26" rx="6" fill="#e85a3a"/>
      {/* 냉동실 손잡이 */}
      <rect x="28" y="80" width="12" height="6" rx="3" fill="#7a1810"/>
    </svg>
  );
}

// 검색 아이콘 — viewBox 꽉 채움. 렌즈 r=9.5, 손잡이 대각선 (23, 23)까지.
function SearchIcon({ size = 30, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-opacity"
      style={{ opacity: active ? 1 : 0.72 }}
    >
      {/* 손잡이 그림자 */}
      <line x1="14.5" y1="14.5" x2="23" y2="23" stroke="#3a1404" strokeWidth="4.2" strokeLinecap="round" opacity="0.3"/>
      {/* 손잡이 */}
      <line x1="14.5" y1="14.5" x2="23" y2="23" stroke="#7a3c10" strokeWidth="3.8" strokeLinecap="round"/>
      <line x1="14.5" y1="14.5" x2="23" y2="23" stroke="#c85a1a" strokeWidth="2.4" strokeLinecap="round"/>
      {/* 렌즈 바깥 림 */}
      <circle cx="10" cy="10" r="9" fill="#ffb077" stroke="#7a3c10" strokeWidth="1.5"/>
      {/* 렌즈 유리 */}
      <circle cx="10" cy="10" r="6.4" fill="#fff4e6" stroke="#c85a1a" strokeWidth="0.5"/>
      {/* 유리 하이라이트 (초승달 반사) */}
      <path d="M5.5 8.5 Q7 5.5, 10.5 5" stroke="#ffffff" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.9"/>
      {/* 미세 글레어 점 */}
      <circle cx="11" cy="12.5" r="0.7" fill="#ffffff" opacity="0.7"/>
    </svg>
  );
}

// 장보기 아이콘 — 우드 바구니 + 컬러풀 식재료. viewBox 꽉 채움.
function CartIcon({ size = 30, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-opacity"
      style={{ opacity: active ? 1 : 0.72 }}
    >
      {/* 손잡이 (아치, 위로 확장) */}
      <path d="M5.5 7 Q5.5 1.5, 12 1.5 Q18.5 1.5, 18.5 7" stroke="#7a3c10" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M5.5 7 Q5.5 1.5, 12 1.5 Q18.5 1.5, 18.5 7" stroke="#c08040" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
      {/* 바구니 바디 (더 넓고 깊게) */}
      <path d="M2 7 L22 7 L20 22.5 L4 22.5 Z" fill="#e8a052" stroke="#7a3c10" strokeWidth="1" strokeLinejoin="round"/>
      {/* 바구니 상단 테두리 (림) */}
      <rect x="2" y="7" width="20" height="1.2" fill="#c08040" stroke="#7a3c10" strokeWidth="0.5"/>
      {/* 위빙 라인 */}
      <line x1="3" y1="11" x2="21" y2="11" stroke="#7a3c10" strokeWidth="0.6" opacity="0.45"/>
      <line x1="3.3" y1="14.5" x2="20.7" y2="14.5" stroke="#7a3c10" strokeWidth="0.6" opacity="0.45"/>
      <line x1="3.6" y1="18" x2="20.4" y2="18" stroke="#7a3c10" strokeWidth="0.6" opacity="0.45"/>
      {/* 세로 위빙 */}
      <line x1="8" y1="8" x2="7.5" y2="22" stroke="#7a3c10" strokeWidth="0.4" opacity="0.35"/>
      <line x1="12" y1="8" x2="12" y2="22" stroke="#7a3c10" strokeWidth="0.4" opacity="0.35"/>
      <line x1="16" y1="8" x2="16.5" y2="22" stroke="#7a3c10" strokeWidth="0.4" opacity="0.35"/>
      {/* 바구니 안 식재료 (크게 엿보임) */}
      <circle cx="7" cy="7" r="2.3" fill="#c93820" stroke="#7a1810" strokeWidth="0.4"/>
      <circle cx="12" cy="6.3" r="2.6" fill="#60b050" stroke="#1f4a18" strokeWidth="0.4"/>
      <circle cx="17" cy="7" r="2.1" fill="#f4c030" stroke="#a07018" strokeWidth="0.4"/>
      {/* 토마토 하이라이트 */}
      <ellipse cx="6.4" cy="6.3" rx="0.5" ry="0.7" fill="#ffffff" opacity="0.5"/>
      {/* 양상추 잎맥 */}
      <path d="M10.5 5.5 Q12 6.5, 13.5 5.5" stroke="#2a6520" strokeWidth="0.35" fill="none"/>
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
  const [showCart, setShowCart] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { count: cartCount } = useCartCount();

  // 프로필 슬롯은 모바일 헤더로 이관됨(중복 제거). 향후 다른 슬롯(예: 글쓰기) 추가 가능.
  const navItems: NavItem[] = [
    { href: '/', Icon: FridgeIcon, label: t.bottomNav.fridge },
    { href: '#search', Icon: SearchIcon, label: t.bottomNav.search },
    { href: '/cart', Icon: CartIcon, label: t.bottomNav.cart },
  ];

  const isActive = (item: NavItem) => {
    if (item.href === '/cart') return false;
    if (item.href === '/') return pathname === '/';
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
          const isCartTab = item.href === '/cart';
          const isSearchTab = item.href === '#search';
          const label = item.label;

          if (isSearchTab) {
            // 홈(냉장고 UI)에서는 인라인 검색바로 토글, 그 외 페이지에서는 오버레이 모달을 띄움.
            const isFridgeHome = pathname === '/';
            const onSearchClick = () => {
              track('bottomnav_search_click', { from_home: isFridgeHome });
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
                <div className={`transition-transform ${showSearch ? 'scale-110' : ''}`}>
                  <SearchIcon size={30} active={showSearch} />
                </div>
                {showSearch && (
                  <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent-warm" />
                )}
              </button>
            );
          }

          if (isCartTab) {
            return (
              <div key={item.href} className="relative">
                <button
                  onClick={() => setShowCart(prev => !prev)}
                  aria-label={label}
                  className={`relative flex flex-col items-center justify-center min-w-[4rem] py-2 px-3 rounded-xl transition-all ${
                    showCart ? 'text-accent-warm' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <div className="relative">
                    <div className={`transition-transform ${showCart ? 'scale-110' : ''}`}>
                      <CartIcon size={30} active={showCart} />
                    </div>
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-error text-white text-[10px] flex items-center justify-center font-bold ring-1 ring-background-secondary">
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

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-w-[4rem] py-2 px-3 rounded-xl transition-all ${
                active ? 'text-accent-warm' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <div className={`transition-transform ${active ? 'scale-110' : ''}`}>
                <Icon size={30} active={active} />
              </div>
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
        <div className="absolute top-0 left-0 right-0 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 bg-background-secondary/95 backdrop-blur-xl border-b border-white/10 shadow-2xl space-y-3">
          {/* 페이지 빠른 이동 — 홈 레이아웃 해치지 않고 다른 페이지 접근 경로 제공. */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/recipes"
              onClick={() => { track('search_overlay_pill_click', { pill: 'recipes' }); setShowSearch(false); }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-tertiary hover:bg-white/10 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors active:scale-95"
            >
              <span>📋</span><span>{t.home.navRecipes}</span>
            </Link>
            <Link
              href="/tip"
              onClick={() => { track('search_overlay_pill_click', { pill: 'tips' }); setShowSearch(false); }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-background-tertiary hover:bg-white/10 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors active:scale-95"
            >
              <span>💡</span><span>{t.home.navTips}</span>
            </Link>
          </div>

          {/* 검색창 */}
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <SearchBar autoFocus />
            </div>
            <button
              onClick={() => setShowSearch(false)}
              aria-label={t.common.close}
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
