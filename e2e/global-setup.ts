import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

/**
 * 스테일 prod 서버 정리 — e2e 신뢰성 (2026-06-01 근본 처방).
 *
 * **증상**: 이전 `npm run start` 서버가 :3000 에 남아 *옛 빌드* HTML 을 서빙하면,
 * 브라우저가 디스크에 없는 청크(`turbopack-<옛해시>.js` 등)를 요청 → 404 →
 * hydration 실패 → 클라이언트 렌더 페이지(로그인 폼·cart 등)가 `app/loading.tsx`
 * "Loading…" 에서 멈춰 모든 인증/폼 e2e 가 1분 타임아웃으로 떨어진다.
 *
 * **원인**: CLAUDE.md 가 안내하던 `pkill -f "next start"` 는 실제 프로세스명이
 * `next-server` 라 포트를 못 비우고, playwright `reuseExistingServer:true` 가 그
 * 스테일 서버를 그대로 재사용한다.
 *
 * **처방(신호 선택)**: turbopack *런타임 청크*(`turbopack-<hash>.js`)를 비교한다.
 *  - 런타임 청크는 모듈 그래프 content-hash라 *의미 있는* 빌드 변경마다 새 해시.
 *  - 항상 emit 됨 → fresh 빌드에서 false-positive 없음.
 *    (전체 청크를 비교하면 turbopack 의 preload-hint 미emit 청크 때문에 fresh
 *     빌드도 "missing" 1개가 잡혀 매번 kill 되는 오탐 발생 — 확인 후 폐기.)
 *  - 주석만 바꾼 no-op 재빌드는 출력 동일 → 런타임 동일 → "스테일 아님"(무해, 정답).
 * 서버 HTML 이 *디스크의 현재 런타임 청크명* 을 포함하지 않으면 = 옛 빌드 →
 * 포트 강제 정리 → webServer 가 fresh 재기동. 포함하면 최신이라 그대로 reuse
 * (빠른 반복 보존). 전부 best-effort — 실패해도 테스트는 진행된다.
 */
export default async function globalSetup() {
  if (process.env.PLAYWRIGHT_BASE_URL) return; // 외부 서버 사용 시 관여 안 함
  try {
    const chunksDir = '.next/static/chunks';
    if (!existsSync(chunksDir)) return; // 빌드 없음 → webServer 가 빌드함
    const runtimeChunk = readdirSync(chunksDir).find((f) => f.startsWith('turbopack-') && f.endsWith('.js'));
    if (!runtimeChunk) return;

    let html = '';
    try {
      html = execSync('curl -s --max-time 4 http://localhost:3000/ko', { encoding: 'utf8' });
    } catch {
      return; // :3000 응답 없음 → 띄워진 서버 없음 → webServer 가 정상 기동
    }
    if (!html) return;

    if (!html.includes(runtimeChunk)) {
      // 옛 빌드 서빙 중 — 포트 강제 정리(next-server 포함). 그러면 webServer 가 fresh 기동.
      try {
        execSync('lsof -ti tcp:3000 | xargs kill -9', { stdio: 'ignore' });
        execSync('sleep 1');
        console.log('[e2e global-setup] 스테일 :3000 서버 종료(런타임 청크 불일치=옛 빌드) → fresh 재기동');
      } catch { /* ignore */ }
    }
  } catch { /* best-effort */ }
}
