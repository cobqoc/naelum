/**
 * 냉장고 아이콘 (테라코타 디테일 SVG) — 공용.
 *
 * 레시피 상세(RecipeBrowseView 냉장고 버튼)와 추천 카드(FridgeRecipeCard)가
 * 같이 쓴다. 공용 컴포넌트라 두 곳이 구조상 영원히 동일.
 * 색상은 SVG 내부 고정(fill) — 바깥 원의 배경색으로 상태를 표시한다.
 */
export default function FridgeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 100" fill="none">
      <rect x="4" y="4" width="60" height="92" rx="6" fill="#e85a3a" stroke="#7a1810" strokeWidth="5" />
      <rect x="4" y="4" width="28" height="62" rx="6" fill="#c93820" />
      <rect x="4" y="66" width="60" height="4" fill="#7a1810" />
      <rect x="9" y="14" width="17" height="10" rx="2" fill="#f4c030" stroke="#7a1810" strokeWidth="2.5" />
      <rect x="32" y="4" width="32" height="62" fill="#e8f7ff" />
      <rect x="55" y="12" width="3" height="16" rx="1" fill="#7a1810" opacity="0.4" />
      <rect x="59" y="12" width="3" height="16" rx="1" fill="#7a1810" opacity="0.4" />
      <ellipse cx="47" cy="30" rx="7" ry="5" fill="#e09848" stroke="#7a3c10" strokeWidth="2" />
      <path d="M42 42 L52 42 L50 50 L44 50 Z" fill="#b07840" stroke="#7a1810" strokeWidth="2" />
      <rect x="42" y="52" width="4" height="8" rx="1" fill="#e85040" stroke="#7a1810" strokeWidth="2" />
      <rect x="48" y="52" width="4" height="8" rx="1" fill="#e85040" stroke="#7a1810" strokeWidth="2" />
      <rect x="64" y="4" width="20" height="62" rx="4" fill="#e85a3a" stroke="#7a1810" strokeWidth="4" />
      <rect x="68" y="18" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35" />
      <rect x="68" y="26" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35" />
      <rect x="68" y="34" width="10" height="3" rx="1.5" fill="#7a1810" opacity="0.35" />
      <rect x="28" y="20" width="8" height="14" rx="4" fill="#7a1810" />
      <rect x="28" y="42" width="8" height="14" rx="4" fill="#7a1810" />
      <rect x="4" y="70" width="60" height="26" rx="6" fill="#e85a3a" />
      <rect x="28" y="80" width="12" height="6" rx="3" fill="#7a1810" />
    </svg>
  );
}
