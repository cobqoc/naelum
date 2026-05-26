#!/usr/bin/env node
// god-file 임계 CI scan — 모든 소스 파일의 줄 수를 검사한다.
//
// CLAUDE.md "🧱 코드 유지 체계" 분해 임계:
//  - >= 900: 분해 *필수* → exit 1 (CI 빨강)
//  - >= 700: 분해 *검토* → notice 만 (CI 통과)
//
// 영상 「2차 소프트웨어 위기」 처방: 사람 규율이 아니라 파이프라인으로 강제.
// PostToolUse hook ([[feedback-check-line-count-before-adding]]) 은 *작성 시점* 알림,
// 이 스캔은 *머지 차단* — 이중 안전망.
//
// 사용:
//   node scripts/scan-line-counts.mjs           # 전체 스캔
//   node scripts/scan-line-counts.mjs --json    # JSON 출력 (CI parsing)
//
// 제외 (PostToolUse hook 과 동일):
//  - lib/i18n/locales/*.ts (locale 큰 게 정상)
//  - public/sw.js (생성물)
//  - **/*.test.ts(x) / *.spec.ts(x)
//  - node_modules / .next / dist / build / e2e/_*.spec.ts (scratch)

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const THRESHOLD_REVIEW = 700;
const THRESHOLD_REQUIRED = 900;

const EXCLUDED_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '.git']);
const EXCLUDED_FILE_PATTERNS = [
  /\/lib\/i18n\/locales\//,
  /\/lib\/supabase\/database\.types\.ts$/,  // 생성물 (supabase typegen)
  /\/public\/sw\.js$/,
  /\.test\.(ts|tsx|js|mjs)$/,
  /\.spec\.(ts|tsx|js|mjs)$/,
  /\/e2e\/_[^/]+\.spec\.ts$/, // scratch visual specs
  /\/scripts\/cache\//,
  /SVG\.tsx$/,                 // SVG 마크업 컴포넌트 (FridgeSVG 등) — CLAUDE.md 명시 예외
  /\/icons\//,                 // SVG 아이콘 디렉토리
];
const INCLUDE_EXTENSIONS = /\.(ts|tsx)$/;
// scripts/ 는 일회용 데이터 스크립트가 많아 임계 검사 부적합 — 산출물 (insert-*, import-*).
// 재사용 lib 코드는 lib/ 에 있고, app/components 가 진짜 god-file 위험 영역.
const INCLUDE_DIRS = new Set(['app', 'components', 'lib']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walk(full)));
    } else if (entry.isFile() && INCLUDE_EXTENSIONS.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function isExcluded(file) {
  return EXCLUDED_FILE_PATTERNS.some(re => re.test(file));
}

async function lineCount(file) {
  const content = await readFile(file, 'utf8');
  return content.split('\n').length;
}

async function main() {
  const jsonMode = process.argv.includes('--json');
  const targets = [];
  for (const dir of INCLUDE_DIRS) {
    const path = join(ROOT, dir);
    try {
      const files = await walk(path);
      targets.push(...files);
    } catch {
      // dir 없으면 skip
    }
  }

  const candidates = targets.filter(f => !isExcluded(f));
  const results = [];
  for (const file of candidates) {
    const lines = await lineCount(file);
    if (lines >= THRESHOLD_REVIEW) {
      results.push({ file: relative(ROOT, file), lines });
    }
  }

  results.sort((a, b) => b.lines - a.lines);

  if (jsonMode) {
    process.stdout.write(JSON.stringify(results, null, 2) + '\n');
    process.exit(0);
  }

  const required = results.filter(r => r.lines >= THRESHOLD_REQUIRED);
  const reviewOnly = results.filter(r => r.lines < THRESHOLD_REQUIRED);

  if (required.length === 0 && reviewOnly.length === 0) {
    process.stdout.write('✅ god-file 임계 위반 없음 (검사: ' + candidates.length + ' 파일)\n');
    process.exit(0);
  }

  if (required.length > 0) {
    process.stderr.write(
      `\n🚨 god-file 분해 *필수* 임계 (${THRESHOLD_REQUIRED}+) 초과 — ${required.length}개\n`
    );
    for (const r of required) {
      process.stderr.write(`   ${r.lines}줄  ${r.file}\n`);
    }
    process.stderr.write(
      `\n   CLAUDE.md "🧱 코드 유지 체계" 분해 *필수* 선. 분해 PR 우선 진행.\n` +
        `   참고: [[project-god-file-phase2]] · [[feedback-check-line-count-before-adding]]\n\n`
    );
  }

  if (reviewOnly.length > 0) {
    process.stdout.write(
      `\n⚠️  god-file 분해 *검토* 임계 (${THRESHOLD_REVIEW}~${THRESHOLD_REQUIRED - 1}) — ${reviewOnly.length}개 (CI 통과)\n`
    );
    for (const r of reviewOnly) {
      process.stdout.write(`   ${r.lines}줄  ${r.file}\n`);
    }
  }

  process.exit(required.length > 0 ? 1 : 0);
}

main().catch(e => {
  process.stderr.write(`scan-line-counts error: ${e?.message ?? e}\n`);
  process.exit(2);
});
