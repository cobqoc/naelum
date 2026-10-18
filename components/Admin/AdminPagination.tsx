'use client';

import type { Dispatch, SetStateAction } from 'react';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: Dispatch<SetStateAction<number>>;
}

/**
 * 관리자 목록 페이지네이션(이전 · n / N · 다음) — 감사 로그·신고 관리가 글자 그대로 복붙하던 블록의 단일 출처(2026-10-04).
 * 마크업·className 은 원본과 동일. 1페이지 이하면 렌더하지 않음(원본의 `totalPages > 1 &&` 와 같은 결과).
 * (사용자·레시피 관리는 경계 처리·마크업이 조금 달라 그대로 둔다.)
 */
export default function AdminPagination({ page, totalPages, onPageChange }: AdminPaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => onPageChange((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-4 py-2 rounded-lg bg-background-secondary disabled:opacity-40 hover:bg-white/10 transition-colors text-sm"
      >
        이전
      </button>
      <span className="px-4 py-2 text-sm text-text-muted">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="px-4 py-2 rounded-lg bg-background-secondary disabled:opacity-40 hover:bg-white/10 transition-colors text-sm"
      >
        다음
      </button>
    </div>
  );
}
