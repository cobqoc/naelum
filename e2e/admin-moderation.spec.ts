import { test, expect } from './auth-fixtures'
import {
  deleteTestUser,
  ensureTestUser,
  setUserRole,
  TEST_USER_EMAIL_DOMAIN,
  TEST_USER_PASSWORD,
} from './helpers/auth'

/**
 * 관리자 차단·활동 로그·대시보드 통계 — banned_users·admin_actions·admin_dashboard_stats
 * (20261019_admin_moderation_tables.sql) 가 없어 차단 저장이 항상 실패하던 경로의 회귀 안전망.
 *
 * 관리자 = worker 공유 testUser(승격 후 finally 원복), 차단 대상 = 이 테스트 전용 유저(끝나면 삭제).
 */
test.describe('어드민 — 사용자 차단·활동 로그', () => {
  test('차단 → 목록·로그·통계 반영 → 차단 사용자 보호 경로 거부 → 해제', async ({
    authenticatedPage: page,
    testUser,
    browser,
  }, testInfo) => {
    const victim = await ensureTestUser(
      `playwright-ban-w${testInfo.workerIndex}${TEST_USER_EMAIL_DOMAIN}`,
      TEST_USER_PASSWORD,
    )
    await setUserRole(testUser.userId, 'admin')
    try {
      // 이전 실행이 중간에 끊겨 남은 차단이 있으면 먼저 푼다
      await page.request.patch(`/api/admin/users/${victim.userId}`, { data: { action: 'unban' } })

      const banRes = await page.request.patch(`/api/admin/users/${victim.userId}`, {
        data: { action: 'ban', reason: 'e2e 차단 확인', ban_type: 'permanent' },
      })
      expect(banRes.status()).toBe(200)

      // 같은 사용자 재차단 → 409 (banned_users.user_id UNIQUE)
      const dupRes = await page.request.patch(`/api/admin/users/${victim.userId}`, {
        data: { action: 'ban', reason: 'e2e 중복', ban_type: 'permanent' },
      })
      expect(dupRes.status()).toBe(409)

      const listRes = await page.request.get(`/api/admin/users?search=${victim.username}`)
      expect(listRes.status()).toBe(200)
      const listed = (await listRes.json()).users.find((u: { id: string }) => u.id === victim.userId)
      expect(listed).toMatchObject({ is_banned: true, ban_reason: 'e2e 차단 확인', ban_type: 'permanent' })

      const actionsRes = await page.request.get('/api/admin/actions?action_type=ban_user')
      expect(actionsRes.status()).toBe(200)
      const actions: { target_id: string; admin_id: string }[] = (await actionsRes.json()).actions
      expect(actions.some(a => a.target_id === victim.userId && a.admin_id === testUser.userId)).toBe(true)

      const dashRes = await page.request.get('/api/admin/dashboard')
      expect(dashRes.status()).toBe(200)
      const dash = await dashRes.json()
      expect(dash.stats).not.toBeNull()
      expect(Number(dash.stats.banned_users_count)).toBeGreaterThanOrEqual(1)
      expect(dash.recentActions.length).toBeGreaterThan(0)

      // 차단된 사용자로 로그인한 별도 브라우저 — 보호 경로 접근 시 홈으로 돌려보낸다(proxy.ts)
      const victimContext = await browser.newContext()
      try {
        const signin = await victimContext.request.post('/api/test/signin', {
          data: { email: victim.email, password: victim.password },
        })
        expect(signin.ok()).toBe(true)
        // 변경 API 도 차단 → 403 banned, 그리고 차단 응답이 세션 쿠키를 지운다
        const write = await victimContext.request.post('/api/user-ingredients', {
          data: { ingredient_name: '차단테스트', category: 'veggie' },
        })
        expect(write.status()).toBe(403)
        expect((await write.json()).error).toBe('banned')
        const me = await victimContext.request.get('/api/users/me')
        expect(me.status()).toBe(401)

        // 다시 로그인해도 보호 페이지는 홈으로 돌려보낸다
        const signin2 = await victimContext.request.post('/api/test/signin', {
          data: { email: victim.email, password: victim.password },
        })
        expect(signin2.ok()).toBe(true)
        const victimPage = await victimContext.newPage()
        await victimPage.goto('/recipes/new', { waitUntil: 'domcontentloaded' })
        await expect(victimPage).not.toHaveURL(/\/recipes\/new/)
        expect(new URL(victimPage.url()).pathname).toMatch(/^\/[a-z]{2}\/?$/)
      } finally {
        await victimContext.close()
      }

      const unbanRes = await page.request.patch(`/api/admin/users/${victim.userId}`, {
        data: { action: 'unban' },
      })
      expect(unbanRes.status()).toBe(200)
      const afterRes = await page.request.get(`/api/admin/users?search=${victim.username}`)
      const after = (await afterRes.json()).users.find((u: { id: string }) => u.id === victim.userId)
      expect(after.is_banned).toBe(false)
    } finally {
      await setUserRole(testUser.userId, 'user')
      await deleteTestUser(victim.userId).catch(() => {})
    }
  })

  test('일반 사용자는 차단 API·통계에 접근할 수 없다', async ({ authenticatedPage: page, testUser }) => {
    const banRes = await page.request.patch(`/api/admin/users/${testUser.userId}`, {
      data: { action: 'ban', reason: 'x' },
    })
    expect(banRes.status()).toBe(403)
    const dashRes = await page.request.get('/api/admin/dashboard')
    expect(dashRes.status()).toBe(403)
  })
})
