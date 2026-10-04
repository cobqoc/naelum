/**
 * 인증 페이지 "확인 중…" 전체 화면 스피너 — 순수 표현 (2026-10-04 PAU-14).
 * reset-password·signup/set-password·auth/terms-agreement 에 동일 10줄로 3벌 있던 것을 1벌로.
 * 마크업은 원본과 바이트 단위로 같다(렌더 동등성 하네스로 확인).
 */
export default function AuthCheckingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary">
      <div className="flex items-center gap-3 text-text-muted">
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        {label}
      </div>
    </div>
  );
}
