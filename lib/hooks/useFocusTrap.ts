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
 */
export function useFocusTrap(
  isOpen: boolean,
  panelRef: RefObject<HTMLElement | null>,
  triggerRef?: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

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

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      // 닫힐 때 — panel 안에 focus 가 한 번이라도 있었고 + cleanup 시점에
      // active 가 body 면 (ESC → panel unmount → focus lost 패턴) → trigger 복원.
      // 외부 클릭으로 닫혔으면 active 가 클릭된 element 라 body 아님 → 복원 안 함.
      if (hadFocusInPanel && document.activeElement === document.body && triggerRef?.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, panelRef, triggerRef]);
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
