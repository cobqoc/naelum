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

interface CookieEntry {
  name: string
  value: string
  domain: string
  path: string
  expires: number
  httpOnly: boolean
  secure: boolean
  sameSite: 'Strict' | 'Lax' | 'None'
}

/** Set-Cookie 헤더 문자열을 Playwright Cookie 배열로 파싱 */
function parseSetCookieHeaders(headers: Headers, domain: string): CookieEntry[] {
  // Node 18+ getSetCookie(), 하위 호환 fallback
  const rawCookies: string[] = typeof (headers as { getSetCookie?: () => string[] }).getSetCookie === 'function'
    ? (headers as { getSetCookie: () => string[] }).getSetCookie()
    : (headers.get('set-cookie') ?? '').split(/,(?=[^ ])/).filter(Boolean)

  return rawCookies.map(raw => {
    const parts = raw.split(';').map(p => p.trim())
    const [nameVal, ...attrs] = parts
    const eqIdx = (nameVal ?? '').indexOf('=')
    const name = (nameVal ?? '').slice(0, eqIdx)
    const value = (nameVal ?? '').slice(eqIdx + 1)

    let path = '/'
    let expires = -1
    let httpOnly = false
    let secure = false
    let sameSite: 'Strict' | 'Lax' | 'None' = 'Lax'

    for (const attr of attrs) {
      const lower = attr.toLowerCase()
      if (lower === 'httponly') httpOnly = true
      else if (lower === 'secure') secure = true
      else if (lower.startsWith('path=')) path = attr.slice(5)
      else if (lower.startsWith('samesite=')) {
        const sv = attr.slice(9).toLowerCase()
        if (sv === 'strict') sameSite = 'Strict'
        else if (sv === 'none') sameSite = 'None'
        else sameSite = 'Lax'
      } else if (lower.startsWith('expires=')) {
        const d = new Date(attr.slice(8))
        if (!isNaN(d.getTime())) expires = Math.floor(d.getTime() / 1000)
      } else if (lower.startsWith('max-age=')) {
        const age = parseInt(attr.slice(8), 10)
        if (!isNaN(age)) expires = Math.floor(Date.now() / 1000) + age
      }
    }

    return { name, value, domain, path, expires, httpOnly, secure, sameSite }
  }).filter(c => c.name)
}

type AuthFixtures = {
  /** Worker 단위로 생성/재사용되는 테스트 유저. worker가 종료되면 자동 삭제. */
  testUser: TestUser
  /** 세션 쿠키가 주입된 페이지. worker 단위로 signin을 1회만 호출해 rate limit 회피. */
  authenticatedPage: import('@playwright/test').Page
}

type WorkerFixtures = {
  _workerTestUser: TestUser
  /** Worker당 1회만 signin → 쿠키 캐싱으로 Supabase auth rate limit 회피 */
  _workerAuthCookies: CookieEntry[]
}

export const test = baseTest.extend<AuthFixtures, WorkerFixtures>({
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

  // Worker당 signin 1회: 같은 worker의 모든 테스트가 쿠키를 재사용
  _workerAuthCookies: [
    async ({ _workerTestUser: testUser }, use, workerInfo) => {
      const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
      const url = `${BASE_URL}/api/test/signin`

      // worker index 기반으로 요청을 분산 (Supabase rate limit 회피)
      await new Promise(r => setTimeout(r, workerInfo.workerIndex * 400))

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: testUser.password }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`worker signin failed (${res.status}): ${body}`)
      }

      const domain = new URL(BASE_URL).hostname
      const cookies = parseSetCookieHeaders(res.headers, domain)
      await use(cookies)
    },
    { scope: 'worker' },
  ],

  testUser: async ({ _workerTestUser }, use) => {
    await use(_workerTestUser)
  },

  authenticatedPage: async ({ page, _workerAuthCookies }, use) => {
    // worker-scoped 쿠키를 브라우저 컨텍스트에 주입 (signin API 재호출 없음)
    if (_workerAuthCookies.length > 0) {
      await page.context().addCookies(_workerAuthCookies)
    }
    await use(page)
  },
})

export { expect }
