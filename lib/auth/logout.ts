/**
 * 로그아웃 단일 출처 — 헤더 메뉴·설정 > 계정 두 곳이 쓴다 (2026-10-19 감사 PAU-63: 둘이 다르게 동작했다).
 *
 * - 서버 라우트(/api/auth/signout)가 이 기기 세션만 끝내고 쿠키를 지운다(scope local — 다른 기기는 유지, AG2-36).
 * - 서비스워커의 레시피 오프라인 캐시를 비운다(공용 기기 — ICL-26).
 * - 풀 리로드로 홈 이동 → 장보기·즐겨찾기 모듈 캐시도 초기화.
 * - "아이디 저장" 이메일(naelum_saved_email)은 그 기능의 목적대로 남긴다. 자동 로그인 플래그만 지운다.
 *
 * 네트워크 실패면 false — 서버 쿠키가 그대로라 이동해도 로그인 상태이므로 호출부가 알리고 머문다.
 */
export async function logout(): Promise<boolean> {
  try {
    localStorage.removeItem('naelum_auto_login')
  } catch {
    // 저장소 차단 환경 — 로그아웃 자체는 계속
  }
  try {
    await fetch('/api/auth/signout', { method: 'POST', redirect: 'manual' })
  } catch {
    return false
  }
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_RECIPE_CACHE' })
  } catch {
    // SW 미지원·미등록 — 정리할 캐시 없음
  }
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 로그아웃 후 클라이언트 상태를 비우는 전체 이동
  window.location.href = '/'
  return true
}
