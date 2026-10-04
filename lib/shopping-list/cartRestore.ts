'use client'

import { useEffect } from 'react'

// 장바구니 레시피 chip → 레시피 페이지로 갔다가 뒤로 돌아왔을 때 장바구니 드롭다운을 다시 여는 1회성 플래그.
// 2026-10-04 PAU-33: 키 문자열·재오픈 effect 가 CartItemList(설정)·Header·BottomNav(소비) 에 흩어져 있던 것을 한 곳으로.
const CART_RESTORE_KEY = 'naelum_cart_restore'

// Tailwind 의 md 경계(48rem)와 동일 — Header 장바구니는 `hidden md:block`, BottomNav 는 `md:hidden`.
const DESKTOP_MEDIA = '(min-width: 48rem)'

/** 레시피 chip 클릭 직전에 호출 — 돌아오면 장바구니를 다시 연다. */
export function markCartRestore(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(CART_RESTORE_KEY, '1')
}

/**
 * 마운트 1회: 재오픈 플래그가 있으면 `onRestore()` 로 드롭다운을 연다.
 *
 * Header(데스크톱에서만 보이는 장바구니)와 BottomNav(모바일에서만 보이는 장바구니)가 같은 페이지에서 각자 호출한다.
 * 예전엔 두 곳이 똑같은 effect 를 갖고 있어, 같은 커밋에서 둘 다 플래그를 읽고(삭제는 마이크로태스크로 미룸)
 * 보이지 않는 쪽 드롭다운까지 열렸다(장보기 목록 중복 요청·바깥 클릭/Esc 리스너 중복). 이제 읽기·삭제 타이밍은
 * 그대로 두고 *현재 뷰포트에서 보이는 쪽*만 연다 — 사용자 눈에 보이는 결과는 이전과 같다.
 *
 * @param where 이 인스턴스의 장바구니가 보이는 뷰포트 — 'desktop'(md 이상) | 'mobile'(md 미만)
 */
export function useCartRestore(where: 'desktop' | 'mobile', onRestore: () => void): void {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(CART_RESTORE_KEY) === '1') {
      const isDesktop = window.matchMedia(DESKTOP_MEDIA).matches
      const visible = where === 'desktop' ? isDesktop : !isDesktop
      // queueMicrotask: effect 안에서 동기 setState는 cascading render 경고를 일으킴.
      // 플래그 삭제도 마이크로태스크로 미뤄야 같은 커밋의 다른 인스턴스(Header↔BottomNav)도 플래그를 읽는다.
      queueMicrotask(() => {
        if (visible) onRestore()
        sessionStorage.removeItem(CART_RESTORE_KEY)
      })
    }
    // mount 1회 — 호출자가 넘기는 onRestore(setShowCart(true))·where 는 마운트 시점 값이면 충분
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
