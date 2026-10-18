/**
 * 비밀번호 보기/숨기기 토글 아이콘 — 인증 화면 공용 (2026-10-04 PAU-14).
 *
 * open=true(비밀번호 표시 중) → 눈 아이콘, false → 눈 가림 아이콘.
 * signin·reset-password·set-password·ResetPasswordModal 에 인라인으로 8벌 복제돼 있던
 * SVG 쌍과 마크업이 바이트 단위로 같다(렌더 동등성 하네스로 확인).
 * components/Settings/AccountTab.tsx 의 로컬 EyeIcon 도 같은 마크업이지만 소유 밖이라 미치환.
 */
export default function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  );
}
