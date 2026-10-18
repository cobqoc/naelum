import type { ReactNode } from 'react';

/**
 * 로그인 화면 모달 셸(배경·카드·제목·닫기 X) + 성공 체크 원형 아이콘 — 순수 표현 (2026-10-04 PAU-68).
 * FindIdModal ↔ ResetPasswordModal 에 동일하게 복제돼 있던 마크업 1벌. 바이트 단위로 원본과 같다
 * (렌더 동등성 하네스 확인). ESC 닫기는 부모(signin/page.tsx)가 그대로 처리.
 * 접근성 속성(role="dialog"·aria-modal·X aria-label)은 DOM 변경이라 이번 리팩터에서 제외(별도 결정).
 */
export default function AuthModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-background-secondary p-6 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/** 완료 화면 상단의 초록 체크 원형 아이콘 */
export function SuccessCheckCircle() {
  return (
    <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center">
      <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}
