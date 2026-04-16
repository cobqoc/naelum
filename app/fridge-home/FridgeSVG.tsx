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
          <stop offset="0%" stopColor="#c84838" />
          <stop offset="100%" stopColor="#a83828" />
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

      {/* ========== 좌측 문 (SVG path, 본체에 붙어있음) ========== */}
      {/* 문 외곽 — 사다리꼴로 원근감 */}
      <path d="M 170,18 L 40,6 L 40,614 L 170,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      {/* 문 측면 두께 */}
      <path d="M 40,6 L 32,10 L 32,610 L 40,614 Z" fill="url(#bodyDark)" />
      {/* 문 안쪽 배경 */}
      <path d="M 46,14 L 166,22 L 166,618 L 46,610 Z" fill="url(#pocketBg)" />

      {/* ── 두꺼운 내부 프레임 (문 테두리) ── */}
      {/* 상단 바 */}
      <path d="M 48,16 L 164,23 L 164,42 L 48,35 Z" fill="url(#bodyDark)" />
      <path d="M 48,16 L 164,23 L 164,26 L 48,19 Z" fill="rgba(255,255,255,0.08)" />
      {/* 좌측 세로 바 */}
      <path d="M 48,35 L 58,36 L 58,598 L 48,597 Z" fill="url(#bodyDark)" />
      {/* 우측 세로 바 */}
      <path d="M 154,42 L 164,43 L 164,605 L 154,604 Z" fill="url(#bodyDark)" />

      {/* ── 포켓 1 구역 ── */}
      {/* 포켓 배경 */}
      <path d="M 58,42 L 154,48 L 154,160 L 58,154 Z" fill="rgba(100,50,30,0.25)" />
      {/* 금색 선반 (두꺼운 U자) */}
      <path d="M 58,42 L 58,48 L 154,54 L 154,48 Z" fill="url(#pocketRail)" />
      <path d="M 58,48 L 66,49 L 66,150 L 58,149 Z" fill="url(#pocketRail)" />
      <path d="M 146,55 L 154,54 L 154,157 L 146,156 Z" fill="url(#pocketRail)" />
      <path d="M 58,149 L 154,155 L 154,166 L 58,160 Z" fill="url(#shelfG)" />
      <path d="M 58,160 L 154,166 L 154,174 L 58,168 Z" fill="url(#shelfFront)" />
      <path d="M 58,160 L 154,166 L 154,168 L 58,162 Z" fill="rgba(255,255,255,0.15)" />
      {/* 아이템 + 그림자 */}
      <ellipse cx="85" cy="152" rx="12" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="73" y="148" fontSize="26">🍶</text>
      <ellipse cx="118" cy="150" rx="10" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="108" y="146" fontSize="22">🧃</text>
      <ellipse cx="144" cy="153" rx="8" ry="2" fill="rgba(0,0,0,0.06)" />
      <text x="136" y="150" fontSize="18">🥤</text>

      {/* 가로 구분 바 1 */}
      <path d="M 48,174 L 164,180 L 164,192 L 48,186 Z" fill="url(#bodyDark)" />
      <path d="M 48,174 L 164,180 L 164,177 L 48,171 Z" fill="rgba(255,255,255,0.06)" />

      {/* ── 포켓 2 구역 ── */}
      <path d="M 58,192 L 154,198 L 154,300 L 58,294 Z" fill="rgba(100,50,30,0.25)" />
      <path d="M 58,192 L 58,198 L 154,204 L 154,198 Z" fill="url(#pocketRail)" />
      <path d="M 58,198 L 66,199 L 66,290 L 58,289 Z" fill="url(#pocketRail)" />
      <path d="M 146,205 L 154,204 L 154,297 L 146,296 Z" fill="url(#pocketRail)" />
      <path d="M 58,289 L 154,295 L 154,306 L 58,300 Z" fill="url(#shelfG)" />
      <path d="M 58,300 L 154,306 L 154,314 L 58,308 Z" fill="url(#shelfFront)" />
      <path d="M 58,300 L 154,306 L 154,308 L 58,302 Z" fill="rgba(255,255,255,0.15)" />
      <ellipse cx="82" cy="292" rx="12" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="68" y="287" fontSize="26">🫙</text>
      <ellipse cx="118" cy="290" rx="10" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="105" y="285" fontSize="22">🧴</text>
      <ellipse cx="144" cy="293" rx="8" ry="2" fill="rgba(0,0,0,0.06)" />
      <text x="136" y="289" fontSize="18">🍾</text>

      {/* 가로 구분 바 2 */}
      <path d="M 48,314 L 164,320 L 164,332 L 48,326 Z" fill="url(#bodyDark)" />
      <path d="M 48,314 L 164,320 L 164,317 L 48,311 Z" fill="rgba(255,255,255,0.06)" />

      {/* ── 포켓 3 구역 ── */}
      <path d="M 58,332 L 154,338 L 154,440 L 58,434 Z" fill="rgba(100,50,30,0.25)" />
      <path d="M 58,332 L 58,338 L 154,344 L 154,338 Z" fill="url(#pocketRail)" />
      <path d="M 58,338 L 66,339 L 66,430 L 58,429 Z" fill="url(#pocketRail)" />
      <path d="M 146,345 L 154,344 L 154,437 L 146,436 Z" fill="url(#pocketRail)" />
      <path d="M 58,429 L 154,435 L 154,446 L 58,440 Z" fill="url(#shelfG)" />
      <path d="M 58,440 L 154,446 L 154,454 L 58,448 Z" fill="url(#shelfFront)" />
      <path d="M 58,440 L 154,446 L 154,448 L 58,442 Z" fill="rgba(255,255,255,0.15)" />
      <ellipse cx="82" cy="432" rx="12" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="70" y="428" fontSize="26">🥫</text>
      <ellipse cx="118" cy="428" rx="10" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="108" y="424" fontSize="22">🍯</text>
      <ellipse cx="144" cy="433" rx="8" ry="2" fill="rgba(0,0,0,0.06)" />
      <text x="136" y="430" fontSize="18">🫒</text>

      {/* 가로 구분 바 3 */}
      <path d="M 48,454 L 164,460 L 164,472 L 48,466 Z" fill="url(#bodyDark)" />
      <path d="M 48,454 L 164,460 L 164,457 L 48,451 Z" fill="rgba(255,255,255,0.06)" />

      {/* ── 하단 유리 패널 (냉동 문) ── */}
      <path d="M 58,472 L 154,478 L 154,598 L 58,592 Z" fill="rgba(210,225,240,0.45)" stroke="url(#frameG)" strokeWidth="3" />
      <path d="M 62,476 L 85,476 L 72,588 L 62,588 Z" fill="rgba(255,255,255,0.1)" />
      <path d="M 58,535 L 154,540 L 154,544 L 58,539 Z" fill="url(#frameG)" />
      {/* 하단 바 */}
      <path d="M 48,598 L 164,604 L 164,614 L 48,608 Z" fill="url(#bodyDark)" />
      <text x="95" y="518" fontSize="22">🥛</text>
      <text x="95" y="578" fontSize="24">🧈</text>

      {/* ========== 냉장고 본체 ========== */}
      <rect x="170" y="18" width="260" height="605" rx="6" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      {/* 상단 하이라이트 */}
      <rect x="172" y="20" width="256" height="5" rx="2" fill="rgba(255,255,255,0.12)" />

      {/* ========== 내부 — 냉장 영역 ========== */}
      {/* 내부 벽 배경 */}
      <rect x="178" y="28" width="244" height="385" rx="4" fill="url(#interiorG)" />
      {/* 내부 양쪽 벽 약간 어두운 그림자 (깊이감) */}
      <rect x="178" y="28" width="8" height="385" rx="2" fill="rgba(0,0,0,0.04)" />
      <rect x="414" y="28" width="8" height="385" rx="2" fill="rgba(0,0,0,0.04)" />
      {/* 천장 조명 glow */}
      <rect x="178" y="28" width="244" height="80" rx="4" fill="url(#lightG)" />
      {/* 뒷벽 미세한 반사 라인 */}
      <line x1="200" y1="32" x2="200" y2="410" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <line x1="400" y1="32" x2="400" y2="410" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* ── 선반 1 (3D 깊이감) ── */}
      {/* 선반 윗면 (밝은 면) */}
      <rect x="178" y="126" width="244" height="4" rx="1" fill="#e8c860" />
      {/* 선반 앞면 (그라데이션) */}
      <rect x="178" y="130" width="244" height="12" rx="1" fill="url(#shelfG)" />
      {/* 선반 아래 그림자 */}
      <rect x="182" y="142" width="236" height="6" rx="2" fill="rgba(0,0,0,0.06)" />
      {/* 선반 앞면 하이라이트 */}
      <rect x="178" y="130" width="244" height="2" fill="rgba(255,255,255,0.15)" />

      {/* ── 선반 2 (3D 깊이감) ── */}
      <rect x="178" y="241" width="244" height="4" rx="1" fill="#e8c860" />
      <rect x="178" y="245" width="244" height="12" rx="1" fill="url(#shelfG)" />
      <rect x="182" y="257" width="236" height="6" rx="2" fill="rgba(0,0,0,0.06)" />
      <rect x="178" y="245" width="244" height="2" fill="rgba(255,255,255,0.15)" />

      {/* ── 선반 3 (야채칸 위, 두꺼움) ── */}
      <rect x="178" y="336" width="244" height="4" rx="1" fill="#e8c860" />
      <rect x="178" y="340" width="244" height="14" rx="1" fill="url(#shelfG)" />
      <rect x="182" y="354" width="236" height="6" rx="2" fill="rgba(0,0,0,0.08)" />
      <rect x="178" y="340" width="244" height="2" fill="rgba(255,255,255,0.15)" />

      {/* ── 야채 서랍 (선반3 아래) ── */}
      {/* 서랍 프레임 좌 */}
      <rect x="182" y="360" width="116" height="48" rx="3" fill="rgba(220,235,220,0.4)" stroke="url(#frameG)" strokeWidth="2" />
      {/* 서랍 손잡이 좌 */}
      <rect x="220" y="359" width="40" height="4" rx="2" fill="url(#shelfFront)" />
      {/* 서랍 프레임 우 */}
      <rect x="302" y="360" width="116" height="48" rx="3" fill="rgba(220,235,220,0.4)" stroke="url(#frameG)" strokeWidth="2" />
      {/* 서랍 손잡이 우 */}
      <rect x="340" y="359" width="40" height="4" rx="2" fill="url(#shelfFront)" />

      {/* ── 선반 위 식품 (크기/위치 세밀 배치) ── */}
      {/* 1단: 큰 아이템 */}
      <text x="195" y="122" fontSize="28">🥬</text>
      <text x="240" y="118" fontSize="22">🧀</text>
      <text x="285" y="124" fontSize="30">🫕</text>
      <text x="340" y="120" fontSize="24">🥚</text>
      <text x="385" y="116" fontSize="20">🫙</text>

      {/* 2단: 과일/채소 */}
      <text x="192" y="238" fontSize="26">🍎</text>
      <text x="235" y="234" fontSize="30">🥝</text>
      <text x="285" y="240" fontSize="22">🥕</text>
      <text x="330" y="236" fontSize="28">🍊</text>
      <text x="385" y="232" fontSize="20">🧄</text>

      {/* 3단: 조리/반찬류 */}
      <text x="195" y="333" fontSize="24">🥒</text>
      <text x="240" y="330" fontSize="28">🍅</text>
      <text x="290" y="336" fontSize="22">🫑</text>
      <text x="338" y="332" fontSize="26">🍆</text>
      <text x="390" y="328" fontSize="20">🌽</text>

      {/* 야채 서랍 안 */}
      <text x="210" y="394" fontSize="24">🥦</text>
      <text x="260" y="398" fontSize="20">🥬</text>
      <text x="330" y="394" fontSize="26">🍉</text>
      <text x="385" y="398" fontSize="20">🥜</text>

      {/* ========== 냉장/냉동 구분 프레임 ========== */}
      <rect x="170" y="410" width="260" height="18" rx="3" fill="url(#frameG)" stroke="#9a7028" strokeWidth="0.5" />
      {/* 프레임 하이라이트 */}
      <rect x="172" y="411" width="256" height="3" rx="1" fill="rgba(255,255,255,0.2)" />

      {/* ========== 내부 — 냉동 영역 ========== */}
      <rect x="178" y="432" width="244" height="183" rx="4" fill="url(#freezerG)" />
      {/* 양쪽 벽 깊이감 */}
      <rect x="178" y="432" width="6" height="183" rx="2" fill="rgba(0,0,0,0.05)" />
      <rect x="416" y="432" width="6" height="183" rx="2" fill="rgba(0,0,0,0.05)" />

      {/* 냉동 선반 */}
      <rect x="178" y="520" width="244" height="4" rx="1" fill="#e8c860" />
      <rect x="178" y="524" width="244" height="10" rx="1" fill="url(#shelfG)" />
      <rect x="182" y="534" width="236" height="4" rx="1" fill="rgba(0,0,0,0.06)" />

      {/* 냉동 중앙 칸막이 */}
      <rect x="296" y="432" width="10" height="183" rx="2" fill="url(#frameG)" />
      <rect x="297" y="432" width="2" height="183" fill="rgba(255,255,255,0.15)" />

      {/* 냉동 유리 패널 — 앞면 + 반사 */}
      <rect x="183" y="436" width="109" height="80" rx="4" fill="url(#glassG)" stroke="rgba(200,200,210,0.4)" strokeWidth="1.5" />
      <path d="M 188,440 L 220,440 L 200,510 L 188,510 Z" fill="rgba(255,255,255,0.08)" /> {/* 반사 */}
      <rect x="183" y="540" width="109" height="70" rx="4" fill="url(#glassG)" stroke="rgba(200,200,210,0.4)" strokeWidth="1.5" />
      <path d="M 188,544 L 215,544 L 200,604 L 188,604 Z" fill="rgba(255,255,255,0.08)" />

      <rect x="310" y="436" width="108" height="80" rx="4" fill="url(#glassG)" stroke="rgba(200,200,210,0.4)" strokeWidth="1.5" />
      <path d="M 315,440 L 345,440 L 328,510 L 315,510 Z" fill="rgba(255,255,255,0.08)" />
      <rect x="310" y="540" width="108" height="70" rx="4" fill="url(#glassG)" stroke="rgba(200,200,210,0.4)" strokeWidth="1.5" />
      <path d="M 315,544 L 340,544 L 325,604 L 315,604 Z" fill="rgba(255,255,255,0.08)" />

      {/* 냉동 식품 */}
      <text x="237" y="492" textAnchor="middle" fontSize="30">🐟</text>
      <text x="364" y="490" textAnchor="middle" fontSize="28">🥩</text>
      <text x="237" y="588" textAnchor="middle" fontSize="28">🍕</text>
      <text x="364" y="586" textAnchor="middle" fontSize="26">🧊</text>

      {/* ========== 우측 문 (SVG path, 본체에 붙어있음) ========== */}
      <path d="M 430,18 L 560,6 L 560,614 L 430,622 Z" fill="url(#bodyG)" stroke="#8a3020" strokeWidth="2" />
      {/* 문 측면 두께 */}
      <path d="M 560,6 L 568,10 L 568,610 L 560,614 Z" fill="url(#bodyDark)" />
      {/* 문 안쪽 배경 */}
      <path d="M 434,22 L 554,14 L 554,610 L 434,618 Z" fill="url(#pocketBg)" />

      {/* ── 두꺼운 내부 프레임 ── */}
      <path d="M 436,23 L 552,16 L 552,42 L 436,35 Z" fill="url(#bodyDark)" />
      <path d="M 436,23 L 552,16 L 552,19 L 436,26 Z" fill="rgba(255,255,255,0.08)" />
      <path d="M 436,35 L 446,36 L 446,605 L 436,604 Z" fill="url(#bodyDark)" />
      <path d="M 542,42 L 552,43 L 552,598 L 542,597 Z" fill="url(#bodyDark)" />

      {/* ── 포켓 1 ── */}
      <path d="M 446,48 L 542,42 L 542,160 L 446,154 Z" fill="rgba(100,50,30,0.25)" />
      <path d="M 446,48 L 446,54 L 542,48 L 542,42 Z" fill="url(#pocketRail)" />
      <path d="M 446,54 L 454,55 L 454,150 L 446,149 Z" fill="url(#pocketRail)" />
      <path d="M 534,49 L 542,48 L 542,157 L 534,156 Z" fill="url(#pocketRail)" />
      <path d="M 446,149 L 542,155 L 542,166 L 446,160 Z" fill="url(#shelfG)" />
      <path d="M 446,160 L 542,166 L 542,174 L 446,168 Z" fill="url(#shelfFront)" />
      <path d="M 446,160 L 542,166 L 542,168 L 446,162 Z" fill="rgba(255,255,255,0.15)" />
      <ellipse cx="475" cy="152" rx="12" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="463" y="148" fontSize="24">🥤</text>
      <ellipse cx="508" cy="150" rx="10" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="498" y="146" fontSize="22">🍶</text>
      <ellipse cx="534" cy="153" rx="8" ry="2" fill="rgba(0,0,0,0.06)" />
      <text x="526" y="150" fontSize="18">🧃</text>

      {/* 가로 구분 바 1 */}
      <path d="M 436,174 L 552,180 L 552,192 L 436,186 Z" fill="url(#bodyDark)" />
      <path d="M 436,174 L 552,180 L 552,177 L 436,171 Z" fill="rgba(255,255,255,0.06)" />

      {/* ── 포켓 2 ── */}
      <path d="M 446,198 L 542,192 L 542,300 L 446,294 Z" fill="rgba(100,50,30,0.25)" />
      <path d="M 446,198 L 446,204 L 542,198 L 542,192 Z" fill="url(#pocketRail)" />
      <path d="M 446,204 L 454,205 L 454,290 L 446,289 Z" fill="url(#pocketRail)" />
      <path d="M 534,199 L 542,198 L 542,297 L 534,296 Z" fill="url(#pocketRail)" />
      <path d="M 446,289 L 542,295 L 542,306 L 446,300 Z" fill="url(#shelfG)" />
      <path d="M 446,300 L 542,306 L 542,314 L 446,308 Z" fill="url(#shelfFront)" />
      <path d="M 446,300 L 542,306 L 542,308 L 446,302 Z" fill="rgba(255,255,255,0.15)" />
      <ellipse cx="475" cy="292" rx="12" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="460" y="287" fontSize="24">🫒</text>
      <ellipse cx="508" cy="290" rx="10" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="498" y="285" fontSize="22">🥫</text>
      <ellipse cx="534" cy="293" rx="8" ry="2" fill="rgba(0,0,0,0.06)" />
      <text x="526" y="289" fontSize="18">🍾</text>

      {/* 가로 구분 바 2 */}
      <path d="M 436,314 L 552,320 L 552,332 L 436,326 Z" fill="url(#bodyDark)" />
      <path d="M 436,314 L 552,320 L 552,317 L 436,311 Z" fill="rgba(255,255,255,0.06)" />

      {/* ── 포켓 3 ── */}
      <path d="M 446,338 L 542,332 L 542,440 L 446,434 Z" fill="rgba(100,50,30,0.25)" />
      <path d="M 446,338 L 446,344 L 542,338 L 542,332 Z" fill="url(#pocketRail)" />
      <path d="M 446,344 L 454,345 L 454,430 L 446,429 Z" fill="url(#pocketRail)" />
      <path d="M 534,339 L 542,338 L 542,437 L 534,436 Z" fill="url(#pocketRail)" />
      <path d="M 446,429 L 542,435 L 542,446 L 446,440 Z" fill="url(#shelfG)" />
      <path d="M 446,440 L 542,446 L 542,454 L 446,448 Z" fill="url(#shelfFront)" />
      <path d="M 446,440 L 542,446 L 542,448 L 446,442 Z" fill="rgba(255,255,255,0.15)" />
      <ellipse cx="475" cy="432" rx="12" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="465" y="428" fontSize="24">🧉</text>
      <ellipse cx="508" cy="428" rx="10" ry="3" fill="rgba(0,0,0,0.08)" />
      <text x="498" y="424" fontSize="22">🍯</text>
      <ellipse cx="534" cy="433" rx="8" ry="2" fill="rgba(0,0,0,0.06)" />
      <text x="526" y="430" fontSize="18">🫙</text>

      {/* 가로 구분 바 3 */}
      <path d="M 436,454 L 552,460 L 552,472 L 436,466 Z" fill="url(#bodyDark)" />
      <path d="M 436,454 L 552,460 L 552,457 L 436,451 Z" fill="rgba(255,255,255,0.06)" />

      {/* ── 하단 유리 패널 ── */}
      <path d="M 446,472 L 542,478 L 542,598 L 446,592 Z" fill="rgba(210,225,240,0.45)" stroke="url(#frameG)" strokeWidth="3" />
      <path d="M 450,476 L 475,476 L 460,588 L 450,588 Z" fill="rgba(255,255,255,0.1)" />
      <path d="M 446,535 L 542,540 L 542,544 L 446,539 Z" fill="url(#frameG)" />
      <path d="M 436,598 L 552,604 L 552,614 L 436,608 Z" fill="url(#bodyDark)" />
      <text x="485" y="518" fontSize="22">🥛</text>
      <text x="485" y="578" fontSize="24">🧴</text>

      {/* ========== 내부 데코 식품 ========== */}
      {/* 선반 1 위 */}
      <text x="205" y="125" fontSize="24">🥬</text>
      <text x="255" y="122" fontSize="20">🧀</text>
      <text x="310" y="126" fontSize="22">🥚</text>
      <text x="365" y="120" fontSize="18">🫕</text>

      {/* 선반 2 위 */}
      <text x="200" y="240" fontSize="22">🍎</text>
      <text x="255" y="243" fontSize="26">🥝</text>
      <text x="320" y="238" fontSize="20">🫙</text>
      <text x="385" y="242" fontSize="22">🥕</text>

      {/* 선반 3 위 */}
      <text x="205" y="335" fontSize="20">🥒</text>
      <text x="270" y="338" fontSize="24">🍅</text>
      <text x="340" y="332" fontSize="22">🫑</text>
      <text x="395" y="336" fontSize="18">🧄</text>

      {/* 야채칸 영역 */}
      <text x="215" y="405" fontSize="26">🍉</text>
      <text x="300" y="400" fontSize="22">🥦</text>
      <text x="375" y="406" fontSize="20">🍊</text>

      {/* 냉장고 다리 */}
      <rect x="185" y="623" width="18" height="14" rx="4" fill="#8a3828" />
      <rect x="397" y="623" width="18" height="14" rx="4" fill="#8a3828" />
    </svg>
  );
}
