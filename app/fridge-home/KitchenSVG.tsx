'use client';

export default function KitchenSVG() {
  return (
    <svg viewBox="0 0 660 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cabFrontG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4c030" />
          <stop offset="100%" stopColor="#c08820" />
        </linearGradient>
        <linearGradient id="cabTopG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fadc60" />
          <stop offset="100%" stopColor="#e8b840" />
        </linearGradient>
        <linearGradient id="glassG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8f0f5" />
          <stop offset="100%" stopColor="#b8d4e0" />
        </linearGradient>
        <linearGradient id="hoodG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d8d8d8" />
        </linearGradient>
        <linearGradient id="stoveG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8c8c8" />
          <stop offset="100%" stopColor="#888888" />
        </linearGradient>
        <linearGradient id="potG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5ba8a0" />
          <stop offset="100%" stopColor="#3a7870" />
        </linearGradient>
        <linearGradient id="potRedG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e74c3c" />
          <stop offset="100%" stopColor="#a02820" />
        </linearGradient>
        <radialGradient id="counterShadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <ellipse cx="330" cy="215" rx="310" ry="5" fill="url(#counterShadowG)" />

      <path d="M 60,14 L 240,18 L 248,80 L 54,76 Z" fill="url(#cabFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 60,14 L 240,18 L 244,22 L 62,18 Z" fill="url(#cabTopG)" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <rect x="72" y="28" width="72" height="38" rx="2" fill="url(#glassG)" stroke="#000" strokeWidth="2" />
      <path d="M 72,38 L 144,38" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
      <path d="M 72,50 L 144,50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      <rect x="158" y="28" width="76" height="38" rx="2" fill="url(#glassG)" stroke="#000" strokeWidth="2" />
      <path d="M 158,38 L 234,38" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
      <path d="M 158,50 L 234,50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      <path d="M 54,76 L 248,80" fill="none" stroke="#2A1408" strokeWidth="2" />

      <ellipse cx="100" cy="15" rx="18" ry="3" fill="rgba(0,0,0,0.2)" />
      <path d="M 85,0 L 115,0 L 115,14 L 85,14 Z" fill="url(#potG)" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="100" cy="0" rx="15" ry="3" fill="#6ab8b0" stroke="#000" strokeWidth="1.8" />
      <rect x="96" y="-6" width="8" height="4" rx="1" fill="#3a7870" stroke="#000" strokeWidth="1.5" />
      <path d="M 85,4 L 115,4" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

      <ellipse cx="180" cy="15" rx="22" ry="3" fill="rgba(0,0,0,0.2)" />
      <path d="M 160,2 L 200,2 L 200,14 L 160,14 Z" fill="url(#potRedG)" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="180" cy="2" rx="20" ry="3" fill="#f05a48" stroke="#000" strokeWidth="1.8" />
      <rect x="175" y="-5" width="10" height="4" rx="1" fill="#a02820" stroke="#000" strokeWidth="1.5" />

      <path d="M 280,14 L 380,14 L 395,60 L 265,60 Z" fill="url(#hoodG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 280,14 L 380,14 L 382,20 L 278,20 Z" fill="#e0e0e0" stroke="#000" strokeWidth="1.5" />
      <rect x="305" y="30" width="50" height="4" rx="2" fill="#333" />
      <rect x="305" y="40" width="50" height="4" rx="2" fill="#333" />
      <ellipse cx="330" cy="54" rx="20" ry="2" fill="rgba(0,0,0,0.15)" />

      <rect x="248" y="80" width="164" height="90" fill="url(#cabFrontG)" stroke="#000" strokeWidth="3" />
      <rect x="248" y="80" width="164" height="6" fill="url(#cabTopG)" stroke="#000" strokeWidth="2" />
      <rect x="260" y="92" width="140" height="42" rx="3" fill="url(#stoveG)" stroke="#000" strokeWidth="2" />
      <circle cx="285" cy="106" r="7" fill="#1a1a1a" stroke="#000" strokeWidth="1.5" />
      <circle cx="285" cy="106" r="3" fill="#333" />
      <circle cx="335" cy="106" r="7" fill="#1a1a1a" stroke="#000" strokeWidth="1.5" />
      <circle cx="335" cy="106" r="3" fill="#333" />
      <circle cx="285" cy="124" r="7" fill="#1a1a1a" stroke="#000" strokeWidth="1.5" />
      <circle cx="285" cy="124" r="3" fill="#333" />
      <circle cx="335" cy="124" r="7" fill="#1a1a1a" stroke="#000" strokeWidth="1.5" />
      <circle cx="335" cy="124" r="3" fill="#333" />
      <circle cx="373" cy="115" r="5" fill="#d8d8d8" stroke="#000" strokeWidth="1.2" />
      <rect x="256" y="144" width="148" height="22" rx="2" fill="url(#cabFrontG)" stroke="#000" strokeWidth="2" />
      <rect x="320" y="152" width="20" height="6" rx="1.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />

      <path d="M 420,14 L 600,18 L 606,80 L 412,76 Z" fill="url(#cabFrontG)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 420,14 L 600,18 L 598,22 L 418,18 Z" fill="url(#cabTopG)" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <rect x="432" y="28" width="76" height="38" rx="2" fill="url(#glassG)" stroke="#000" strokeWidth="2" />
      <path d="M 432,38 L 508,38" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
      <path d="M 432,50 L 508,50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      <rect x="520" y="28" width="72" height="38" rx="2" fill="url(#glassG)" stroke="#000" strokeWidth="2" />
      <path d="M 520,38 L 592,38" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
      <path d="M 520,50 L 592,50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      <path d="M 412,76 L 606,80" fill="none" stroke="#2A1408" strokeWidth="2" />

      <ellipse cx="480" cy="15" rx="20" ry="3" fill="rgba(0,0,0,0.2)" />
      <path d="M 462,2 L 498,2 L 498,14 L 462,14 Z" fill="url(#potRedG)" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="480" cy="2" rx="18" ry="3" fill="#f05a48" stroke="#000" strokeWidth="1.8" />
      <rect x="475" y="-5" width="10" height="4" rx="1" fill="#a02820" stroke="#000" strokeWidth="1.5" />

      <ellipse cx="560" cy="15" rx="16" ry="3" fill="rgba(0,0,0,0.2)" />
      <ellipse cx="560" cy="8" rx="16" ry="4" fill="#5a5a5a" stroke="#000" strokeWidth="2" />
      <ellipse cx="560" cy="6" rx="14" ry="3" fill="#888" />
      <rect x="574" y="6" width="22" height="4" rx="2" fill="#5a5a5a" stroke="#000" strokeWidth="1.5" />

      <rect x="412" y="80" width="200" height="90" fill="url(#cabFrontG)" stroke="#000" strokeWidth="3" />
      <rect x="412" y="80" width="200" height="6" fill="url(#cabTopG)" stroke="#000" strokeWidth="2" />
      <rect x="426" y="96" width="172" height="26" rx="2" fill="url(#glassG)" stroke="#000" strokeWidth="2" />
      <path d="M 426,104 L 598,104" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <path d="M 426,114 L 598,114" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <rect x="426" y="132" width="172" height="30" rx="2" fill="url(#cabFrontG)" stroke="#000" strokeWidth="2" />
      <rect x="502" y="142" width="20" height="6" rx="1.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />

      <rect x="36" y="80" width="212" height="90" fill="url(#cabFrontG)" stroke="#000" strokeWidth="3" />
      <rect x="36" y="80" width="212" height="6" fill="url(#cabTopG)" stroke="#000" strokeWidth="2" />
      <rect x="50" y="96" width="184" height="26" rx="2" fill="url(#glassG)" stroke="#000" strokeWidth="2" />
      <path d="M 50,104 L 234,104" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <path d="M 50,114 L 234,114" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <rect x="50" y="132" width="184" height="30" rx="2" fill="url(#cabFrontG)" stroke="#000" strokeWidth="2" />
      <rect x="128" y="142" width="20" height="6" rx="1.5" fill="#8a5020" stroke="#000" strokeWidth="1.2" />

      <rect x="0" y="170" width="660" height="12" fill="url(#cabFrontG)" stroke="#000" strokeWidth="2.5" />
      <rect x="0" y="170" width="660" height="3" fill="url(#cabTopG)" />
      <path d="M 0,182 L 660,182" fill="none" stroke="#2A1408" strokeWidth="2" />

      <rect x="0" y="185" width="660" height="22" fill="#c8803a" stroke="#000" strokeWidth="1.5" />
      <path d="M 0,190 L 660,190" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      <path d="M 0,196 L 660,196" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <path d="M 0,202 L 660,202" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
    </svg>
  );
}
