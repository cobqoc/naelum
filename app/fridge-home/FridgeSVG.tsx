'use client';

/**
 * SVG 카툰 냉장고 — 문이 항상 열린 상태 (3D transform 없이 SVG path로 직접 그림)
 * 문과 본체가 path 좌표로 연결돼서 절대 틈이 안 생김
 */

export default function FridgeSVG() {
  return (
    <svg viewBox="0 0 600 650" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d45a3a" />
          <stop offset="100%" stopColor="#b8442e" />
        </linearGradient>
        <linearGradient id="bodyDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c04830" />
          <stop offset="100%" stopColor="#982818" />
        </linearGradient>
        <linearGradient id="interiorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef2f8" />
          <stop offset="100%" stopColor="#dce2ec" />
        </linearGradient>
        <linearGradient id="freezerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0dce8" />
          <stop offset="100%" stopColor="#b0c4d8" />
        </linearGradient>
        <linearGradient id="shelfG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0b050" />
          <stop offset="40%" stopColor="#c89030" />
          <stop offset="100%" stopColor="#a07028" />
        </linearGradient>
        <linearGradient id="shelfFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8a848" />
          <stop offset="100%" stopColor="#b08030" />
        </linearGradient>
        <linearGradient id="pocketBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef2f8" />
          <stop offset="100%" stopColor="#dce2ec" />
        </linearGradient>
        <linearGradient id="pocketRail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8c060" />
          <stop offset="100%" stopColor="#c89838" />
        </linearGradient>
        <linearGradient id="frameG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a040" />
          <stop offset="100%" stopColor="#b08030" />
        </linearGradient>
        <linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
        </linearGradient>
        <linearGradient id="handleG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#888" />
          <stop offset="50%" stopColor="#bbb" />
          <stop offset="100%" stopColor="#777" />
        </linearGradient>
        <radialGradient id="lightG" cx="50%" cy="5%" r="50%">
          <stop offset="0%" stopColor="rgba(255,250,220,0.4)" />
          <stop offset="100%" stopColor="rgba(255,250,220,0)" />
        </radialGradient>
        <radialGradient id="shadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.22)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse cx="300" cy="640" rx="230" ry="14" fill="url(#shadowG)" />

      {/* ========== 좌측 냉장 문 (6) ========== */}
      {/* 문 외곽 */}
      <path d="M 170,18 L 40,6 L 40,385 L 170,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      {/* 문 측면 두께 */}
      <path d="M 40,6 L 30,10 L 30,381 L 40,385 Z" fill="url(#bodyDark)" />
      {/* 인셋 그림자 (프레임 깊이감) */}
      <path d="M 46,13 L 164,21 L 164,386 L 46,381 Z" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="3" />
      {/* 내부 패널 */}
      <path d="M 52,19 L 158,26 L 158,380 L 52,375 Z" fill="url(#pocketBg)" />
      {/* 손잡이 */}
      <path d="M 160,170 L 160,250" stroke="url(#handleG)" strokeWidth="5" strokeLinecap="round" />
      <path d="M 160,170 L 160,250" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />

      {/* ========== 좌측 냉동 문 (4) ========== */}
      <path d="M 170,402 L 40,399 L 40,614 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      <path d="M 40,399 L 30,402 L 30,610 L 40,614 Z" fill="url(#bodyDark)" />
      <path d="M 46,405 L 164,403 L 164,616 L 46,612 Z" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="3" />
      <path d="M 52,410 L 158,408 L 158,610 L 52,606 Z" fill="url(#pocketBg)" />
      {/* 손잡이 */}
      <path d="M 160,480 L 160,540" stroke="url(#handleG)" strokeWidth="5" strokeLinecap="round" />
      <path d="M 160,480 L 160,540" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />

      {/* ========== 냉장고 본체 ========== */}
      {/* 본체 우측면 (3D) */}
      <path d="M 434,14 L 446,6 L 446,619 L 434,627 Z" fill="url(#bodyDark)" />
      {/* 본체 상단면 (3D) */}
      <path d="M 166,14 L 178,6 L 446,6 L 434,14 Z" fill="#e07050" />
      {/* 본체 정면 */}
      <rect x="166" y="14" width="268" height="613" rx="8" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="4" />
      {/* 상단 하이라이트 */}
      <rect x="172" y="20" width="256" height="5" rx="2" fill="rgba(255,255,255,0.15)" />

      {/* ========== 내부 — 냉장 (6) ========== */}
      <rect x="178" y="28" width="244" height="355" rx="4" fill="url(#interiorG)" />
      <rect x="178" y="28" width="244" height="60" rx="4" fill="url(#lightG)" />
      {/* 프레임 안쪽 어두운 테두리 (깊이감) */}
      <rect x="178" y="28" width="244" height="355" rx="4" fill="none" stroke="#7a2818" strokeWidth="3" />

      {/* 냉장/냉동 구분 (프레임 색상) */}
      <rect x="170" y="383" width="260" height="12" rx="2" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="1" />

      {/* ========== 내부 — 냉동 (4) ========== */}
      <rect x="178" y="395" width="244" height="220" rx="4" fill="url(#freezerG)" />
      <rect x="178" y="395" width="244" height="220" rx="4" fill="none" stroke="#7a2818" strokeWidth="3" />

      {/* ========== 우측 냉장 문 (6) ========== */}
      <path d="M 430,18 L 560,6 L 560,385 L 430,390 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      <path d="M 560,6 L 570,10 L 570,381 L 560,385 Z" fill="url(#bodyDark)" />
      <path d="M 436,21 L 554,13 L 554,386 L 436,381 Z" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="3" />
      <path d="M 442,26 L 548,19 L 548,380 L 442,375 Z" fill="url(#pocketBg)" />
      {/* 손잡이 — 세로 바 */}
      <path d="M 438,170 L 438,250" stroke="url(#handleG)" strokeWidth="5" strokeLinecap="round" />
      <path d="M 438,170 L 438,250" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />

      {/* ========== 우측 냉동 문 (4) ========== */}
      <path d="M 430,402 L 560,399 L 560,614 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="3" />
      <path d="M 560,399 L 570,402 L 570,610 L 560,614 Z" fill="url(#bodyDark)" />
      <path d="M 436,405 L 554,403 L 554,616 L 436,612 Z" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="3" />
      <path d="M 442,410 L 548,408 L 548,610 L 442,606 Z" fill="url(#pocketBg)" />
      {/* 손잡이 */}
      <path d="M 438,480 L 438,540" stroke="url(#handleG)" strokeWidth="5" strokeLinecap="round" />
      <path d="M 438,480 L 438,540" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />

      {/* 냉장고 다리 */}
      <rect x="185" y="623" width="18" height="14" rx="4" fill="#8a3828" />
      <rect x="397" y="623" width="18" height="14" rx="4" fill="#8a3828" />
    </svg>
  );
}
