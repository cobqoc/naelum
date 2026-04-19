#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');
const BASE = path.join(ROOT, '.fridge-backups/FridgeSVG.design-1.tsx');

// 10 variants — top thicker than bottom, plus increasing 3D detail levels
const variants = [
  { n: 1, label: 'thick55-30',     top: 0.55, bot: 0.30, threed: 'basic' },
  { n: 2, label: 'thick65-35',     top: 0.65, bot: 0.35, threed: 'basic' },
  { n: 3, label: 'thick70-40',     top: 0.70, bot: 0.40, threed: 'basic' },
  { n: 4, label: 'thick75-45',     top: 0.75, bot: 0.45, threed: 'medium' },
  { n: 5, label: 'thick80-50',     top: 0.80, bot: 0.50, threed: 'medium' },
  { n: 6, label: 'thick65-40-3d',  top: 0.65, bot: 0.40, threed: 'strong' },
  { n: 7, label: 'thick70-45-3d',  top: 0.70, bot: 0.45, threed: 'strong' },
  { n: 8, label: 'thick75-50-3d',  top: 0.75, bot: 0.50, threed: 'strong' },
  { n: 9, label: 'thick60-35-skew',top: 0.60, bot: 0.35, threed: 'skew' },
  { n: 10,label: 'thick70-40-skew',top: 0.70, bot: 0.40, threed: 'skew' },
];

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const screenshot = (out) => new Promise((resolve, reject) => {
  const p = spawn('node', [path.join(ROOT, 'scripts/screenshot-fridge.mjs'), out], { stdio: 'inherit' });
  p.on('close', code => code === 0 ? resolve() : reject(new Error('screenshot failed: ' + code)));
});

const baseSrc = await readFile(BASE, 'utf8');

// Build matrix string with optional skew for 3D angle effect
const mat = (s, hinge, threed) => {
  const tx = hinge * (1 - s);
  if (threed === 'skew') {
    // slight vertical skew toward hinge to fake perspective tilt
    const skewSign = hinge < 300 ? -0.05 : 0.05;
    const ty = skewSign > 0 ? -hinge * skewSign : -hinge * skewSign;
    return `matrix(${s},${skewSign},0,1,${tx},${Math.abs(ty)/2})`;
  }
  return `matrix(${s},0,0,1,${tx},0)`;
};

// Insert 3D detail layers after the bottle racks/door stuff but before body
// We'll inject these as additional <defs> filter and overlay rects
const threedDefs = (level) => {
  const defs = [];
  // Inner door shadow gradient (darker near hinge)
  defs.push(`<linearGradient id="doorShadow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="80%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
        </linearGradient>`);
  defs.push(`<linearGradient id="doorShadowR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="80%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
        </linearGradient>`);
  // Cast shadow gradient (from doors onto body)
  defs.push(`<radialGradient id="castShadow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.18)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>`);
  return defs.join('\n        ');
};

