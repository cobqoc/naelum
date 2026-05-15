// 우드 바구니 + 컬러풀 식재료. BottomNav·Header cart 버튼 공용.
export default function CartIcon({ size = 30, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-opacity"
      style={{ opacity: active ? 1 : 0.72 }}
    >
      {/* 손잡이 (아치, 위로 확장) */}
      <path d="M5.5 7 Q5.5 1.5, 12 1.5 Q18.5 1.5, 18.5 7" stroke="#7a3c10" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M5.5 7 Q5.5 1.5, 12 1.5 Q18.5 1.5, 18.5 7" stroke="#c08040" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
      {/* 바구니 바디 (더 넓고 깊게) */}
      <path d="M2 7 L22 7 L20 22.5 L4 22.5 Z" fill="#e8a052" stroke="#7a3c10" strokeWidth="1" strokeLinejoin="round"/>
      {/* 바구니 상단 테두리 (림) */}
      <rect x="2" y="7" width="20" height="1.2" fill="#c08040" stroke="#7a3c10" strokeWidth="0.5"/>
      {/* 위빙 라인 */}
      <line x1="3" y1="11" x2="21" y2="11" stroke="#7a3c10" strokeWidth="0.6" opacity="0.45"/>
      <line x1="3.3" y1="14.5" x2="20.7" y2="14.5" stroke="#7a3c10" strokeWidth="0.6" opacity="0.45"/>
      <line x1="3.6" y1="18" x2="20.4" y2="18" stroke="#7a3c10" strokeWidth="0.6" opacity="0.45"/>
      {/* 세로 위빙 */}
      <line x1="8" y1="8" x2="7.5" y2="22" stroke="#7a3c10" strokeWidth="0.4" opacity="0.35"/>
      <line x1="12" y1="8" x2="12" y2="22" stroke="#7a3c10" strokeWidth="0.4" opacity="0.35"/>
      <line x1="16" y1="8" x2="16.5" y2="22" stroke="#7a3c10" strokeWidth="0.4" opacity="0.35"/>
      {/* 바구니 안 식재료 (크게 엿보임) */}
      <circle cx="7" cy="7" r="2.3" fill="#c93820" stroke="#7a1810" strokeWidth="0.4"/>
      <circle cx="12" cy="6.3" r="2.6" fill="#60b050" stroke="#1f4a18" strokeWidth="0.4"/>
      <circle cx="17" cy="7" r="2.1" fill="#f4c030" stroke="#a07018" strokeWidth="0.4"/>
      {/* 토마토 하이라이트 */}
      <ellipse cx="6.4" cy="6.3" rx="0.5" ry="0.7" fill="#ffffff" opacity="0.5"/>
      {/* 양상추 잎맥 */}
      <path d="M10.5 5.5 Q12 6.5, 13.5 5.5" stroke="#2a6520" strokeWidth="0.35" fill="none"/>
    </svg>
  );
}
