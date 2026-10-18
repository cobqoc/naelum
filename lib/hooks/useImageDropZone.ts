'use client';

import { useState, useMemo, type DragEvent } from 'react';

/**
 * 이미지 드래그 앤 드롭 영역 hook — 페이지마다 반복되던 4 함수 (drag/dragIn/dragOut/drop)
 * 를 hook 1 줄로 대체.
 *
 * **Why 추출** ([[feedback-check-line-count-before-adding]]):
 *  - `recipes/new` 만 봐도 thumbnail × 4 + ingredients × 4 = 8 함수 (~35줄)
 *  - 같은 boilerplate 가 `recipes/[id]/edit` 에 4 함수 더 반복
 *  - 단일 책임 (drag UI 상태 + 파일 추출) 이 hook 1 줄로 표현 가능
 *
 * **사용 패턴**:
 *   const thumbDrop = useImageDropZone(thumbUpload.upload);
 *   // <div {...thumbDrop.dropZoneProps}>
 *   //   {thumbDrop.isDragging ? '...' : '...'}
 *
 * **불변식**:
 *  - drag* 핸들러는 모두 e.preventDefault + stopPropagation (브라우저 기본 차단)
 *  - drop 은 항상 isDragging=false. dragLeave 는 드롭존 *밖*으로 나갈 때만 false
 *    (드롭존 안의 자식 — 아이콘·문구 — 위로 옮겨 갈 때는 강조 유지)
 *  - drop 시 files[0] 만 처리 (single-file 정책 — 멀티 업로드 미지원)
 *  - onFile 호출은 file 존재 시에만 (빈 drop 무시)
 *
 * **단계 이미지 (per-index) 미지원** — `.map()` 안에서 hook 호출 불가. 그 경우는
 * 인라인 핸들러 유지(recipes new/edit 의 단계 이미지 드롭존).
 */
export function useImageDropZone(onFile: (file: File) => void): {
  isDragging: boolean;
  dropZoneProps: {
    onDragOver: (e: DragEvent) => void;
    onDragEnter: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  };
} {
  const [isDragging, setIsDragging] = useState(false);

  // useMemo 로 props 객체 stable reference — 자식 컴포넌트 불필요 re-render 회피.
  // onFile 이 매 렌더 새 함수면 deps 변동, 호출자가 안정성 책임.
  const dropZoneProps = useMemo(
    () => ({
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      },
      onDragEnter: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      },
      onDragLeave: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // 드롭존 안의 자식 위로 옮겨 가도 dragleave 가 온다(새 대상 dragenter → 이전 대상 dragleave 순).
        // 그때 끄면 아이콘·문구 위에서 강조가 사라져 "여기 못 놓나?" 로 보였다 → 아직 드롭존 안이면 유지
        // (2026-10-04). relatedTarget 이 없으면(창 밖 등) 이전처럼 끈다.
        const next = e.relatedTarget as Node | null;
        if (next && e.currentTarget.contains(next)) return;
        setIsDragging(false);
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      },
    }),
    [onFile],
  );

  return { isDragging, dropZoneProps };
}
