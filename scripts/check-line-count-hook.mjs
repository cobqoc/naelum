#!/usr/bin/env node
// Claude Code PostToolUse hook — Edit/Write 후 파일 줄 수 체크.
//
// god-file 재발 방지 ([[feedback-check-line-count-before-adding]]).
// 분해 임계 (CLAUDE.md "🧱 코드 유지 체계"): ~700 검토 · ~900 필수.
//
// 입력: Claude Code 가 stdin 으로 JSON ({tool_name, tool_input: {file_path, ...}}).
// 출력: stderr 에 경고. 종료 코드는 항상 0 (PostToolUse 는 차단 안 함, 알림만).
//
// 제외 파일 (CLAUDE.md "i18n locale·생성물·SVG 마크업 제외"):
//  - lib/i18n/locales/*.ts (8 locale, 큰 게 정상)
//  - public/sw.js (생성물)
//  - 모든 *.svg.tsx / 마크업 전용 컴포넌트 (실용상 SVG 컴포넌트는 무시)
//  - *.test.ts / *.spec.ts (테스트는 클수록 좋음)
//  - node_modules / .next / dist / build (생성물)

import { readFileSync, existsSync } from 'node:fs';

const THRESHOLD_REVIEW = 700;   // 분해 검토
const THRESHOLD_REQUIRED = 900; // 분해 필수

let stdin = '';
try {
  stdin = readFileSync(0, 'utf8');
} catch {
  // stdin 못 읽으면 silent skip
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(stdin);
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path;
if (!filePath || typeof filePath !== 'string') process.exit(0);

// 절대 경로만 처리 (Edit/Write 는 항상 절대 경로)
if (!filePath.startsWith('/')) process.exit(0);

// 제외 패턴
const EXCLUDED = [
  /\/lib\/i18n\/locales\//,
  /\/lib\/supabase\/database\.types\.ts$/,  // 생성물 (supabase typegen)
  /\/public\/sw\.js$/,
  /\.test\.(ts|tsx|js|mjs)$/,
  /\.spec\.(ts|tsx|js|mjs)$/,
  /\/node_modules\//,
  /\/\.next\//,
  /\/dist\//,
  /\/build\//,
  /\/scripts\/cache\//,
  /\/scripts\//,                 // 일회용 데이터 스크립트 — 임계 검사 부적합
  /\/e2e\/_[^/]+\.spec\.ts$/,    // scratch visual specs
  /SVG\.tsx$/,                   // SVG 마크업 (FridgeSVG 등) — CLAUDE.md 명시 예외
  /\/icons\//,                   // SVG 아이콘 디렉토리
];
if (EXCLUDED.some(re => re.test(filePath))) process.exit(0);

// .ts/.tsx/.js/.mjs 만 (마크다운·JSON·CSS 등 제외)
if (!/\.(ts|tsx|js|mjs)$/.test(filePath)) process.exit(0);

if (!existsSync(filePath)) process.exit(0);

let content;
try {
  content = readFileSync(filePath, 'utf8');
} catch {
  process.exit(0);
}

const lines = content.split('\n').length;

if (lines >= THRESHOLD_REQUIRED) {
  process.stderr.write(
    `\n🚨 god-file 임계 초과 — ${lines}줄 (${THRESHOLD_REQUIRED}+)\n` +
    `   ${filePath}\n` +
    `   CLAUDE.md "🧱 코드 유지 체계" 분해 *필수* 선. 이번 작업에 분해 묶거나 별도 PR 우선 진행 검토.\n` +
    `   [[project-god-file-phase2]] · [[feedback-check-line-count-before-adding]]\n\n`
  );
} else if (lines >= THRESHOLD_REVIEW) {
  process.stderr.write(
    `\n⚠️  god-file 검토 임계 — ${lines}줄 (${THRESHOLD_REVIEW}+)\n` +
    `   ${filePath}\n` +
    `   추가 분량 누적 시 ${THRESHOLD_REQUIRED} 도달 가능. 다음 추가가 들어오면 같이 추출할 후보 파악 모드.\n\n`
  );
}

process.exit(0);
