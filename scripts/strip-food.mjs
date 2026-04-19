#!/usr/bin/env node
// FridgeSVG.tsx에서 모든 bottle/fish/bread 등 식재료 요소 제거
// - <g> 래퍼 안에 bottle gradient 참조가 있는 블록 통째로 제거
// - path/rect의 fill=url(#bottleXXX) 가 들어있는 줄 제거
// - 물고기/빵 등 하드코딩 블록 제거
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(__dirname, '..', 'app/fridge-home/FridgeSVG.tsx');
let s = await readFile(SOURCE, 'utf8');

// 1) bottle 사용 <g> 래퍼 블록 통째로 제거 (multiline)
//    <g>\n        <g transform="translate(...)">...bottle...</g>...\n      </g>
const BOTTLE_WRAPPER_RE = /^(\s*)<g>\n(?:\s*<g transform="translate\([^"]+\)">[^\n]*bottle[^\n]*<\/g>\n)+\s*<\/g>\n/gm;
s = s.replace(BOTTLE_WRAPPER_RE, '');

// 2) 잔여 <g transform="translate(...)"> 한줄에 bottle 포함된 단독 라인 제거
s = s.replace(/^\s*<g transform="translate\([^"]+\)">[^\n]*bottle[^\n]*<\/g>\n/gm, '');

// 3) rect with fill=url(#bottleXXX) 단독 라인 제거
s = s.replace(/^\s*<rect [^>]*fill="url\(#bottle[A-Za-z]+\)"[^>]*\/>\n/gm, '');

// 4) 물고기(fish)/빵(bread) 하드코딩 — 주석이 있으면 주석도 함께 제거
s = s.replace(/\{\/\*[^*]*(?:생선|물고기|fish|빵|bread)[^*]*\*\/\}\n?/gi, '');

// 5) 음식 주석 라벨 제거
s = s.replace(/\s*\{\/\*[^*]*(?:음식|아이템|item|food|재료)[^*]*\*\/\}\n?/gi, '\n');

// 6) 연속된 빈 줄 정리 (3개 이상 → 1개)
s = s.replace(/\n{3,}/g, '\n\n');

await writeFile(SOURCE, s);
console.log('✓ 식재료 제거 완료');
