'use client';

import { memo, useRef, useState } from 'react';
import Link from '@/components/Common/LocalizedLink';
import dynamic from 'next/dynamic';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import type { Language } from '@/lib/i18n/translations';
import { useCartRestore } from '@/lib/shopping-list/cartRestore';
import ShoppingCartDropdown, { useCartCount } from '../ShoppingCartDropdown';
import ContactModal from '../LazyContactModal';
import CartIcon from '../icons/CartIcon';
import SearchIcon from '../icons/SearchIcon';
import NotificationPanel from './NotificationPanel';
import UserDropdown from './UserDropdown';
import { LANG_OPTIONS, useLanguageSwitch } from './useLanguageSwitch';
import { useAuth } from '@/lib/auth/context';
import { useOutsideClick } from '@/lib/hooks/useOutsideClick';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { useListKeyboardNav } from '@/lib/hooks/useListKeyboardNav';

const WriteModal = dynamic(() => import('../WriteModal'), { loading: () => null });

// 언어 목록(LANG_OPTIONS)·전환 핸들러는 UserDropdown 과 공유 — ./useLanguageSwitch (2026-10-04 PAU-32)

function Header() {
  const { language, t } = useI18n();
  const toast = useToast();
  const { user, profile } = useAuth();
  const switchLanguage = useLanguageSwitch();
  const [showLangSelector, setShowLangSelector] = useState(false);

  // 언어 선택 — 컨텍스트 즉시 전환 + URL의 [lang] 세그먼트도 교체해 서버 재렌더 유도(useLanguageSwitch).
  // 경로를 안 바꾸면 /ko 가 영어 콘텐츠를 서빙해 <title>·메타데이터가 이전 언어로 남는다(탭 제목·SEO 불일치).
  const handleLangSelect = (code: Language) => {
    switchLanguage(code);
    setShowLangSelector(false);
  };
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { count: cartCount } = useCartCount();

  // 레시피 chip → 레시피 페이지 navigate 후 뒤로 돌아왔을 때 cart 자동 재오픈.
  // 헤더 장바구니는 데스크톱(md+)에서만 보임 — 모바일은 BottomNav 가 같은 훅으로 연다 (2026-10-04 PAU-33).
  useCartRestore('desktop', () => setShowCart(true));

  const handleLogout = async () => {
    localStorage.removeItem('naelum_auto_login');
    // 서버 사이드 로그아웃: 서버가 쿠키를 직접 제거하고 홈으로 리다이렉트
    try {
      await fetch('/api/auth/signout', { method: 'POST', redirect: 'manual' });
    } catch {
      // 2026-10-04 PAU-62: 네트워크 예외 시 처리되지 않은 rejection 으로 아무 반응 없이 멈췄다.
      // 서버 쿠키가 그대로라 이동해도 로그인 상태이므로, 실패를 알리고 현재 화면에 머문다.
      toast.error(t.auth.errNetwork);
      return;
    }
    window.location.href = '/';
  };

  const closeAll = () => {
    setShowNotifications(false);
    setShowCart(false);
    setShowDropdown(false);
    setShowMoreMenu(false);
  };

  const moreMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const moreMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const langPanelRef = useRef<HTMLDivElement | null>(null);
  const langTriggerRef = useRef<HTMLButtonElement | null>(null);
  const cartTriggerRef = useRef<HTMLButtonElement | null>(null);

  // 외부 클릭 시 닫기 (이슈 #1 — overlay div 대신 document-level listener)
  useOutsideClick(showMoreMenu, moreMenuPanelRef, () => setShowMoreMenu(false), moreMenuTriggerRef);
  useOutsideClick(showLangSelector, langPanelRef, () => setShowLangSelector(false), langTriggerRef);
  // ESC 키로 닫기 — a11y baseline.
  useEscapeKey(() => setShowMoreMenu(false), showMoreMenu);
  useEscapeKey(() => setShowLangSelector(false), showLangSelector);
  // Tab focus trap — panel 안 순환·닫힐 때 trigger 복원.
  useFocusTrap(showMoreMenu, moreMenuPanelRef, moreMenuTriggerRef);
  useFocusTrap(showLangSelector, langPanelRef, langTriggerRef);
  // 화살표 키 list navigation — ↓↑/Home/End 로 항목 이동.
  useListKeyboardNav(showMoreMenu, moreMenuPanelRef);
  useListKeyboardNav(showLangSelector, langPanelRef);

  return (
    <>
      <header className="fixed top-0 z-50 w-full bg-transparent py-3 md:py-6 pointer-events-none">
        <nav className="container mx-auto flex items-center justify-between px-4 md:px-6" aria-label={t.common.mainNavAria}>
          {/* Logo + 정책 메뉴 — 로그인/비로그인 동일 위치. 우측 핵심 CTA(언어·로그인·프로필) 분리. */}
          <div className="flex items-center gap-1 md:gap-2 pointer-events-auto">
            <Link href="/" className="flex items-center gap-2" aria-label={t.common.logoHomeAria}>
              <span className="text-xl md:text-2xl font-bold tracking-tighter text-accent-warm">낼름</span>
            </Link>
            {/* 정책 메뉴 — 약관·개인정보·저작권·문의 진입점 */}
            <div className="relative">
              <button
                ref={moreMenuTriggerRef}
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
                  <div ref={moreMenuPanelRef} className="absolute left-0 top-full mt-2 w-52 rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden py-1.5">
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
                    ref={cartTriggerRef}
                    onClick={() => {
                      const next = !showCart;
                      closeAll();
                      setShowCart(next);
                    }}
                    className="relative min-w-[44px] min-h-[44px] p-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label={t.bottomNav.cart}
                    aria-expanded={showCart}
                    aria-haspopup="true"
                  >
                    <CartIcon size={24} active={showCart} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-warm text-background-primary text-xs flex items-center justify-center font-bold">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </button>

                  <ShoppingCartDropdown isOpen={showCart} onClose={() => setShowCart(false)} triggerRef={cartTriggerRef} />
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
                    ref={langTriggerRef}
                    onClick={() => setShowLangSelector(!showLangSelector)}
                    className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-2 min-h-[44px] rounded-full hover:bg-white/10 transition-colors"
                    aria-label={t.common.languageSelect}
                    aria-expanded={showLangSelector}
                    aria-haspopup="true"
                  >
                    <span className="text-base">{LANG_OPTIONS.find(l => l.code === language)?.flag ?? '🇰🇷'}</span>
                    <span className="hidden md:inline text-xs text-text-secondary">{LANG_OPTIONS.find(l => l.code === language)?.label ?? '한국어'}</span>
                    <svg className={`w-3 h-3 text-text-muted transition-transform duration-200 ${showLangSelector ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showLangSelector && (
                      <div ref={langPanelRef} className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden py-2">
                        <div className="grid grid-cols-2 gap-1 px-2">
                          {LANG_OPTIONS.map(({ code, label, flag }) => (
                            <button
                              key={code}
                              onClick={() => handleLangSelect(code)}
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
                  )}
                </div>
                {/* 로그인/가입 버튼 — PC/모바일 모두 헤더에 노출. 회원가입 진입점도 명시. */}
                <Link
                  href="/signin"
                  className="inline-flex px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-accent-warm text-background-primary text-xs md:text-sm font-medium hover:bg-accent-hover transition-colors whitespace-nowrap"
                >
                  {t.common.loginOrSignup}
                </Link>
              </>
            )}

          </div>
        </nav>
      </header>
      {/* 접근성 "콘텐츠로 건너뛰기"(AccessibilityProvider 의 href="#main-content") 대상 — 2026-10-04 PAU-01.
          대상 요소가 앱 어디에도 없어 skip link 가 무동작이었다. 헤더는 페이지마다 렌더되므로(레이아웃 단일 래퍼는
          헤더까지 감싸 건너뛸 게 없어짐) 헤더 바로 뒤에 포커스 가능한 빈 대상을 둔다. sr-only(absolute)라 화면·레이아웃 영향 없음. */}
      <div id="main-content" tabIndex={-1} className="sr-only" />

      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
      <WriteModal isOpen={showWriteModal} onClose={() => setShowWriteModal(false)} />
    </>
  );
}

// props 없는 컴포넌트 — memo 로 감싸면 자기 상태·구독 컨텍스트(i18n·auth·pathname·cart 캐시)가 바뀔 때만
// 렌더되고, 페이지 클라이언트의 무관한 상태 변경(검색 키 입력·타이머 틱 등)으로는 재렌더되지 않는다.
// 출력 동일 (perf 2026-09-27).
export default memo(Header);
