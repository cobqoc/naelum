import { defineConfig } from 'vitest/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

// 단위 테스트 전용 설정.
// - include 를 lib/**/*.test.ts 로 한정: playwright e2e/*.spec.ts 와 충돌하지 않게.
//   (단위=.test.ts / e2e=.spec.ts 로 접미사 분리)
// - environment node: 순수 함수만 테스트하므로 DOM 불필요.
export default defineConfig({
  resolve: {
    alias: { '@': root },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'e2e', 'scripts', 'playwright-report'],
  },
});
