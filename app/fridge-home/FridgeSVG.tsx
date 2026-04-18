'use client';

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
          <stop offset="0%" stopColor="#f5fbff" />
          <stop offset="100%" stopColor="#dceaf4" />
        </linearGradient>
        <linearGradient id="freezerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef6ff" />
          <stop offset="100%" stopColor="#cee0ee" />
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
          <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="300" cy="648" rx="260" ry="18" fill="url(#shadowG)" />

      <g transform="matrix(0.69,0,0,1,52.7,0)">
        <path d="M 170,24 L 14,2 L 16,392 L 170,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <path d="M 14,2 L 2,10 L 6,396 L 16,392 Z" fill="url(#bodyDark)" />
        <path d="M 14,2 L 2,10 L 158,28 L 170,24 Z" fill="url(#bodyLight)" />
        <path d="M 28,22 L 152,36 L 152,376 L 30,376 Z" fill="url(#interiorG)" />

        <path d="M 14,22 L 15,19 L 29,19 L 28,22 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 28,22 L 29,19 L 31,373 L 30,376 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 14,22 L 28,22 L 30,376 L 16,376 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />

        <path d="M 29,150 L 150,158 L 150,176 L 29,168 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 29,150 L 150,158" fill="none" stroke="#FFF4D8" strokeWidth="3" />
        <path d="M 30,351 L 150,353 L 150,376 L 30,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 30,351 L 150,353" fill="none" stroke="#FFF4D8" strokeWidth="3" />
      </g>

      <g transform="matrix(0.69,0,0,1,52.7,0)">
        <path d="M 170,402 L 26,406 L 28,624 L 170,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <path d="M 26,406 L 16,410 L 18,620 L 28,624 Z" fill="url(#bodyDark)" />
        <path d="M 26,406 L 16,410 L 158,406 L 170,402 Z" fill="url(#bodyLight)" />
        <path d="M 44,420 L 152,416 L 152,608 L 46,608 Z" fill="url(#freezerG)" />

        <path d="M 30,421 L 31,418 L 45,417 L 44,420 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 44,420 L 45,417 L 47,605 L 46,608 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 30,421 L 44,420 L 46,608 L 32,609 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />

        <path d="M 45,571 L 152,569 L 150,581 L 45,583 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 45,583 L 150,581 L 150,608 L 45,608 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      </g>

      <rect x="166" y="14" width="268" height="615" rx="6" fill="url(#bodyG)" />
      <rect x="166" y="14" width="2.5" height="615" fill="#000" />
      <rect x="431.5" y="14" width="2.5" height="615" fill="#000" />
      <rect x="166" y="14" width="268" height="2.5" fill="#000" />
      <rect x="166" y="626.5" width="268" height="2.5" fill="#000" />

      <rect x="178" y="28" width="244" height="355" rx="4" fill="url(#interiorG)" />

      <rect x="200" y="320" width="90" height="40" rx="3" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="232" y="335" width="26" height="6" rx="1.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />
      <rect x="310" y="320" width="90" height="40" rx="3" fill="url(#creamFrontG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="342" y="335" width="26" height="6" rx="1.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />

      <rect x="168" y="384" width="264" height="12" rx="1" fill="url(#bodyG)" stroke="#000" strokeWidth="1" />
      <rect x="178" y="399" width="244" height="216" rx="4" fill="url(#freezerG)" />
      <text x="300" y="608" textAnchor="middle" fill="#ffd700" fontSize="11" fontWeight="bold" letterSpacing="4" fontFamily="sans-serif" opacity="0.8">NAELUM</text>

      <g transform="matrix(0.69,0,0,1,133.3,0)">
        <path d="M 430,24 L 586,2 L 584,392 L 430,390 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <path d="M 586,2 L 598,10 L 594,396 L 584,392 Z" fill="url(#bodyDark)" />
        <path d="M 430,24 L 442,28 L 586,2 L 598,10 Z" fill="url(#bodyLight)" />
        <path d="M 448,37 L 572,22 L 570,376 L 448,376 Z" fill="url(#interiorG)" />

        <path d="M 572,22 L 571,19 L 585,19 L 586,22 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 572,22 L 571,19 L 569,373 L 570,376 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 572,22 L 586,22 L 584,376 L 570,376 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />

        <path d="M 450,160 L 571,150 L 571,168 L 450,178 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 450,160 L 571,150" fill="none" stroke="#FFF4D8" strokeWidth="3" />
        <path d="M 450,353 L 570,351 L 570,376 L 450,376 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 450,353 L 570,351" fill="none" stroke="#FFF4D8" strokeWidth="3" />
      </g>

      <g transform="matrix(0.69,0,0,1,133.3,0)">
        <path d="M 430,402 L 574,406 L 572,624 L 430,622 Z" fill="url(#bodyG)" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <path d="M 574,406 L 594,410 L 592,620 L 572,624 Z" fill="url(#bodyDark)" />
        <path d="M 430,402 L 442,406 L 574,406 L 584,410 Z" fill="url(#bodyLight)" />
        <path d="M 448,416 L 556,422 L 554,608 L 448,604 Z" fill="url(#freezerG)" />

        <path d="M 556,422 L 555,419 L 569,420 L 570,423 Z" fill="url(#railTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 556,422 L 555,419 L 553,605 L 554,608 Z" fill="url(#railSideG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 556,422 L 570,423 L 568,609 L 554,608 Z" fill="url(#railFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />

        <path d="M 448,571 L 556,569 L 556,581 L 450,583 Z" fill="url(#creamTopG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 450,583 L 556,581 L 555,608 L 450,608 Z" fill="url(#creamFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
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
