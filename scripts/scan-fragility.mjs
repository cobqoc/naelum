#!/usr/bin/env node
// fragility scan — 반복 버그 패턴을 머지 전에 잡는 가드레일.
//
// 영상 「2차 소프트웨어 위기」 처방: 사람 규율이 아니라 파이프라인으로 강제.
// scan-line-counts(god-file) 와 짝을 이루는 *패턴* 스캐너.
//
// 카테고리:
//  [BLOCK] client-date-utc — 'use client' 파일의 new Date().toISOString().slice(0,10)/.split('T')[0].
//          UTC라 KST 자정~오전9시 "오늘"이 하루 빠름(2026-06-03 유통기한 버그). lib/date/localDate 사용. exit 1.
//  [RATCHET] hardcoded-korean / client-direct-read / select-star — 아래 RATCHET 상한(high-water mark) 초과 시 exit 1.
//          기존 부채는 통과시키되 *새로 늘면* 막는다(역행 차단). burndown 으로 수치가 줄면 RATCHET 상한도 *반드시* 같이 낮춰 잠가라.
//          - hardcoded-korean: client 컴포넌트 JSX 안 한글 문자열 리터럴 파일 수(i18n 부채). 글로벌 출시 전 t.* 로 이관.
//          - client-direct-read: 'use client' 파일의 supabase 직접 read(`.from(...).select`, mutation 제외).
//            데이터 페칭은 서버/데이터계층(lib/queries)으로 — docs/DATA_LAYER.md 점진 이전. (사용자 액션 mutation 은 제외.)
//          - select-star: `select('*')` 사용처 수(과대 fetch 부채). 쓰는 컬럼만 명시로 줄여나감.
//
// ── RATCHET 상한 — 현재 부채를 high-water mark 로 고정. 수치를 낮추면 여기 숫자도 같이 낮춰 다시 잠근다.
const RATCHET = {
  hardcodedKoreanFiles: 5,     // client *표시* 한글 파일 — 남은 5개는 전부 배달(delivery/merchant/rider/map) 미출시 deferred. 사용자 화면 i18n 이관 완료(2026-06-09). 출시 시 배달도 t.* 화 후 0 으로 잠금.
  clientDirectReadFiles: 0,    // client 직접 supabase read 파일
  clientDirectReadSites: 0,    // client 직접 supabase read 체인 총수
  selectStar: 5,               // select('*') 사용처. GDPR export(SELECT_STAR_EXEMPT)·JSDoc주석 제외 후 남은 실사용. 남은 5 = 배달 4(미출시 deferred) + ingredient_recognition_feedback(dev 미존재 dead 스텁, Phase3 이미지인식 대기). 사용자화면 read 는 컬럼 명시 완료(2026-06-09).
};
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

