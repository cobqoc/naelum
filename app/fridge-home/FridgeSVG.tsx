'use client';

// naelum-centered 디자인 복원본
export default function FridgeSVG() {
  return (
    <svg viewBox="-30 -5 660 670" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e85a3a" />
          <stop offset="100%" stopColor="#c93820" />
        </linearGradient>
        <linearGradient id="bodyDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a1a10" />
          <stop offset="100%" stopColor="#6a1008" />
        </linearGradient>
        <linearGradient id="bodyLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f07050" />
          <stop offset="100%" stopColor="#d84a30" />
        </linearGradient>
        <linearGradient id="interiorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6fafd" />
          <stop offset="100%" stopColor="#e4eef5" />
        </linearGradient>
        <linearGradient id="freezerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef3f8" />
          <stop offset="100%" stopColor="#d8e4ec" />
        </linearGradient>
        <linearGradient id="chromeG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0d0d0" />
          <stop offset="30%" stopColor="#f0f0f0" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#b0b0b0" />
        </linearGradient>
        <linearGradient id="creamFrontG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4c030" />
          <stop offset="100%" stopColor="#c08820" />
        </linearGradient>
        <linearGradient id="creamTopG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fadc60" />
          <stop offset="100%" stopColor="#e8b840" />
        </linearGradient>
        <linearGradient id="railFrontG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4c030" />
          <stop offset="100%" stopColor="#c08820" />
        </linearGradient>
        <linearGradient id="railTopG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fadc60" />
          <stop offset="100%" stopColor="#e8b840" />
        </linearGradient>
        <linearGradient id="railSideG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c08820" />
          <stop offset="100%" stopColor="#c08820" />
        </linearGradient>
        <radialGradient id="shadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.3)" /><stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="300" cy="648" rx="260" ry="18" fill="url(#shadowG)" />

      <g transform="matrix(0.69,0,0,1,52.70000000000001,0)">
      <path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 14,2 L -10,10 L -4,396 L 16,392 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 14,2 L 2,10 L 158,28 L 170,24 Z" fill="url(#bodyLight)" />
      <path d="M 28,22 L 152,36 L 152,376 L 30,376 Z" fill="url(#interiorG)" stroke="#FFF4D8" strokeWidth="1.5" />

      <path d="M 14,22 L 15,19 L 29,19 L 28,22 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 28,22 L 29,19 L 31,373 L 30,376 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 14,22 L 28,22 L 30,376 L 16,376 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 14,22 L 28,22" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 20,27 L 22,371" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 21.2,27 L 23.2,371" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 14.6,122 L 28.6,122" fill="none" stroke="rgba(40,22,8,0.7)" strokeWidth="1.3" />
      <path d="M 14.7,124 L 28.7,124" fill="none" stroke="rgba(255,240,200,0.4)" strokeWidth="0.7" />
      <path d="M 15,204 L 29,204" fill="none" stroke="rgba(40,22,8,0.7)" strokeWidth="1.3" />
      <path d="M 15.1,206 L 29.1,206" fill="none" stroke="rgba(255,240,200,0.4)" strokeWidth="0.7" />
      <path d="M 15.9,350 L 29.9,350" fill="none" stroke="rgba(40,22,8,0.7)" strokeWidth="1.3" />
      <path d="M 16,352 L 30,352" fill="none" stroke="rgba(255,240,200,0.4)" strokeWidth="0.7" />
      <path d="M 16,376 L 30,376" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 29,110 L 152,120 L 150,128 L 29,118 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,118 L 150,128 L 150,146 L 29,136 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,118 L 150,128" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 29,124 L 150,133" fill="none" stroke="#1a0a04" strokeWidth="2.4" />
      <path d="M 29,127 L 150,136" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 29,136 L 150,146" fill="none" stroke="#2A1408" strokeWidth="2" />

      <path d="M 29,193 L 152,200 L 150,212 L 29,205 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,205 L 150,212 L 150,237 L 29,230 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 29,205 L 150,212" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 29,213 L 150,220" fill="none" stroke="#1a0a04" strokeWidth="2.4" />
      <path d="M 29,218 L 150,225" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 29,230 L 150,237" fill="none" stroke="#2A1408" strokeWidth="2" />

      <path d="M 30,339 L 152,341 L 150,353 L 30,351 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,351 L 150,353 L 150,376 L 30,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,351 L 150,353" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 30,358 L 150,361" fill="none" stroke="#1a0a04" strokeWidth="2.4" />
      <path d="M 30,365 L 150,367" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 30,376 L 150,376" fill="none" stroke="#2A1408" strokeWidth="2" />
      </g>

      <g transform="matrix(0.69,0,0,1,52.70000000000001,0)">
      <path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 26,406 L 6,410 L 8,620 L 28,624 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 26,406 L 16,410 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />
      <path d="M 44,420 L 152,416 L 152,608 L 46,608 Z" fill="url(#freezerG)" stroke="#FFF4D8" strokeWidth="1.5" />

      <path d="M 30,421 L 31,418 L 45,417 L 44,420 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 44,420 L 45,417 L 47,605 L 46,608 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,421 L 44,420 L 46,608 L 32,609 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 30,421 L 44,420" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <path d="M 36,425 L 38,603" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 37,425 L 39,603" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 32,609 L 46,608" fill="none" stroke="#2A1408" strokeWidth="1.5" />

      <path d="M 45,571 L 152,569 L 150,581 L 45,583 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 45,583 L 150,581 L 150,608 L 45,608 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 45,583 L 150,581" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 45,590 L 150,588" fill="none" stroke="#1a0a04" strokeWidth="2.4" />
      <path d="M 45,596 L 150,594" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 46,608 L 150,608" fill="none" stroke="#2A1408" strokeWidth="1.8" />
      </g>

      <path d="M 434,14 L 448,6 L 448,623 L 434,629 Z" fill="url(#bodyDark)" />
      <path d="M 166,14 L 180,6 L 448,6 L 434,14 Z" fill="url(#bodyLight)" />
      <rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" />
      <rect x="166" y="14" width="268" height="3" fill="#000" />
      <rect x="166" y="14" width="3" height="615" fill="#000" />
      <rect x="431" y="14" width="3" height="615" fill="#000" />
      <rect x="166" y="626" width="268" height="3" fill="#000" />
      <rect x="170" y="16" width="260" height="3" rx="1" fill="url(#chromeG)" />
      <text x="300" y="618" textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="bold" letterSpacing="4" fontFamily="sans-serif" opacity="0.8">NAELUM</text>

      <rect x="166" y="38" width="248" height="335" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="188" y="40" width="224" height="331" rx="4" fill="url(#interiorG)" />
      <rect x="188" y="40" width="224" height="331" rx="4" fill="none" stroke="#FFF4D8" strokeWidth="1.5" opacity="0.7" />

      <path d="M 188,126 L 193,121 L 407,121 L 412,126 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 188,126 L 412,126 L 412,138 L 188,138 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 188,126 L 412,126" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <path d="M 188,130 L 412,130" fill="none" stroke="#1a0a04" strokeWidth="1.8" />
      <path d="M 188,134 L 412,134" fill="none" stroke="#1a0a04" strokeWidth="1.8" />
      <path d="M 188,138 L 412,138" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 188,216 L 193,211 L 407,211 L 412,216 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 188,216 L 412,216 L 412,228 L 188,228 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 188,216 L 412,216" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <path d="M 188,220 L 412,220" fill="none" stroke="#1a0a04" strokeWidth="1.8" />
      <path d="M 188,224 L 412,224" fill="none" stroke="#1a0a04" strokeWidth="1.8" />
      <path d="M 188,228 L 412,228" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 192,316 L 298,316 L 298,326 L 192,326 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 192,326 L 298,326 L 298,368 L 192,368 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 192,326 L 298,326" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <rect x="228" y="342" width="34" height="7" rx="2" fill="#8a5020" stroke="#000" strokeWidth="1.2" />

      <path d="M 302,316 L 408,316 L 408,326 L 302,326 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 302,326 L 408,326 L 408,368 L 302,368 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 302,326 L 408,326" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <rect x="338" y="342" width="34" height="7" rx="2" fill="#8a5020" stroke="#000" strokeWidth="1.2" />

      <rect x="168" y="372" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />

      <rect x="188" y="409" width="224" height="196" rx="6" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinejoin="round" />
      <rect x="190" y="411" width="220" height="192" rx="4" fill="url(#freezerG)" />
      <rect x="190" y="411" width="220" height="192" rx="4" fill="none" stroke="#FFF4D8" strokeWidth="1.5" opacity="0.7" />

      <path d="M 190,472 L 195,467 L 405,467 L 410,472 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 190,472 L 410,472 L 410,482 L 190,482 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 190,472 L 410,472" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <path d="M 190,476 L 410,476" fill="none" stroke="#1a0a04" strokeWidth="1.8" />
      <path d="M 190,482 L 410,482" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 190,538 L 195,533 L 405,533 L 410,538 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 190,538 L 410,538 L 410,548 L 190,548 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 190,538 L 410,538" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <path d="M 190,542 L 410,542" fill="none" stroke="#1a0a04" strokeWidth="1.8" />
      <path d="M 190,548 L 410,548" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <g transform="matrix(0.69,0,0,1,133.3,0)">
      <path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 586,2 L 610,10 L 604,396 L 584,392 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 430,24 L 442,28 L 586,2 L 598,10 Z" fill="url(#bodyLight)" />
      <path d="M 448,37 L 572,22 L 570,376 L 448,376 Z" fill="url(#interiorG)" stroke="#FFF4D8" strokeWidth="1.5" />

      <path d="M 572,22 L 571,19 L 585,19 L 586,22 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 571,19 L 569,373 L 570,376 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 586,22 L 584,376 L 570,376 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 572,22 L 586,22" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 578,27 L 576,371" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 579.2,27 L 577.2,371" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 570,376 L 584,376" fill="none" stroke="#2A1408" strokeWidth="1.8" />

      <path d="M 448,121 L 571,110 L 571,118 L 450,129 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,129 L 571,118 L 571,136 L 450,147 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,129 L 571,118" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,135 L 571,124" fill="none" stroke="#1a0a04" strokeWidth="2.4" />
      <path d="M 450,139 L 571,128" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 450,147 L 571,136" fill="none" stroke="#2A1408" strokeWidth="2" />

      <path d="M 448,201 L 571,193 L 571,205 L 450,213 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,213 L 571,205 L 571,230 L 450,238 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,213 L 571,205" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,221 L 571,213" fill="none" stroke="#1a0a04" strokeWidth="2.4" />
      <path d="M 450,226 L 571,218" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 450,238 L 571,230" fill="none" stroke="#2A1408" strokeWidth="2" />

      <path d="M 448,341 L 570,339 L 570,351 L 450,353 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,353 L 570,351 L 570,376 L 448,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,353 L 570,351" fill="none" stroke="#FFF4D8" strokeWidth="4" />
      <path d="M 450,361 L 570,358" fill="none" stroke="#1a0a04" strokeWidth="2.4" />
      <path d="M 450,367 L 570,364" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.8" />
      <path d="M 448,376 L 570,376" fill="none" stroke="#2A1408" strokeWidth="2" />
      </g>

      <g transform="matrix(0.69,0,0,1,133.3,0)">
      <path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 574,406 L 594,410 L 592,620 L 572,624 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 430,402 L 442,406 L 574,406 L 584,410 Z" fill="url(#bodyLight)" />
      <path d="M 448,416 L 556,422 L 554,608 L 448,604 Z" fill="url(#freezerG)" stroke="#FFF4D8" strokeWidth="1.5" />

      <path d="M 556,422 L 555,419 L 569,420 L 570,423 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 556,422 L 555,419 L 553,605 L 554,608 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 556,422 L 570,423 L 568,609 L 554,608 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 556,422 L 570,423" fill="none" stroke="#FFF4D8" strokeWidth="2" />
      <path d="M 562,426 L 560,603" fill="none" stroke="rgba(50,30,8,0.55)" strokeWidth="1.3" />
      <path d="M 563.2,426 L 561.2,603" fill="none" stroke="rgba(255,240,200,0.35)" strokeWidth="0.7" />
      <path d="M 554,608 L 568,609" fill="none" stroke="#2A1408" strokeWidth="1.5" />

      <path d="M 448,571 L 556,569 L 556,581 L 450,583 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,583 L 556,581 L 555,608 L 450,608 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 450,583 L 556,581" fill="none" stroke="#FFF4D8" strokeWidth="2.2" />
      <path d="M 450,590 L 556,588" fill="none" stroke="#1a0a04" strokeWidth="2.4" />
      <path d="M 450,596 L 556,594" fill="none" stroke="rgba(255,240,200,0.3)" strokeWidth="0.8" />
      <path d="M 450,608 L 555,608" fill="none" stroke="#2A1408" strokeWidth="1.8" />
      </g>

      <rect x="168" y="624" width="264" height="10" rx="2" fill="url(#bodyDark)" stroke="#000" strokeWidth="0.5" />
      <path d="M 185,629 L 185,641 L 203,641 L 203,629 Z" fill="#7a2818" />
      <path d="M 185,629 L 190,626 L 208,626 L 203,629 Z" fill="#a04030" />
      <path d="M 203,629 L 208,626 L 208,638 L 203,641 Z" fill="#602018" />
      <path d="M 397,629 L 397,641 L 415,641 L 415,629 Z" fill="#7a2818" />
      <path d="M 397,629 L 402,626 L 420,626 L 415,629 Z" fill="#a04030" />
      <path d="M 415,629 L 420,626 L 420,638 L 415,641 Z" fill="#602018" />
    </svg>
  );
}
