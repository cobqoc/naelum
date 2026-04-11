import { test as base, expect } from '@playwright/test';

/**
 * 공통 테스트 픽스처
 * - 쿠키 동의 배너를 미리 수락 처리해 클릭이 가로채지지 않도록 한다.
 *   (실제 사용자 시나리오에서는 한 번만 표시되는 배너지만, 매 테스트 새 컨텍스트에서는
 *    매번 표시되어 네비게이션을 가로막기 때문에 init script로 사전 주입한다.)
 */
/* eslint-disable react-hooks/rules-of-hooks -- Playwright fixture `use` callback is not a React hook */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem(
          'naelum_cookie_consent',
          JSON.stringify({ consent: 'all', timestamp: new Date().toISOString() })
        );
      } catch {
        /* noop */
      }
    });
    await use(context);
  },
});

export { expect };