// 한글 리터럴 카운트에서만 제외(다른 스캔은 정상 적용). 이들은 i18n(t.*) 부채가 아니다:
//  - admin/** · components/Admin/** : 운영자(operator) 전용 화면. 8개 로케일 번역은 헛수고 + 정크 키. 한글 유지.
//  - error.tsx · global-error.tsx : I18nProvider *바깥*에서 렌더돼 useI18n() 호출 불가 → 자체 인라인 ko/en/ja/zh… 맵으로 이미 지역화됨. ko 엔트리가 오탐될 뿐.
//  - terms/privacy/copyright/cookies : 법적 본문은 인증(법무 검토) 번역 trigger 대기 — AI 번역은 법적 리스크. 비한국어엔 LegalKoreanOnlyNotice(번역됨) 표시. = 법무 백로그지 i18n 부채 아님.
// ⚠️ 배달(delivery/merchant/rider/map)은 *여기 제외 아님* — 미출시라 번역을 미뤘을 뿐 진짜 i18n 부채. 카운트 유지하고 출시 trigger 때 burndown.
const KOREAN_EXEMPT = [
  /\/admin\//,
  /\/components\/Admin\//,
  /\/error\.tsx$/,
  /\/global-error\.tsx$/,
  /\/(terms|privacy|copyright|cookies)\/page\.tsx$/,
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
// DB 센티넬 토큰 — CLAUDE.md "DB 저장 값(냉장/냉동/상온 등)은 한글 그대로 유지" 규칙.
// 이 한글들은 *DB 값/도메인 enum*(storage_location, unit)이라 번역 대상이 아니다(번역하면 DB 비교가 깨짐).
// 표시는 t.quickAdd.storageLocationLabels / unitLabels 맵을 경유한다. 따라서 한 줄의 한글이
// 이 토큰들*뿐*이면 i18n 부채로 세지 않는다(false positive 제거). storage/unit enum 과
// useUnitConversion 의 단위 별칭(그램·리터 등) 포함.
const DB_SENTINEL_TOKENS = [
  '냉장', '냉동', '상온', '기타',                              // storage_location enum
  '선택', '개', '큰술', '작은술', '컵', '줌', '꼬집', '조각',   // unit enum (quickAdd.unitLabels)
  '장', '포기', '대', '모', '마리',
  '그램', '킬로그램', '밀리리터', '리터', '컵', '온스', '파운드', // useUnitConversion 입력 별칭
  '물',                                                       // 데모 워터 아이템 필터(DB 비교값)
  '한국어',                                                   // 언어 스위처 endonym — 모든 로케일에서 한국어 이름은 "한국어"(자기언어 표기). 번역 대상 아님.
];
const SENTINEL_LITERAL = new RegExp(
  '([\'"`])(' + DB_SENTINEL_TOKENS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\1',
  'g'
);
// mutation 동사 — 이게 같은 .from() 체인에 있으면 read 아님(허용)
const MUTATION = /\.(insert|update|delete|upsert)\(/;
// select('*') / select("*") / select(`*`) — 과대 fetch
const SELECT_STAR = /\.select\(\s*['"`]\*['"`]\s*\)/g;
// select('*') 카운트 면제 — *의도적으로 전체 컬럼이 옳은* 곳:
//  - users/export: GDPR Art.20 데이터 이동권. 모든 컬럼 포함이 요구사항 — 컬럼 명시하면 신규 PII 누락(완전성 회귀).
//    새 컬럼이 자동으로 export 에 포함되는 게 *바람직*하므로 select('*') 가 정답.
const SELECT_STAR_EXEMPT = [/\/app\/api\/users\/export\/route\.ts$/];

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
const koreanList = [];   // 한글 리터럴이 남은(면제 아님) client 파일 — burndown 추적용
const clientReadFiles = [];   // 클라 직접 read 가 있는 파일들 (file:횟수)
let clientReadSites = 0;       // 클라 직접 read 체인 총수
let selectStar = 0;            // select('*') 총수 (서버 포함 전체)

for (const f of files) {
  const src = await readFile(join(ROOT, f), 'utf8');

  // select('*') 는 서버/클라 무관 전체 스캔. 단 주석(JSDoc 사용 예시)과 면제 파일(GDPR export)은 제외.
  if (!SELECT_STAR_EXEMPT.some(re => re.test('/' + f))) {
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    selectStar += (codeOnly.match(SELECT_STAR) || []).length;
  }

  const isClient = /^\s*['"]use client['"]/m.test(src.slice(0, 100));
  if (!isClient) continue;
  const lines = src.split('\n');

  lines.forEach((ln, i) => { if (DATE_UTC.test(ln)) dateHits.push(`${f}:${i + 1}`); });

  // 한글 i18n 부채 판정: 주석(블록·JSX·라인)과 console.* dev 로그는 UI 가 아니라 제외.
  // 블록/JSX 주석은 여러 줄에 걸치므로 *소스 레벨*에서 먼저 제거(연속줄 false positive 차단).
  const koreanExempt = KOREAN_EXEMPT.some(re => re.test('/' + f));
  const srcNoBlock = src.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '');
  const hasKorean = !koreanExempt && srcNoBlock.split('\n').some(ln => {
    const t = ln.trim();
    if (t.startsWith('//') || t.startsWith('console.')) return false;   // 라인 주석·dev 로그 제외
    // DB 센티넬 토큰('냉장','큰술' 등 quoted)을 제거한 뒤에도 한글 리터럴이 남으면 진짜 부채.
    const stripped = ln.replace(SENTINEL_LITERAL, '$1$1');
    return HANGUL_LITERAL.test(stripped);
  });
  if (hasKorean) { koreanFiles++; koreanList.push(f); }

  const reads = countClientReadChains(src);
  if (reads > 0) { clientReadFiles.push(`${f}:${reads}`); clientReadSites += reads; }
}

const report = {
  dateUtcClient: dateHits,
  hardcodedKoreanFiles: koreanFiles,
  hardcodedKoreanList: koreanList,
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

// ── ratchet enforcement — 상한 초과 시 차단, 미만이면 상한 낮추라고 알림 ──
const ratchetChecks = [
  ['하드코딩 한글 client 파일', report.hardcodedKoreanFiles, RATCHET.hardcodedKoreanFiles],
  ['client 직접 read 파일',      report.clientDirectReadFiles, RATCHET.clientDirectReadFiles],
  ['client 직접 read 곳',        report.clientDirectReadSites, RATCHET.clientDirectReadSites],
  ["select('*')",                report.selectStar,            RATCHET.selectStar],
];
const ratchetViolations = ratchetChecks.filter(([, cur, max]) => cur > max);
const ratchetLoosened = ratchetChecks.filter(([, cur, max]) => cur < max);

if (dateHits.length > 0) {
  console.error('\n❌ client 날짜 UTC 패턴 발견 — lib/date/localDate 로 교체하세요 (KST 하루 어긋남).');
  process.exit(1);
}
if (ratchetViolations.length > 0) {
  if (!process.argv.includes('--json')) {
    console.error('\n❌ ratchet 역행 — 아래 부채가 상한을 넘었습니다 (새로 늘리지 말 것):');
    ratchetViolations.forEach(([name, cur, max]) =>
      console.error(`   ✗ ${name}: ${cur} > 상한 ${max}`));
  }
  process.exit(1);
}
// --json 모드에선 stdout 을 순수 JSON 으로 유지(CI 파싱). 사람용 통과 메시지는 생략.
if (!process.argv.includes('--json')) {
  ratchetLoosened.forEach(([name, cur, max]) =>
    console.log(`🔽 ${name}: ${cur} < 상한 ${max} — scan-fragility.mjs 의 RATCHET 상한을 ${cur} 로 낮춰 다시 잠그세요.`));
  console.log('\n✅ 블로킹(날짜 UTC + ratchet) 통과.');
}
