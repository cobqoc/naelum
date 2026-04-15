import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// .env.local을 Playwright Node 프로세스로 주입해 e2e/helpers에서 Supabase 서비스 롤 키 등을 쓸 수 있게 한다.
// Next.js 서버는 자체적으로 .env.local을 읽지만, Playwright 테스트 러너는 별도 프로세스이므로 수동으로 파싱한다.
(function loadEnvLocal() {
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
})();

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // 로컬에서도 1번 재시도
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // 더 긴 타임아웃 설정 (기본 30초 → 60초)
    actionTimeout: 60000,
    navigationTimeout: 60000,
    // i18n: 한국어 로케일 강제 (앱이 브라우저 언어로 자동 전환됨)
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    extraHTTPHeaders: {
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
    launchOptions: {
      // Windows에서 Chromium sandbox 크래시 방지
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // 외부 URL(PLAYWRIGHT_BASE_URL)이 지정된 경우 로컬 서버 불필요
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    // E2E는 프로덕션 빌드로 실행: dev 오버레이가 클릭을 가로채는 문제 회피
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
