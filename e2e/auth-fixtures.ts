/* eslint-disable react-hooks/rules-of-hooks -- Playwright fixture `use` callback is not a React hook */
import { test as baseTest, expect } from './fixtures'
import {
  ensureTestUser,
  deleteTestUser,
  TEST_USER_EMAIL_DOMAIN,
  TEST_USER_EMAIL_PREFIX,
  TEST_USER_PASSWORD,
  type TestUser,
} from './helpers/auth'

type AuthFixtures = {
  /** Worker 단위로 생성/재사용되는 테스트 유저. worker가 종료되면 자동 삭제. */
  testUser: TestUser
  /** 세션 쿠키가 주입된 페이지. /api/test/signin을 호출해 로그인. */
  authenticatedPage: import('@playwright/test').Page
}

export const test = baseTest.extend<AuthFixtures, { _workerTestUser: TestUser }>({
  // Worker 단위 fixture: 같은 worker 내 여러 테스트가 동일 유저를 공유
  _workerTestUser: [
    async ({}, use, workerInfo) => {
      // workerIndex로 parallel run 충돌 방지
      const email = `${TEST_USER_EMAIL_PREFIX}${workerInfo.workerIndex}${TEST_USER_EMAIL_DOMAIN}`
      const user = await ensureTestUser(email, TEST_USER_PASSWORD)
      await use(user)
      // worker 종료 시 cleanup
      try {
        await deleteTestUser(user.userId)
      } catch {
        // ignore — 이미 테스트 중에 삭제됐을 수 있음
      }
    },
    { scope: 'worker' },
  ],

  testUser: async ({ _workerTestUser }, use) => {
    await use(_workerTestUser)
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    const res = await page.request.post('/api/test/signin', {
      data: { email: testUser.email, password: testUser.password },
    })
    if (!res.ok()) {
      const body = await res.text()
      throw new Error(`test signin failed (${res.status()}): ${body}`)
    }
    await use(page)
  },
})

export { expect }
