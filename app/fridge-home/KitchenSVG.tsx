'use client';

export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cabDoorG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e85a3a" />
          <stop offset="100%" stopColor="#b83018" />
        </linearGradient>
        <linearGradient id="cabDoorLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f07050" />
          <stop offset="100%" stopColor="#c83c20" />
        </linearGradient>
        <linearGradient id="cabDoorDeep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a1810" />
          <stop offset="100%" stopColor="#5a0808" />
        </linearGradient>
        <linearGradient id="cabInnerG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2a18" />
          <stop offset="100%" stopColor="#2a1408" />
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
        <radialGradient id="kitShadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="330" cy="214" rx="320" ry="4" fill="url(#kitShadowG)" />

      <g>
        <path d="M 22,10 L 16,22 L 18,214 L 20,210 Z" fill="url(#cabDoorLight)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 22,10 L 16,22" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
        <path d="M 22,10 L 166,10 L 168,210 L 20,210 Z" fill="url(#cabDoorG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <rect x="34" y="30" width="124" height="160" rx="10" fill="rgba(0,0,0,0.18)" stroke="rgba(0,0,0,0.45)" strokeWidth="2" />
        <rect x="37" y="36" width="118" height="148" rx="8" fill="url(#cabDoorLight)" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" />
        <path d="M 37,40 L 155,40" fill="none" stroke="rgba(0,0,0,0.26)" strokeWidth="1.3" />
        <path d="M 37,180 L 155,180" fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="1.1" />
        <ellipse cx="150" cy="118" rx="9" ry="2" fill="rgba(0,0,0,0.28)" />
        <circle cx="150" cy="108" r="10" fill="url(#knob3D)" stroke="#000" strokeWidth="2" />
        <ellipse cx="146" cy="104" rx="4" ry="2.5" fill="rgba(255,255,255,0.55)" />
        <circle cx="144.5" cy="102.5" r="1.5" fill="rgba(255,255,255,0.95)" />
      </g>

      <g>
        <path d="M 170,10 L 314,10 L 316,210 L 168,210 Z" fill="url(#cabDoorG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <rect x="181" y="28" width="126" height="164" rx="6" fill="rgba(0,0,0,0.24)" stroke="rgba(0,0,0,0.52)" strokeWidth="2.2" />
        <rect x="186" y="34" width="116" height="150" rx="6" fill="url(#cabDoorLight)" stroke="rgba(0,0,0,0.3)" strokeWidth="1.4" />
        <path d="M 186,38 L 302,38" fill="none" stroke="rgba(0,0,0,0.34)" strokeWidth="1.8" />
        <path d="M 186,180 L 302,180" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.9" />
        <ellipse cx="184" cy="128" rx="8.5" ry="1.9" fill="rgba(0,0,0,0.3)" />
        <circle cx="184" cy="118" r="9.5" fill="url(#knob3D)" stroke="#000" strokeWidth="2" />
        <ellipse cx="180" cy="114" rx="3.8" ry="2.4" fill="rgba(255,255,255,0.5)" />
        <circle cx="178.5" cy="112.5" r="1.4" fill="rgba(255,255,255,0.92)" />
      </g>

      <g>
        <path d="M 318,10 L 462,10 L 464,210 L 316,210 Z" fill="url(#cabInnerG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 324,14 L 462,14" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />

        <rect x="318" y="80" width="146" height="3.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />
        <rect x="318" y="140" width="146" height="3.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />

        <ellipse cx="348" cy="72" rx="22" ry="3.5" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="348" cy="66" rx="21" ry="3.2" fill="#f5f5f5" stroke="#000" strokeWidth="1.2" />
        <ellipse cx="348" cy="60" rx="20" ry="3" fill="#ffffff" stroke="#000" strokeWidth="1" />

        <ellipse cx="422" cy="72" rx="20" ry="3.5" fill="#f0f0f0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="422" cy="66" rx="19" ry="3.2" fill="#fafafa" stroke="#000" strokeWidth="1.2" />

        <ellipse cx="348" cy="132" rx="20" ry="3.5" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="348" cy="126" rx="19" ry="3.2" fill="#f0f0f0" stroke="#000" strokeWidth="1.2" />

        <path d="M 390,98 Q 434,98 434,128 Q 434,136 412,136 Q 390,136 390,128 Z" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="412" cy="98" rx="22" ry="3" fill="#e8e8e8" stroke="#000" strokeWidth="1.2" />

        <rect x="326" y="156" width="16" height="32" rx="2" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="334" cy="156" rx="8" ry="2" fill="#e8e8e8" stroke="#000" strokeWidth="1" />

        <rect x="348" y="156" width="15" height="32" rx="2" fill="#f0f0f0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="355.5" cy="156" rx="7.5" ry="2" fill="#e0e0e0" stroke="#000" strokeWidth="1" />

        <rect x="370" y="150" width="17" height="36" rx="2" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="378.5" cy="150" rx="8.5" ry="2.2" fill="#e8e8e8" stroke="#000" strokeWidth="1" />
        <path d="M 387,158 Q 397,170 387,182" stroke="#000" strokeWidth="1.8" fill="none" />

        <path d="M 395,160 Q 442,160 442,186 L 395,186 Z" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="418.5" cy="160" rx="23.5" ry="3" fill="#e8e8e8" stroke="#000" strokeWidth="1.2" />
      </g>

      <g>
        <path d="M 610,10 L 620,22 L 622,214 L 612,210 Z" fill="url(#cabDoorDeep)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M 610,10 L 620,22" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <path d="M 466,10 L 610,10 L 612,210 L 464,210 Z" fill="url(#cabDoorG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <rect x="477" y="26" width="126" height="168" rx="12" fill="rgba(0,0,0,0.3)" stroke="rgba(0,0,0,0.55)" strokeWidth="2.2" />
        <rect x="482" y="34" width="116" height="150" rx="9" fill="url(#cabDoorLight)" stroke="rgba(0,0,0,0.3)" strokeWidth="1.3" />
        <path d="M 482,38 L 598,38" fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth="2" />
        <path d="M 482,180 L 598,180" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
        <ellipse cx="484" cy="118" rx="10" ry="2.2" fill="rgba(0,0,0,0.32)" />
        <circle cx="484" cy="108" r="11" fill="url(#knob3D)" stroke="#000" strokeWidth="2" />
        <ellipse cx="479" cy="103" rx="4.3" ry="2.7" fill="rgba(255,255,255,0.58)" />
        <circle cx="477" cy="101" r="1.7" fill="rgba(255,255,255,0.95)" />
      </g>
    </svg>
  );
}
