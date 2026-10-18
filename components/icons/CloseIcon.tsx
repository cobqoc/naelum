/**
 * 닫기(X) 아이콘 — 모달·시트·토스트의 닫기 버튼 공용(ICL-20, 2026-10-04).
 * 파일마다 복붙돼 있던 두 마크업 변형을 그대로(속성 위치까지) 재현한다 — 렌더 결과 바이트 동일.
 *  - weight 'bold'(기본): svg 에 strokeWidth 2.5 — 시트·재료 모달·토스트
 *  - weight 'regular': path 에 strokeWidth 2 — 소형 모달(SmallModal)·타이머 체크포인트 삭제
 */
export default function CloseIcon({
  className = 'w-4 h-4',
  weight = 'bold',
}: {
  className?: string;
  weight?: 'bold' | 'regular';
}) {
  if (weight === 'regular') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
