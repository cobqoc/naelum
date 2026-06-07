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
//  [NOTE]  client-direct-read — 'use client' 파일의 supabase 직접 read(`.from(...).select`, mutation 제외).
//          데이터 페칭은 서버/데이터계층(lib/queries)으로 — docs/DATA_LAYER.md 점진 이전. 숫자가 줄어야 함.
//          (사용자 액션 mutation insert/update/delete/upsert/rpc 는 허용이라 제외.) 블로킹 아님.
//  [NOTE]  select-star — `select('*')` 사용처 수(과대 fetch 부채). 쓰는 컬럼만 명시로 줄여나감. 블로킹 아님.
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
// mutation 동사 — 이게 같은 .from() 체인에 있으면 read 아님(허용)
const MUTATION = /\.(insert|update|delete|upsert)\(/;
// select('*') / select("*") / select(`*`) — 과대 fetch
const SELECT_STAR = /\.select\(\s*['"`]\*['"`]\s*\)/g;

// 한 'use client' 파일의 supabase 직접 read 체인 수 (.from(...) 이후 창에 .select 있고 mutation 없음)
function countClientReadChains(src) {
  const parts = src.split(/\.from\(/);
  let reads = 0;
  for (let k = 1; k < parts.length; k++) {
    const seg = parts[k].slice(0, 400); // 체인 윈도우(메서드 체인이 보통 이 안)
    if (/\.select\(/.test(seg) && !MUTATION.test(seg)) reads++;
  }
  return reads;
}

const files = [];
for (const d of SCAN_DIRS) await walk(join(ROOT, d), files);

const dateHits = [];
let koreanFiles = 0;
const clientReadFiles = [];   // 클라 직접 read 가 있는 파일들 (file:횟수)
let clientReadSites = 0;       // 클라 직접 read 체인 총수
let selectStar = 0;            // select('*') 총수 (서버 포함 전체)

for (const f of files) {
  const src = await readFile(join(ROOT, f), 'utf8');

  // select('*') 는 서버/클라 무관 전체 스캔
  selectStar += (src.match(SELECT_STAR) || []).length;

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

  const reads = countClientReadChains(src);
  if (reads > 0) { clientReadFiles.push(`${f}:${reads}`); clientReadSites += reads; }
}

const report = {
  dateUtcClient: dateHits,
  hardcodedKoreanFiles: koreanFiles,
  clientDirectReadFiles: clientReadFiles.length,
  clientDirectReadSites: clientReadSites,
  clientDirectReadList: clientReadFiles,
  selectStar,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('— fragility scan —\n');
  console.log(`[BLOCK] client 날짜 UTC: ${dateHits.length}`);
  dateHits.forEach(h => console.log(`   ✗ ${h}  → lib/date/localDate (localDateISO/addDaysLocalISO)`));
  console.log(`\n[NOTE]  하드코딩 한글 client 파일: ${koreanFiles}  (i18n 부채 — 글로벌 출시 전 t.* 로 이관)`);
  console.log(`\n[NOTE]  client 직접 read: ${clientReadFiles.length}개 파일 / ${clientReadSites}곳  (데이터 페칭은 lib/queries 로 — docs/DATA_LAYER.md. 숫자가 줄어야 함)`);
  clientReadFiles.forEach(h => console.log(`   • ${h}`));
  console.log(`\n[NOTE]  select('*'): ${selectStar}곳  (쓰는 컬럼만 명시로 과대 fetch 줄이기)`);
}

if (dateHits.length > 0) {
  console.error('\n❌ client 날짜 UTC 패턴 발견 — lib/date/localDate 로 교체하세요 (KST 하루 어긋남).');
  process.exit(1);
}
// --json 모드에선 stdout 을 순수 JSON 으로 유지(CI 파싱). 사람용 통과 메시지는 생략.
if (!process.argv.includes('--json')) console.log('\n✅ 블로킹(날짜 UTC) 통과.');
