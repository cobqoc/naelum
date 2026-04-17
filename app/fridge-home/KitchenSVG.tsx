'use client';

export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 160" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
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
        <radialGradient id="kitShadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="330" cy="155" rx="320" ry="4" fill="url(#kitShadowG)" />

      <path d="M 20,20 L 640,20 L 646,30 L 14,30 Z" fill="url(#cabTopBarG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 20,20 L 640,20" fill="none" stroke="#d04028" strokeWidth="1.5" />

      <g>
        <path d="M 22,30 L 166,30 L 168,128 L 20,128 Z" fill="url(#cabDoorG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 32,40 L 156,40 L 158,118 L 30,118 Z" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M 32,40 L 156,40" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <circle cx="148" cy="78" r="6" fill="url(#knobG)" stroke="#000" strokeWidth="2" />
        <circle cx="146.5" cy="76.5" r="1.8" fill="rgba(255,255,255,0.7)" />
      </g>

      <g>
        <path d="M 170,30 L 314,30 L 316,128 L 168,128 Z" fill="url(#cabDoorG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 180,40 L 304,40 L 306,118 L 178,118 Z" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M 180,40 L 304,40" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <circle cx="186" cy="78" r="6" fill="url(#knobG)" stroke="#000" strokeWidth="2" />
        <circle cx="184.5" cy="76.5" r="1.8" fill="rgba(255,255,255,0.7)" />
      </g>

      <g>
        <path d="M 318,30 L 462,30 L 464,128 L 316,128 Z" fill="url(#cabInnerG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 324,32 L 462,32" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />

        <rect x="318" y="64" width="146" height="3" fill="#8a5020" stroke="#000" strokeWidth="1.2" />
        <rect x="318" y="94" width="146" height="3" fill="#8a5020" stroke="#000" strokeWidth="1.2" />

        <ellipse cx="348" cy="60" rx="16" ry="3.5" fill="#f0f0f0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="348" cy="57" rx="14.5" ry="3" fill="#fafafa" stroke="#000" strokeWidth="1.2" />
        <ellipse cx="348" cy="54" rx="13" ry="2.5" fill="#ffffff" stroke="#000" strokeWidth="1" />

        <ellipse cx="395" cy="61" rx="15" ry="3.5" fill="#e8e8e8" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="395" cy="58" rx="13.5" ry="3" fill="#f5f5f5" stroke="#000" strokeWidth="1.2" />

        <ellipse cx="432" cy="62" rx="12" ry="3" fill="#f0f0f0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="432" cy="59" rx="10.5" ry="2.5" fill="#fafafa" stroke="#000" strokeWidth="1.2" />

        <rect x="338" y="75" width="14" height="16" rx="2" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="345" cy="75" rx="7" ry="2" fill="#e8e8e8" stroke="#000" strokeWidth="1.2" />
        <path d="M 352,78 Q 358,82 352,88" stroke="#000" strokeWidth="1.5" fill="none" />

        <rect x="360" y="76" width="14" height="15" rx="2" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="367" cy="76" rx="7" ry="2" fill="#e8e8e8" stroke="#000" strokeWidth="1.2" />
        <path d="M 374,79 Q 380,82 374,87" stroke="#000" strokeWidth="1.5" fill="none" />

        <path d="M 390,78 Q 420,78 420,90 Q 420,94 405,94 Q 390,94 390,90 Z" fill="#fafafa" stroke="#000" strokeWidth="1.5" />
        <path d="M 390,80 L 420,80" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />

        <ellipse cx="340" cy="108" rx="10" ry="2.5" fill="#ffffff" stroke="#000" strokeWidth="1.2" />
        <ellipse cx="370" cy="110" rx="12" ry="3" fill="#fafafa" stroke="#000" strokeWidth="1.2" />
        <ellipse cx="410" cy="108" rx="9" ry="2.5" fill="#f0f0f0" stroke="#000" strokeWidth="1.2" />
        <ellipse cx="440" cy="110" rx="11" ry="2.8" fill="#fafafa" stroke="#000" strokeWidth="1.2" />
      </g>

      <g>
        <path d="M 466,30 L 610,30 L 612,128 L 464,128 Z" fill="url(#cabDoorG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 476,40 L 600,40 L 602,118 L 474,118 Z" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M 476,40 L 600,40" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <circle cx="482" cy="78" r="6" fill="url(#knobG)" stroke="#000" strokeWidth="2" />
        <circle cx="480.5" cy="76.5" r="1.8" fill="rgba(255,255,255,0.7)" />
      </g>

      <rect x="10" y="128" width="640" height="18" fill="url(#woodG)" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 10,133 L 650,133" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      <path d="M 10,139 L 650,139" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="0.8" />
      <path d="M 10,146 L 650,146" fill="none" stroke="#2A1408" strokeWidth="1.8" />
    </svg>
  );
}
