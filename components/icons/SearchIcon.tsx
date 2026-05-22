/**
 * 검색 아이콘 (테라코타 돋보기) — BottomNav(모바일)·Header(데스크톱) 공용.
 * 렌즈 r=9, 손잡이 대각선 (23,23). active=false 면 opacity 0.72.
 */
export default function SearchIcon({ size = 30, active = false }: { size?: number; active?: boolean }) {
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
      {/* 손잡이 그림자 */}
      <line x1="14.5" y1="14.5" x2="23" y2="23" stroke="#3a1404" strokeWidth="4.2" strokeLinecap="round" opacity="0.3"/>
      {/* 손잡이 */}
      <line x1="14.5" y1="14.5" x2="23" y2="23" stroke="#7a3c10" strokeWidth="3.8" strokeLinecap="round"/>
      <line x1="14.5" y1="14.5" x2="23" y2="23" stroke="#c85a1a" strokeWidth="2.4" strokeLinecap="round"/>
      {/* 렌즈 바깥 림 */}
      <circle cx="10" cy="10" r="9" fill="#ffb077" stroke="#7a3c10" strokeWidth="1.5"/>
      {/* 렌즈 유리 */}
      <circle cx="10" cy="10" r="6.4" fill="#fff4e6" stroke="#c85a1a" strokeWidth="0.5"/>
      {/* 유리 하이라이트 (초승달 반사) */}
      <path d="M5.5 8.5 Q7 5.5, 10.5 5" stroke="#ffffff" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.9"/>
      {/* 미세 글레어 점 */}
      <circle cx="11" cy="12.5" r="0.7" fill="#ffffff" opacity="0.7"/>
    </svg>
  );
}
