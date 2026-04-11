/**
 * 배치 레시피 임포트 스크립트
 *
 * scripts/batch-queue/ 폴더의 JSON 파일을 순서대로 자동 처리합니다.
 * 각 JSON은 import-youtube-recipe.ts와 동일한 형식이어야 합니다.
 * 파일명이 -tip.json으로 끝나면 import-youtube-tip.ts로 처리합니다.
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ⚠️  절대 원칙: 유료 이미지 모델 사용 금지  ⚠️              ║
 * ║  이미지 생성은 Pollinations.ai (Flux, 무료)만 사용합니다.   ║
 * ║  Imagen, DALL-E 등 유료 모델은 절대 사용 금지입니다.        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * 사용법: npx tsx scripts/batch-import.ts
 *
 * 폴더 구조:
 *   scripts/batch-queue/          ← 처리할 JSON 파일 여기에
 *     001-달걀만두.json
 *     002-김치찌개.json
 *     003-양파손질법-tip.json      ← 팁 파일 (-tip.json 접미사)
 *     done/                       ← 성공한 파일 자동 이동
 *     failed/                     ← 실패한 파일 자동 이동
 */

import { readdirSync, readFileSync, renameSync, mkdirSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { resolve } from 'path';

/** Windows 환경에서 종종 ENOENT를 던지는 renameSync를 재시도로 감쌉니다. */
async function safeRename(src: string, dst: string): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      renameSync(src, dst);
      return;
    } catch (err) {
      // 파일이 이미 목적지에 있으면 성공으로 간주 (Windows race)
      if (existsSync(dst) && !existsSync(src)) return;
      if (attempt === 4) throw err;
      await new Promise((res) => setTimeout(res, 500 * (attempt + 1)));
    }
  }
}

/** 레시피 간 딜레이 — Pollinations.ai rate limit 방지 */
const DELAY_BETWEEN_RECIPES_MS = 10000; // 레시피 처리 완료 후 다음 시작 전 10초 대기

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

async function main() {
  const QUEUE_DIR = resolve('scripts/batch-queue');
  const DONE_DIR = resolve('scripts/batch-queue/done');
  const FAILED_DIR = resolve('scripts/batch-queue/failed');

  mkdirSync(DONE_DIR, { recursive: true });
  mkdirSync(FAILED_DIR, { recursive: true });

  // JSON 파일 목록 (파일명 오름차순)
  const files = readdirSync(QUEUE_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.log('처리할 JSON 파일이 없습니다.');
    console.log('scripts/batch-queue/ 폴더에 JSON 파일을 추가한 뒤 다시 실행하세요.');
    process.exit(0);
  }

  console.log(`\n배치 처리 시작: 총 ${files.length}개`);
  console.log('='.repeat(55));

  const results: { file: string; status: 'done' | 'failed' }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = resolve(QUEUE_DIR, file);
    const isTip = file.endsWith('-tip.json');
    const script = isTip ? 'scripts/import-youtube-tip.ts' : 'scripts/import-youtube-recipe.ts';

    console.log(`\n[${i + 1}/${files.length}] ${file}`);
    console.log('-'.repeat(55));

    // 파일이 없으면 (이전 실행에서 이미 처리됨) 건너뜀
    if (!existsSync(filePath)) {
      console.log(`SKIP: 파일 없음 (이미 처리됨)`);
      results.push({ file, status: 'done' });
      continue;
    }

    let input: string;
    try {
      input = readFileSync(filePath, 'utf-8');
    } catch (err) {
      console.log(`WARNING: 파일 읽기 실패 (건너뜀): ${(err as Error).message}`);
      results.push({ file, status: 'failed' });
      continue;
    }

    const result = spawnSync('npx', ['tsx', script], {
      input,
      stdio: ['pipe', 'inherit', 'inherit'],
      encoding: 'utf-8',
      shell: true,
      env: { ...process.env },
    });

    if (result.status === 0) {
      try {
        await safeRename(filePath, resolve(DONE_DIR, file));
      } catch (err) {
        console.log(`WARNING: done 폴더 이동 실패 (무시): ${(err as Error).message}`);
      }
      results.push({ file, status: 'done' });
      console.log(`→ 완료 (done/${file})`);
    } else {
      try {
        await safeRename(filePath, resolve(FAILED_DIR, file));
      } catch (err) {
        console.log(`WARNING: failed 폴더 이동 실패 (무시): ${(err as Error).message}`);
      }
      results.push({ file, status: 'failed' });
      console.log(`→ 실패 (failed/${file})`);
    }

    // 마지막 파일이 아니면 다음 레시피 처리 전 대기 (rate limit 방지)
    if (i < files.length - 1) {
      console.log(`잠시 대기 중... (${DELAY_BETWEEN_RECIPES_MS / 1000}초)`);
      await sleep(DELAY_BETWEEN_RECIPES_MS);
    }
  }

  // 최종 요약
  const done = results.filter(r => r.status === 'done');
  const failed = results.filter(r => r.status === 'failed');

  console.log('\n' + '='.repeat(55));
  console.log('배치 처리 완료');
  console.log(`  성공: ${done.length}개`);
  console.log(`  실패: ${failed.length}개`);

  if (failed.length > 0) {
    console.log('\n실패 목록:');
    failed.forEach(r => console.log(`  - ${r.file}`));
    console.log('\n실패 파일은 scripts/batch-queue/failed/ 에 저장됐습니다.');
    console.log('원인 확인 후 failed/ → batch-queue/ 로 옮겨 다시 실행하세요.');
  }
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
