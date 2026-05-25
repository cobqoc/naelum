'use client';

import { useEffect, RefObject } from 'react';

/**
 * Focus trap — dropdown/modal 열린 동안 Tab/Shift+Tab 이 panel 안에서 순환.
 * 닫힐 때 panel 안 element 가 focused 상태였으면 focus 를 trigger 로 복원
 * (외부 클릭으로 닫혔으면 사용자가 이미 다른 곳 focus 했으므로 복원 안 함).
 *
 * 패턴 일관성 — `useOutsideClick` / `useEscapeKey` 와 동일 시그니처
 * (`isOpen, panelRef, onClose, triggerRef?` 의 focus-trap 변형 = `isOpen, panelRef, triggerRef?`).
 *
 * 비-modal popup 정책: 초기 자동 focus 는 *안 함* — 사용자가 dropdown 열고
 * 시각으로만 보고 싶을 때 trigger 가 disabled 처럼 보이는 부작용 회피. Tab
 * 으로 panel 안에 진입.
 *
 * @param isOpen      listener 활성 조건 (false 면 등록 안 함)
 * @param panelRef    panel ref — 순환 대상 영역
 * @param triggerRef  trigger ref — 닫힐 때 focus 복원 대상 (optional, 있으면 복원)
 * @param options.autoRestorePreviousFocus  trigger 명시 안 됐어도 *모달 열리기 직전
 *  활성 element* 자동 기록 → 닫힐 때 거기로 복원. trigger 가 외부 컴포넌트에 있거나
 *  키보드 사용자가 다양한 element 에서 모달 열 때 유용 (FridgeAllSheet 패턴).
 */
export function useFocusTrap(
  isOpen: boolean,
  panelRef: RefObject<HTMLElement | null>,
  triggerRef?: RefObject<HTMLElement | null>,
  options?: { autoRestorePreviousFocus?: boolean },
): void {
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    // 자동 이전 focus 기록 — trigger 가 명시 안 됐어도 외부 element 복원 가능.
    const previousFocus = options?.autoRestorePreviousFocus
      ? (document.activeElement as HTMLElement | null)
      : null;

    // panel 안에 focus 가 한 번이라도 들어왔는지 추적 — cleanup 시점에
    // panel 이 이미 unmount 됐을 수 있어 `panel.contains(activeElement)`
    // 만으로는 부족하다 (panel DOM 제거 시 active 가 body 로 이동).
    let hadFocusInPanel = false;
    const handleFocusIn = (e: FocusEvent) => {
      if (panel.contains(e.target as Node)) hadFocusInPanel = true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusableElements(panel);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Tab → 마지막에서 첫으로 순환
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
        return;
      }
      // Shift+Tab → 첫에서 마지막으로 순환
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
        return;
      }
      // focus 가 panel 밖에 있는 상태에서 Tab → panel 안 첫 element 로
      if (!panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    // trigger 를 effect 진입 시점에 복사 — cleanup 시 stale closure 경고 회피
    // (react-hooks/exhaustive-deps). trigger 는 보통 모달 외부 컴포넌트 소유라
    // 모달 unmount 와 무관하게 안정.
    const triggerEl = triggerRef?.current ?? null;

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      // 닫힐 때 — panel 안에 focus 가 한 번이라도 있었고 + cleanup 시점에
      // active 가 body 면 (ESC → panel unmount → focus lost 패턴) → 복원.
      // 외부 클릭으로 닫혔으면 active 가 클릭된 element 라 body 아님 → 복원 안 함.
      // 우선순위: triggerEl > previousFocus (둘 중 있는 것).
      if (hadFocusInPanel && document.activeElement === document.body) {
        if (triggerEl) {
          triggerEl.focus();
        } else if (previousFocus && previousFocus !== document.body) {
          previousFocus.focus?.();
        }
      }
    };
  }, [isOpen, panelRef, triggerRef, options?.autoRestorePreviousFocus]);
}

/**
 * panel 안의 focusable element 목록을 DOM 순서대로 반환.
 * disabled·aria-hidden·display:none 제외.
 */
function getFocusableElements(panel: HTMLElement): HTMLElement[] {
  const sel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(panel.querySelectorAll<HTMLElement>(sel))
    .filter(el => el.getAttribute('aria-hidden') !== 'true')
    .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
}
