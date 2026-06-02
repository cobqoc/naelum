#!/usr/bin/env node
// fragility scan — 반복 버그 패턴을 머지 전에 잡는 가드레일.
//
// 영상 「2차 소프트웨어 위기」 처방: 사람 규율이 아니라 파이프라인으로 강제.
// scan-line-counts(god-file) 와 짝을 이루는 *패턴* 스캐너.
//
// 카테고리:
//  [BLOCK] client-date-utc — 'use client' 파일의 new Date().toISOString().slice(0,10)/.split('T')[0].
//          UTC라 KST 자정~오전9시 "오늘"이 하루 빠름(2026-06-03 유통기한 버그). lib/date/localDate 사용. exit 1.
//  [NOTE]  hardcoded-korean — client 컴포넌트 JSX 안 한글 문자열 리터럴 수(i18n 부채 추적). 블로킹 아님.
//
// 사용:
//   node scripts/scan-fragility.mjs            # 사람용
//   node scripts/scan-fragility.mjs --json     # CI parsing
//
// ⚠️ 서버 라우트(app/api/**)·날짜 산수 helpers.ts 의 UTC 는 *의도적*이라 제외(SSR #418 / 서버 키).
//    이 스캔은 'use client' 파일만 본다.

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'lib'];
const EXCLUDED_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '.git']);
const EXCLUDED_FILE = [
  /\/lib\/i18n\/locales\//,
  /\/lib\/supabase\/database\.types\.ts$/,
  /\.test\.(ts|tsx|js|mjs)$/,
  /\.spec\.(ts|tsx|js|mjs)$/,
  /\/lib\/date\/localDate\.ts$/,
];

async function walk(dir, acc = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) { if (!EXCLUDED_DIRS.has(e.name)) await walk(full, acc); }
    else if (/\.(ts|tsx)$/.test(e.name)) {
      const rel = relative(ROOT, full);
      if (!EXCLUDED_FILE.some(re => re.test('/' + rel))) acc.push(rel);
    }
  }
  return acc;
}

// new Date()...toISOString().slice(0,10) 또는 .split('T')[0] — 날짜-only UTC
const DATE_UTC = /\.toISOString\(\)\s*\.\s*(slice\(\s*0\s*,\s*10\s*\)|split\(\s*['"]T['"]\s*\)\s*\[\s*0\s*\])/;
// 한글 포함 문자열 리터럴 (대략치 — 부채 추적용)
const HANGUL_LITERAL = /['"`][^'"`]*[가-힣][^'"`]*['"`]/;

const files = [];
for (const d of SCAN_DIRS) await walk(join(ROOT, d), files);

const dateHits = [];
let koreanFiles = 0;

for (const f of files) {
  const src = await readFile(join(ROOT, f), 'utf8');
  const isClient = /^\s*['"]use client['"]/m.test(src.slice(0, 100));
  if (!isClient) continue;
  const lines = src.split('\n');

  lines.forEach((ln, i) => { if (DATE_UTC.test(ln)) dateHits.push(`${f}:${i + 1}`); });

  const hasKorean = lines.some(ln => {
    const t = ln.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return false;
    return HANGUL_LITERAL.test(ln);
  });
  if (hasKorean) koreanFiles++;
}

const report = { dateUtcClient: dateHits, hardcodedKoreanFiles: koreanFiles };

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('— fragility scan —\n');
  console.log(`[BLOCK] client 날짜 UTC: ${dateHits.length}`);
  dateHits.forEach(h => console.log(`   ✗ ${h}  → lib/date/localDate (localDateISO/addDaysLocalISO)`));
  console.log(`\n[NOTE]  하드코딩 한글 client 파일: ${koreanFiles}  (i18n 부채 — 글로벌 출시 전 t.* 로 이관)`);
}

if (dateHits.length > 0) {
  console.error('\n❌ client 날짜 UTC 패턴 발견 — lib/date/localDate 로 교체하세요 (KST 하루 어긋남).');
  process.exit(1);
}
console.log('\n✅ 블로킹(날짜 UTC) 통과.');
