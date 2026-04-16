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
          <stop offset="30%" stopColor="#ddd" />
          <stop offset="50%" stopColor="#f0f0f0" />
          <stop offset="70%" stopColor="#ddd" />
          <stop offset="100%" stopColor="#888" />
        </linearGradient>
        <linearGradient id="glassShelf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(200,220,240,0.4)" />
          <stop offset="50%" stopColor="rgba(200,220,240,0.15)" />
          <stop offset="100%" stopColor="rgba(200,220,240,0.3)" />
        </linearGradient>
        <linearGradient id="doorShelfG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(180,210,230,0.35)" />
          <stop offset="100%" stopColor="rgba(180,210,230,0.15)" />
        </linearGradient>
        <radialGradient id="lightG" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="rgba(255,250,220,0.4)" />
          <stop offset="100%" stopColor="rgba(255,250,220,0)" />
        </radialGradient>
        <radialGradient id="frostG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(200,230,255,0.0)" />
          <stop offset="70%" stopColor="rgba(200,230,255,0.0)" />
          <stop offset="100%" stopColor="rgba(200,230,255,0.25)" />
        </radialGradient>
        <radialGradient id="shadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        {/* 바닥 반사 */}
        <linearGradient id="reflectG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(180,80,50,0.12)" />
          <stop offset="100%" stopColor="rgba(180,80,50,0)" />
        </linearGradient>
      </defs>

      {/* ===== 바닥 반사 (냉장고 아래 희미하게) ===== */}
      <rect x="170" y="628" width="260" height="20" rx="4" fill="url(#reflectG)" />
      {/* 바닥 그림자 */}
      <ellipse cx="300" cy="642" rx="240" ry="16" fill="url(#shadowG)" />

      {/* ===== 좌측 냉장 문 ===== */}
      <path d="M 170,18 L 40,6 L 40,385 L 170,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      <path d="M 40,6 L 28,12 L 28,379 L 40,385 Z" fill="url(#bodyDark)" />
      <path d="M 40,6 L 28,12 L 160,20 L 170,18 Z" fill="url(#bodyLight)" />
      <path d="M 48,15 L 162,22 L 162,383 L 48,378 Z" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      <path d="M 54,21 L 156,27 L 156,377 L 54,372 Z" fill="url(#interiorG)" />
      {/* 문 내부 깊이 */}
      <path d="M 54,21 L 60,22 L 60,370 L 54,369 Z" fill="rgba(0,0,0,0.04)" />
      {/* 문 유리 선반 3개 */}
      <path d="M 58,110 L 152,115 L 152,118 L 58,113 Z" fill="url(#glassShelf)" />
      <path d="M 58,113 L 152,118 L 152,119 L 58,114 Z" fill="rgba(255,255,255,0.2)" />
      <path d="M 58,200 L 152,205 L 152,208 L 58,203 Z" fill="url(#glassShelf)" />
      <path d="M 58,203 L 152,208 L 152,209 L 58,204 Z" fill="rgba(255,255,255,0.2)" />
      <path d="M 58,290 L 152,295 L 152,298 L 58,293 Z" fill="url(#glassShelf)" />
      <path d="M 58,293 L 152,298 L 152,299 L 58,294 Z" fill="rgba(255,255,255,0.2)" />
      {/* 손잡이 — 브래킷 + 바 */}
      <rect x="155" y="160" width="12" height="8" rx="2" fill="#888" stroke="#666" strokeWidth="0.5" />
      <rect x="155" y="252" width="12" height="8" rx="2" fill="#888" stroke="#666" strokeWidth="0.5" />
      <path d="M 163,168 L 163,252" stroke="rgba(0,0,0,0.12)" strokeWidth="9" strokeLinecap="round" />
      <path d="M 161,166 L 161,254" stroke="url(#handleG)" strokeWidth="7" strokeLinecap="round" />
      <path d="M 159,168 L 159,252" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

      {/* ===== 좌측 냉동 문 ===== */}
      <path d="M 170,402 L 40,399 L 40,614 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      <path d="M 40,399 L 28,404 L 28,608 L 40,614 Z" fill="url(#bodyDark)" />
      <path d="M 48,405 L 162,403 L 162,616 L 48,612 Z" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      <path d="M 54,410 L 156,408 L 156,610 L 54,606 Z" fill="url(#interiorG)" />
      <path d="M 54,410 L 60,411 L 60,604 L 54,603 Z" fill="rgba(0,0,0,0.04)" />
      {/* 냉동 문 유리 선반 */}
      <path d="M 58,510 L 152,509 L 152,512 L 58,513 Z" fill="url(#glassShelf)" />
      <path d="M 58,513 L 152,512 L 152,513 L 58,514 Z" fill="rgba(255,255,255,0.2)" />
      {/* 손잡이 */}
      <rect x="155" y="475" width="12" height="8" rx="2" fill="#888" stroke="#666" strokeWidth="0.5" />
      <rect x="155" y="537" width="12" height="8" rx="2" fill="#888" stroke="#666" strokeWidth="0.5" />
      <path d="M 163,483 L 163,537" stroke="rgba(0,0,0,0.12)" strokeWidth="9" strokeLinecap="round" />
      <path d="M 161,481 L 161,539" stroke="url(#handleG)" strokeWidth="7" strokeLinecap="round" />
      <path d="M 159,483 L 159,537" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

      {/* ===== 냉장고 본체 ===== */}
      <path d="M 434,14 L 448,6 L 448,621 L 434,627 Z" fill="url(#bodyDark)" />
      <path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />
      <path d="M 170,14 L 182,8 L 444,8 L 432,14 Z" fill="rgba(255,255,255,0.06)" />
      <rect x="166" y="14" width="268" height="613" rx="6" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      <rect x="172" y="19" width="256" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
      <rect x="168" y="20" width="3" height="600" rx="1" fill="rgba(255,255,255,0.05)" />

      {/* 환기구 (상단) */}
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <rect key={`vent${i}`} x={220 + i * 16} y="22" width="10" height="2" rx="1" fill="rgba(0,0,0,0.08)" />
      ))}

      {/* 브랜드 로고 */}
      <text x="300" y="620" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="11" fontWeight="bold" letterSpacing="4" fontFamily="sans-serif">
        NAELUM
      </text>

      {/* ===== 내부 — 냉장 ===== */}
      <rect x="178" y="28" width="244" height="355" rx="4" fill="url(#interiorG)" />
      <rect x="178" y="28" width="244" height="80" rx="4" fill="url(#lightG)" />
      {/* 내부 4변 깊이 */}
      <rect x="178" y="28" width="5" height="355" fill="rgba(0,0,0,0.05)" />
      <rect x="417" y="28" width="5" height="355" fill="rgba(0,0,0,0.05)" />
      <rect x="178" y="28" width="244" height="5" fill="rgba(0,0,0,0.04)" />
      <rect x="178" y="378" width="244" height="5" fill="rgba(0,0,0,0.02)" />
      <rect x="178" y="28" width="244" height="355" rx="4" fill="none" stroke="#7a2818" strokeWidth="2" />

      {/* 유리 선반 3개 */}
      <rect x="182" y="118" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="122" width="236" height="1" fill="rgba(255,255,255,0.25)" />
      <rect x="182" y="215" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="219" width="236" height="1" fill="rgba(255,255,255,0.25)" />
      <rect x="182" y="300" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="304" width="236" height="1" fill="rgba(255,255,255,0.25)" />

      {/* ===== 냉장/냉동 구분 ===== */}
      <rect x="168" y="383" width="264" height="12" rx="2" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="1" />
      <rect x="170" y="384" width="260" height="2" rx="1" fill="rgba(255,255,255,0.08)" />

      {/* LED 온도 디스플레이 */}
      <rect x="275" y="385" width="50" height="8" rx="2" fill="#1a1a2a" />
      <text x="300" y="392" textAnchor="middle" fill="#44ff88" fontSize="6" fontFamily="monospace">3°C</text>

      {/* ===== 내부 — 냉동 ===== */}
      <rect x="178" y="395" width="244" height="220" rx="4" fill="url(#freezerG)" />
      <rect x="178" y="395" width="5" height="220" fill="rgba(0,0,0,0.05)" />
      <rect x="417" y="395" width="5" height="220" fill="rgba(0,0,0,0.05)" />
      <rect x="178" y="395" width="244" height="5" fill="rgba(0,0,0,0.04)" />
      <rect x="178" y="610" width="244" height="5" fill="rgba(0,0,0,0.02)" />
      <rect x="178" y="395" width="244" height="220" rx="4" fill="none" stroke="#7a2818" strokeWidth="2" />
      {/* 서리 효과 */}
      <rect x="178" y="395" width="244" height="220" rx="4" fill="url(#frostG)" />
      {/* 유리 선반 */}
      <rect x="182" y="505" width="236" height="4" rx="2" fill="url(#glassShelf)" />
      <rect x="182" y="509" width="236" height="1" fill="rgba(255,255,255,0.25)" />

      {/* ===== 우측 냉장 문 ===== */}
      <path d="M 430,18 L 560,6 L 560,385 L 430,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      <path d="M 560,6 L 572,12 L 572,379 L 560,385 Z" fill="url(#bodyDark)" />
      <path d="M 430,18 L 440,12 L 560,6 L 572,12 Z" fill="url(#bodyLight)" />
      <path d="M 438,22 L 554,14 L 554,383 L 438,378 Z" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      <path d="M 444,27 L 548,20 L 548,377 L 444,372 Z" fill="url(#interiorG)" />
      <path d="M 540,21 L 548,20 L 548,377 L 540,376 Z" fill="rgba(0,0,0,0.04)" />
      {/* 문 유리 선반 */}
      <path d="M 448,115 L 544,110 L 544,113 L 448,118 Z" fill="url(#glassShelf)" />
      <path d="M 448,118 L 544,113 L 544,114 L 448,119 Z" fill="rgba(255,255,255,0.2)" />
      <path d="M 448,205 L 544,200 L 544,203 L 448,208 Z" fill="url(#glassShelf)" />
      <path d="M 448,208 L 544,203 L 544,204 L 448,209 Z" fill="rgba(255,255,255,0.2)" />
      <path d="M 448,295 L 544,290 L 544,293 L 448,298 Z" fill="url(#glassShelf)" />
      <path d="M 448,298 L 544,293 L 544,294 L 448,299 Z" fill="rgba(255,255,255,0.2)" />
      {/* 문 자석 메모 (작은 디테일) */}
      <rect x="480" y="60" width="30" height="35" rx="2" fill="#ffe8a0" transform="rotate(-3 495 77)" />
      <rect x="492" y="58" width="8" height="8" rx="4" fill="#e05040" />
      {/* 손잡이 */}
      <rect x="433" y="160" width="12" height="8" rx="2" fill="#888" stroke="#666" strokeWidth="0.5" />
      <rect x="433" y="252" width="12" height="8" rx="2" fill="#888" stroke="#666" strokeWidth="0.5" />
      <path d="M 437,168 L 437,252" stroke="rgba(0,0,0,0.12)" strokeWidth="9" strokeLinecap="round" />
      <path d="M 439,166 L 439,254" stroke="url(#handleG)" strokeWidth="7" strokeLinecap="round" />
      <path d="M 441,168 L 441,252" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

      {/* ===== 우측 냉동 문 ===== */}
      <path d="M 430,402 L 560,399 L 560,614 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      <path d="M 560,399 L 572,404 L 572,608 L 560,614 Z" fill="url(#bodyDark)" />
      <path d="M 438,405 L 554,403 L 554,616 L 438,612 Z" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      <path d="M 444,410 L 548,408 L 548,610 L 444,606 Z" fill="url(#interiorG)" />
      <path d="M 540,409 L 548,408 L 548,610 L 540,609 Z" fill="rgba(0,0,0,0.04)" />
      {/* 냉동 문 유리 선반 */}
      <path d="M 448,510 L 544,509 L 544,512 L 448,513 Z" fill="url(#glassShelf)" />
      <path d="M 448,513 L 544,512 L 544,513 L 448,514 Z" fill="rgba(255,255,255,0.2)" />
      {/* 손잡이 */}
      <rect x="433" y="475" width="12" height="8" rx="2" fill="#888" stroke="#666" strokeWidth="0.5" />
      <rect x="433" y="537" width="12" height="8" rx="2" fill="#888" stroke="#666" strokeWidth="0.5" />
      <path d="M 437,483 L 437,537" stroke="rgba(0,0,0,0.12)" strokeWidth="9" strokeLinecap="round" />
      <path d="M 439,481 L 439,539" stroke="url(#handleG)" strokeWidth="7" strokeLinecap="round" />
      <path d="M 441,483 L 441,537" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

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
