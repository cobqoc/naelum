#!/usr/bin/env node
// dce1602 코드 → naelum-centered 모습 + 시원한 색상 + 본체 슬림 외곽선 영구 변환
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'app/fridge-home/FridgeSVG.tsx');

let src = await readFile(SOURCE, 'utf8');

// 1) 음식 g translate 그룹 모두 제거 (matrix 그룹은 보존)
src = src.replace(/\s*<g transform="translate\([^)]+\)">[\s\S]*?<\/g>/g, '');

// 2) 손잡이 4개 제거 (주석 + rect 4개)
src = src.replace(
  /\s*\{\/\* 큰 손잡이 4개[\s\S]*?(?=\s*<rect x="168" y="624")/,
  '\n      '
);

// 3) 본체 상단 3번째 선반 제거 (M 178,304 ~ M 178,324 라인)
src = src.replace(
  /\s*<path d="M 178,304[\s\S]*?M 178,324 L 422,324"[^/]*\/>/,
  ''
);

// 4) 색상 그라디언트 stops 교체
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

// 시원한 인테리어 색상 (사용자 지시)
src = replaceGradient(src, 'interiorG', '#f5fbff', '#dceaf4');
src = replaceGradient(src, 'freezerG', '#eef6ff', '#cee0ee');

// 5) 본체 외곽선 두께 70% (3 → 2.5)
src = src.replace(
  /<rect x="166" y="14" width="3" height="615" fill="#000" \/>/,
  '<rect x="166" y="14" width="2.5" height="615" fill="#000" />'
);
src = src.replace(
  /<rect x="431" y="14" width="3" height="615" fill="#000" \/>/,
  '<rect x="431.5" y="14" width="2.5" height="615" fill="#000" />'
);
src = src.replace(
  /<rect x="166" y="14" width="268" height="3" fill="#000" \/>/,
  '<rect x="166" y="14" width="268" height="2.5" fill="#000" />'
);
src = src.replace(
  /<rect x="166" y="626" width="268" height="3" fill="#000" \/>/,
  '<rect x="166" y="626.5" width="268" height="2.5" fill="#000" />'
);

// 6) 그림자 효과 제거 — lightG rect, castShadow ellipse 4개
src = src.replace(
  /\s*<rect x="178" y="28" width="244" height="80" rx="4" fill="url\(#lightG\)" \/>/,
  ''
);
src = src.replace(
  /\s*\{\/\* 3D basic: cast shadow on body interior near hinges \*\/\}\s*<ellipse[^/]*castShadow[^/]*\/>\s*<ellipse[^/]*castShadow[^/]*\/>\s*<ellipse[^/]*castShadow[^/]*\/>\s*<ellipse[^/]*castShadow[^/]*\/>/,
  ''
);

// 7) 사용 안 하는 bottle gradient defs 정리
src = src.replace(
  /\s*<linearGradient id="bottle[A-Z][a-zA-Z]*"[^>]*>[\s\S]*?<\/linearGradient>/g,
  ''
);

// 8) 도어 stroke는 4 유지 (변환 X) — final-v2의 8 변환 적용하지 않음

await writeFile(SOURCE, src);
console.log('  → FridgeSVG.tsx 변환 완료');
