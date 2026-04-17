'use client';

export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 170" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cabDoorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e85a3a" />
          <stop offset="100%" stopColor="#b83018" />
        </linearGradient>
        <linearGradient id="cabDoorLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f07050" />
          <stop offset="100%" stopColor="#d84a30" />
        </linearGradient>
        <linearGradient id="cabTopBarG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a0301a" />
          <stop offset="100%" stopColor="#7a1808" />
        </linearGradient>
        <linearGradient id="cabInnerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2a18" />
          <stop offset="100%" stopColor="#2a1408" />
        </linearGradient>
        <linearGradient id="woodG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8823a" />
          <stop offset="100%" stopColor="#8a5020" />
        </linearGradient>
        <linearGradient id="knobG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fadc60" />
          <stop offset="100%" stopColor="#c08820" />
        </linearGradient>
        <radialGradient id="knob3D" cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#fff0a0" />
          <stop offset="45%" stopColor="#f4c030" />
          <stop offset="100%" stopColor="#8a5810" />
        </radialGradient>
        <linearGradient id="cabDoorLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f07050" />
          <stop offset="100%" stopColor="#c83c20" />
        </linearGradient>
        <linearGradient id="cabDoorDeep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a1810" />
          <stop offset="100%" stopColor="#5a0808" />
        </linearGradient>
        <linearGradient id="redBarBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <radialGradient id="kitShadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="330" cy="155" rx="320" ry="4" fill="url(#kitShadowG)" />

      <path d="M 18,14 L 642,14 L 648,30 L 12,30 Z" fill="url(#cabTopBarG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 18,14 L 642,14" fill="none" stroke="#d04028" strokeWidth="1.5" />
      <rect x="12" y="30" width="636" height="5" fill="url(#redBarBottom)" />

      <g>
        <path d="M 22,30 L 166,30 L 168,128 L 20,128 Z" fill="url(#cabDoorG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <rect x="34" y="40" width="124" height="78" rx="6" fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
        <rect x="37" y="43" width="118" height="72" rx="5" fill="url(#cabDoorLight)" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" />
        <path d="M 37,45 L 155,45" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
        <path d="M 37,113 L 155,113" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <ellipse cx="148" cy="86" rx="8" ry="1.8" fill="rgba(0,0,0,0.28)" />
        <circle cx="148" cy="78" r="8" fill="url(#knob3D)" stroke="#000" strokeWidth="2" />
        <ellipse cx="145" cy="75" rx="3.2" ry="2" fill="rgba(255,255,255,0.55)" />
        <circle cx="144" cy="74" r="1.2" fill="rgba(255,255,255,0.95)" />
      </g>

      <g>
        <path d="M 170,30 L 314,30 L 316,128 L 168,128 Z" fill="url(#cabDoorG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <rect x="182" y="40" width="124" height="78" rx="6" fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
        <rect x="185" y="43" width="118" height="72" rx="5" fill="url(#cabDoorLight)" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" />
        <path d="M 185,45 L 303,45" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
        <path d="M 185,113 L 303,113" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <ellipse cx="186" cy="86" rx="8" ry="1.8" fill="rgba(0,0,0,0.28)" />
        <circle cx="186" cy="78" r="8" fill="url(#knob3D)" stroke="#000" strokeWidth="2" />
        <ellipse cx="183" cy="75" rx="3.2" ry="2" fill="rgba(255,255,255,0.55)" />
        <circle cx="182" cy="74" r="1.2" fill="rgba(255,255,255,0.95)" />
      </g>

      <g>
        <path d="M 318,30 L 462,30 L 464,128 L 316,128 Z" fill="url(#cabInnerG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 324,32 L 462,32" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />

        <rect x="318" y="62" width="146" height="3" fill="#8a5020" stroke="#000" strokeWidth="1.2" />
        <rect x="318" y="92" width="146" height="3" fill="#8a5020" stroke="#000" strokeWidth="1.2" />

        <ellipse cx="348" cy="58" rx="20" ry="3" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="348" cy="54" rx="19" ry="3" fill="#f5f5f5" stroke="#000" strokeWidth="1.2" />
        <ellipse cx="348" cy="50" rx="18" ry="3" fill="#ffffff" stroke="#000" strokeWidth="1" />

        <ellipse cx="420" cy="58" rx="18" ry="3" fill="#f0f0f0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="420" cy="54" rx="17" ry="3" fill="#fafafa" stroke="#000" strokeWidth="1.2" />

        <ellipse cx="348" cy="88" rx="18" ry="3" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="348" cy="84" rx="17" ry="3" fill="#f0f0f0" stroke="#000" strokeWidth="1.2" />

        <path d="M 390,72 Q 432,72 432,85 Q 432,89 411,89 Q 390,89 390,85 Z" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="411" cy="72" rx="21" ry="2.5" fill="#e8e8e8" stroke="#000" strokeWidth="1.2" />

        <rect x="326" y="100" width="14" height="18" rx="1.5" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="333" cy="100" rx="7" ry="1.8" fill="#e8e8e8" stroke="#000" strokeWidth="1" />

        <rect x="346" y="100" width="13" height="18" rx="1.5" fill="#f0f0f0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="352" cy="100" rx="6.5" ry="1.8" fill="#e0e0e0" stroke="#000" strokeWidth="1" />

        <rect x="366" y="98" width="15" height="20" rx="1.5" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="373" cy="98" rx="7.5" ry="2" fill="#e8e8e8" stroke="#000" strokeWidth="1" />
        <path d="M 381,102 Q 389,109 381,116" stroke="#000" strokeWidth="1.5" fill="none" />

        <path d="M 395,103 Q 440,103 440,118 L 395,118 Z" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="417.5" cy="103" rx="22.5" ry="2.5" fill="#e8e8e8" stroke="#000" strokeWidth="1.2" />
      </g>

      <g>
        <path d="M 610,30 L 616,36 L 618,130 L 612,128 Z" fill="url(#cabDoorDeep)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 610,30 L 616,36" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <path d="M 466,30 L 610,30 L 612,128 L 464,128 Z" fill="url(#cabDoorG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <rect x="478" y="40" width="124" height="78" rx="6" fill="rgba(0,0,0,0.22)" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
        <rect x="481" y="43" width="118" height="72" rx="5" fill="url(#cabDoorLight)" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" />
        <path d="M 481,45 L 599,45" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
        <path d="M 481,113 L 599,113" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <ellipse cx="482" cy="86" rx="8" ry="1.8" fill="rgba(0,0,0,0.28)" />
        <circle cx="482" cy="78" r="8" fill="url(#knob3D)" stroke="#000" strokeWidth="2" />
        <ellipse cx="479" cy="75" rx="3.2" ry="2" fill="rgba(255,255,255,0.55)" />
        <circle cx="478" cy="74" r="1.2" fill="rgba(255,255,255,0.95)" />
      </g>

      <rect x="8" y="128" width="644" height="32" fill="url(#woodG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 8,134 L 652,134" fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth="1.2" />
      <path d="M 8,140 L 652,140" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1" />
      <path d="M 8,146 L 652,146" fill="none" stroke="rgba(0,0,0,0.32)" strokeWidth="1.1" />
      <path d="M 8,152 L 652,152" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.9" />
      <path d="M 8,158 L 652,158" fill="none" stroke="#2A1408" strokeWidth="1.8" />
    </svg>
  );
}
