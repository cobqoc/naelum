#!/usr/bin/env node
// dce1602 복원 코드 → naelum-centered 모습으로 영구 변환
// 1. 음식 g 그룹 모두 제거 (도어 안 bottle/fish 등)
// 2. 손잡이 4개 제거
// 3. 본체 상단 3번째 선반 제거
// 4. 색상 그라디언트 stops 교체 (final-v2 ref-exact)
// 5. 도어 외측 stroke 4→8

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');

let src = await readFile(SOURCE, 'utf8');

// 1) 음식 g 그룹 모두 제거 (translate transform — matrix는 보존)
src = src.replace(/\s*<g transform="translate\([^)]+\)">[\s\S]*?<\/g>/g, '');

// 2) 손잡이 제거 (주석 "손잡이 4개" 다음 ~ NAELUM 텍스트 직전까지)
src = src.replace(
  /\s*\{\/\* 손잡이 4개[\s\S]*?(?=\s*<rect x="168" y="624")/,
  '\n      '
);

// 3) 본체 상단 3번째 선반 제거 (M 178,304 ~ M 178,324 라인 7개 path)
src = src.replace(
  /\s*<path d="M 178,304[\s\S]*?M 178,324 L 422,324"[^/]*\/>/,
  ''
);

// 4) 색상 그라디언트 stops 교체 (final-v2 ref-exact)
const replaceGradient = (src, id, c1, c2) => {
  const re = new RegExp(
    `(<linearGradient id="${id}"[^>]*>)([\\s\\S]*?)(</linearGradient>)`
  );
  return src.replace(
    re,
    `$1\n          <stop offset="0%" stopColor="${c1}" />\n          <stop offset="100%" stopColor="${c2}" />\n        $3`
  );
};

src = replaceGradient(src, 'bodyG', '#e85a3a', '#c93820');
src = replaceGradient(src, 'bodyDark', '#8a1a10', '#6a1008');
src = replaceGradient(src, 'bodyLight', '#f07050', '#d84a30');
src = replaceGradient(src, 'creamFrontG', '#f4c030', '#c08820');
src = replaceGradient(src, 'creamTopG', '#fadc60', '#e8b840');
src = replaceGradient(src, 'railFrontG', '#f4c030', '#c08820');
src = replaceGradient(src, 'railSideG', '#c08820', '#c08820');
src = replaceGradient(src, 'railTopG', '#fadc60', '#e8b840');
src = replaceGradient(src, 'interiorG', '#f4f8fc', '#e8eff5');
src = replaceGradient(src, 'freezerG', '#f4f8fc', '#e8eff5');

// 5) 도어 외측 stroke 4→8 (bodyG/bodyDark/bodyLight)
src = src.replace(
  /fill="url\(#bodyG\)" stroke="#000" strokeWidth="4"/g,
  'fill="url(#bodyG)" stroke="#000" strokeWidth="8"'
);
// 어두운 외곽선도 굵게
src = src.replace(
  /fill="none" stroke="rgba\(40,40,40,0\.3\)" strokeWidth="3"/g,
  'fill="none" stroke="rgba(40,40,40,0.5)" strokeWidth="6"'
);

// 사용 안 하는 bottle gradient 정리 (선택적 — 안 해도 무방)
// 그대로 두면 dead defs. 깔끔히 제거:
src = src.replace(
  /\s*<linearGradient id="bottle[A-Z][a-zA-Z]*"[^>]*>[\s\S]*?<\/linearGradient>/g,
  ''
);

await writeFile(SOURCE, src);
console.log('  → FridgeSVG.tsx 변환 완료');