// Overlay layers added after body for 3D depth
const threedOverlay = (level, topScale, botScale) => {
  if (level === 'basic') {
    return `
      {/* 3D basic: cast shadow on body interior near hinges */}
      <ellipse cx="180" cy="200" rx="40" ry="180" fill="url(#castShadow)" opacity="0.5" />
      <ellipse cx="420" cy="200" rx="40" ry="180" fill="url(#castShadow)" opacity="0.5" />
      <ellipse cx="180" cy="500" rx="35" ry="100" fill="url(#castShadow)" opacity="0.5" />
      <ellipse cx="420" cy="500" rx="35" ry="100" fill="url(#castShadow)" opacity="0.5" />`;
  }
  if (level === 'medium') {
    return `
      {/* 3D medium: cast shadow + door edge highlights */}
      <ellipse cx="180" cy="200" rx="50" ry="180" fill="url(#castShadow)" opacity="0.7" />
      <ellipse cx="420" cy="200" rx="50" ry="180" fill="url(#castShadow)" opacity="0.7" />
      <ellipse cx="180" cy="500" rx="45" ry="100" fill="url(#castShadow)" opacity="0.7" />
      <ellipse cx="420" cy="500" rx="45" ry="100" fill="url(#castShadow)" opacity="0.7" />
      {/* Door inner edge depth highlight */}
      <line x1="170" y1="22" x2="170" y2="392" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <line x1="430" y1="22" x2="430" y2="392" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <line x1="170" y1="402" x2="170" y2="622" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <line x1="430" y1="402" x2="430" y2="622" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />`;
  }
  if (level === 'strong') {
    return `
      {/* 3D strong: deeper shadows + edge depth + ground reflection */}
      <ellipse cx="180" cy="200" rx="60" ry="180" fill="url(#castShadow)" opacity="0.85" />
      <ellipse cx="420" cy="200" rx="60" ry="180" fill="url(#castShadow)" opacity="0.85" />
      <ellipse cx="180" cy="500" rx="55" ry="100" fill="url(#castShadow)" opacity="0.85" />
      <ellipse cx="420" cy="500" rx="55" ry="100" fill="url(#castShadow)" opacity="0.85" />
      {/* Door thickness edge (visible inner red strip showing depth) */}
      <rect x="166" y="14" width="6" height="378" fill="#a83020" stroke="#000" strokeWidth="1.5" />
      <rect x="428" y="14" width="6" height="378" fill="#a83020" stroke="#000" strokeWidth="1.5" />
      <rect x="166" y="400" width="6" height="220" fill="#a83020" stroke="#000" strokeWidth="1.5" />
      <rect x="428" y="400" width="6" height="220" fill="#a83020" stroke="#000" strokeWidth="1.5" />
      <line x1="170" y1="22" x2="170" y2="392" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      <line x1="430" y1="22" x2="430" y2="392" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      {/* Top depth shadow under each door */}
      <ellipse cx="90" cy="395" rx="80" ry="6" fill="rgba(0,0,0,0.3)" />
      <ellipse cx="510" cy="395" rx="80" ry="6" fill="rgba(0,0,0,0.3)" />`;
  }
  if (level === 'skew') {
    return `
      {/* 3D skew: tilted perspective doors + dramatic shadows */}
      <ellipse cx="180" cy="200" rx="55" ry="180" fill="url(#castShadow)" opacity="0.7" />
      <ellipse cx="420" cy="200" rx="55" ry="180" fill="url(#castShadow)" opacity="0.7" />
      <ellipse cx="180" cy="500" rx="50" ry="100" fill="url(#castShadow)" opacity="0.7" />
      <ellipse cx="420" cy="500" rx="50" ry="100" fill="url(#castShadow)" opacity="0.7" />
      {/* tilt shadow */}
      <path d="M 100,30 L 170,22 L 170,392 L 110,388 Z" fill="rgba(0,0,0,0.15)" />
      <path d="M 500,30 L 430,22 L 430,392 L 490,388 Z" fill="rgba(0,0,0,0.15)" />`;
  }
  return '';
};

for (const v of variants) {
  let src = baseSrc;
  // Replace 4 transform matrices
  // Order: lines 95(L top), 165(L bot), 364(R top), 429(R bot)
  // Pattern matches: matrix(0.30,0,0,1,119,0) for left, matrix(0.30,0,0,1,301,0) for right
  // We'll do positional replacement using occurrence counter

  let leftCount = 0;
  let rightCount = 0;
  src = src.replace(/<g transform="matrix\(0\.30,0,0,1,119,0\)">/g, () => {
    const isTop = leftCount === 0;
    leftCount++;
    return `<g transform="${mat(isTop ? v.top : v.bot, 170, v.threed)}">`;
  });
  src = src.replace(/<g transform="matrix\(0\.30,0,0,1,301,0\)">/g, () => {
    const isTop = rightCount === 0;
    rightCount++;
    return `<g transform="${mat(isTop ? v.top : v.bot, 430, v.threed)}">`;
  });

  // Inject 3D defs into <defs>
  const defsExtra = threedDefs(v.threed);
  src = src.replace('</defs>', `        ${defsExtra}\n      </defs>`);

  // Inject 3D overlay AFTER all door elements but inside SVG
  const overlay = threedOverlay(v.threed, v.top, v.bot);
  src = src.replace('</svg>', `${overlay}\n    </svg>`);

  await writeFile(SOURCE, src);
  await writeFile(path.join(ROOT, `.fridge-backups/FridgeSVG.thick-${v.n}.tsx`), src);
  await wait(1500);
  await screenshot(path.join(ROOT, `.fridge-backups/thick-${v.n}.png`));
  console.log(`  → thick-${v.n} (${v.label}, top=${v.top}, bot=${v.bot}, 3d=${v.threed}) done`);
}

console.log('\nAll 10 thick variants rendered.');
