'use client';

export default function FridgeSVG() {
  return (
    <svg viewBox="0 0 600 650" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d45a3a" />
          <stop offset="100%" stopColor="#b8442e" />
        </linearGradient>
        <linearGradient id="bodyDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a03828" />
          <stop offset="100%" stopColor="#802018" />
        </linearGradient>
        <linearGradient id="bodyLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e87858" />
          <stop offset="100%" stopColor="#d06040" />
        </linearGradient>
        <linearGradient id="interiorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef2f8" />
          <stop offset="100%" stopColor="#dce2ec" />
        </linearGradient>
        <linearGradient id="freezerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0dce8" />
          <stop offset="100%" stopColor="#b0c4d8" />
        </linearGradient>
        <linearGradient id="handleG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#999" />
          <stop offset="30%" stopColor="#ccc" />
          <stop offset="50%" stopColor="#eee" />
          <stop offset="70%" stopColor="#ccc" />
          <stop offset="100%" stopColor="#888" />
        </linearGradient>
        <radialGradient id="lightG" cx="50%" cy="5%" r="50%">
          <stop offset="0%" stopColor="rgba(255,250,220,0.35)" />
          <stop offset="100%" stopColor="rgba(255,250,220,0)" />
        </radialGradient>
        <radialGradient id="shadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* ===== 바닥 그림자 ===== */}
      <ellipse cx="300" cy="642" rx="240" ry="16" fill="url(#shadowG)" />

      {/* ===== 좌측 냉장 문 ===== */}
      {/* 문 정면 */}
      <path d="M 170,18 L 40,6 L 40,385 L 170,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      {/* 문 좌측면 (두께) */}
      <path d="M 40,6 L 28,12 L 28,379 L 40,385 Z" fill="url(#bodyDark)" />
      {/* 문 상단면 */}
      <path d="M 40,6 L 28,12 L 160,20 L 170,18 Z" fill="url(#bodyLight)" />
      {/* 인셋 */}
      <path d="M 48,15 L 162,22 L 162,383 L 48,378 Z" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
      {/* 내부 패널 */}
      <path d="M 54,21 L 156,27 L 156,377 L 54,372 Z" fill="url(#interiorG)" />
      {/* 내부 깊이 그림자 */}
      <path d="M 54,21 L 62,22 L 62,370 L 54,369 Z" fill="rgba(0,0,0,0.04)" />
      <path d="M 148,28 L 156,27 L 156,377 L 148,376 Z" fill="rgba(0,0,0,0.04)" />
      {/* 손잡이 */}
      <path d="M 161,165 L 161,255" stroke="url(#handleG)" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="161" cy="165" rx="3" ry="3" fill="#aaa" />
      <ellipse cx="161" cy="255" rx="3" ry="3" fill="#aaa" />

      {/* ===== 좌측 냉동 문 ===== */}
      <path d="M 170,402 L 40,399 L 40,614 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      <path d="M 40,399 L 28,404 L 28,608 L 40,614 Z" fill="url(#bodyDark)" />
      <path d="M 48,405 L 162,403 L 162,616 L 48,612 Z" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
      <path d="M 54,410 L 156,408 L 156,610 L 54,606 Z" fill="url(#interiorG)" />
      <path d="M 54,410 L 62,411 L 62,604 L 54,603 Z" fill="rgba(0,0,0,0.04)" />
      <path d="M 148,409 L 156,408 L 156,610 L 148,609 Z" fill="rgba(0,0,0,0.04)" />
      {/* 손잡이 */}
      <path d="M 161,480 L 161,540" stroke="url(#handleG)" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="161" cy="480" rx="3" ry="3" fill="#aaa" />
      <ellipse cx="161" cy="540" rx="3" ry="3" fill="#aaa" />

      {/* ===== 냉장고 본체 ===== */}
      {/* 우측면 */}
      <path d="M 434,14 L 448,6 L 448,621 L 434,627 Z" fill="url(#bodyDark)" />
      {/* 상단면 */}
      <path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />
      <path d="M 170,14 L 182,8 L 444,8 L 432,14 Z" fill="rgba(255,255,255,0.08)" />
      {/* 정면 */}
      <rect x="166" y="14" width="268" height="613" rx="6" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      {/* 상단 하이라이트 */}
      <rect x="172" y="19" width="256" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
      {/* 좌측 하이라이트 (빛 반사) */}
      <rect x="168" y="20" width="3" height="600" rx="1" fill="rgba(255,255,255,0.06)" />

      {/* ===== 내부 — 냉장 ===== */}
      <rect x="178" y="28" width="244" height="355" rx="4" fill="url(#interiorG)" />
      <rect x="178" y="28" width="244" height="60" rx="4" fill="url(#lightG)" />
      {/* 내부 깊이 그림자 (4변) */}
      <rect x="178" y="28" width="6" height="355" fill="rgba(0,0,0,0.05)" />
      <rect x="416" y="28" width="6" height="355" fill="rgba(0,0,0,0.05)" />
      <rect x="178" y="28" width="244" height="6" fill="rgba(0,0,0,0.04)" />
      <rect x="178" y="377" width="244" height="6" fill="rgba(0,0,0,0.03)" />
      {/* 내부 테두리 */}
      <rect x="178" y="28" width="244" height="355" rx="4" fill="none" stroke="#7a2818" strokeWidth="2" />

      {/* ===== 냉장/냉동 구분 ===== */}
      <rect x="168" y="383" width="264" height="12" rx="2" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="1" />
      <rect x="170" y="384" width="260" height="3" rx="1" fill="rgba(255,255,255,0.08)" />

      {/* ===== 내부 — 냉동 ===== */}
      <rect x="178" y="395" width="244" height="220" rx="4" fill="url(#freezerG)" />
      <rect x="178" y="395" width="6" height="220" fill="rgba(0,0,0,0.05)" />
      <rect x="416" y="395" width="6" height="220" fill="rgba(0,0,0,0.05)" />
      <rect x="178" y="395" width="244" height="6" fill="rgba(0,0,0,0.04)" />
      <rect x="178" y="609" width="244" height="6" fill="rgba(0,0,0,0.03)" />
      <rect x="178" y="395" width="244" height="220" rx="4" fill="none" stroke="#7a2818" strokeWidth="2" />

      {/* ===== 우측 냉장 문 ===== */}
      <path d="M 430,18 L 560,6 L 560,385 L 430,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      <path d="M 560,6 L 572,12 L 572,379 L 560,385 Z" fill="url(#bodyDark)" />
      <path d="M 430,18 L 440,12 L 560,6 L 572,12 Z" fill="url(#bodyLight)" />
      <path d="M 438,22 L 554,14 L 554,383 L 438,378 Z" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
      <path d="M 444,27 L 548,20 L 548,377 L 444,372 Z" fill="url(#interiorG)" />
      <path d="M 444,27 L 452,28 L 452,370 L 444,369 Z" fill="rgba(0,0,0,0.04)" />
      <path d="M 540,21 L 548,20 L 548,377 L 540,376 Z" fill="rgba(0,0,0,0.04)" />
      {/* 손잡이 */}
      <path d="M 439,165 L 439,255" stroke="url(#handleG)" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="439" cy="165" rx="3" ry="3" fill="#aaa" />
      <ellipse cx="439" cy="255" rx="3" ry="3" fill="#aaa" />

      {/* ===== 우측 냉동 문 ===== */}
      <path d="M 430,402 L 560,399 L 560,614 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      <path d="M 560,399 L 572,404 L 572,608 L 560,614 Z" fill="url(#bodyDark)" />
      <path d="M 438,405 L 554,403 L 554,616 L 438,612 Z" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
      <path d="M 444,410 L 548,408 L 548,610 L 444,606 Z" fill="url(#interiorG)" />
      <path d="M 444,410 L 452,411 L 452,604 L 444,603 Z" fill="rgba(0,0,0,0.04)" />
      <path d="M 540,409 L 548,408 L 548,610 L 540,609 Z" fill="rgba(0,0,0,0.04)" />
      {/* 손잡이 */}
      <path d="M 439,480 L 439,540" stroke="url(#handleG)" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="439" cy="480" rx="3" ry="3" fill="#aaa" />
      <ellipse cx="439" cy="540" rx="3" ry="3" fill="#aaa" />

      {/* ===== 다리 (3D) ===== */}
      <path d="M 185,627 L 185,639 L 203,639 L 203,627 Z" fill="#7a2818" />
      <path d="M 185,627 L 190,624 L 208,624 L 203,627 Z" fill="#a04030" />
      <path d="M 203,627 L 208,624 L 208,636 L 203,639 Z" fill="#602018" />

      <path d="M 397,627 L 397,639 L 415,639 L 415,627 Z" fill="#7a2818" />
      <path d="M 397,627 L 402,624 L 420,624 L 415,627 Z" fill="#a04030" />
      <path d="M 415,627 L 420,624 L 420,636 L 415,639 Z" fill="#602018" />
    </svg>
  );
}
