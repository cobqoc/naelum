import { test, expect } from './auth-fixtures'
import { setUserRole } from './helpers/auth'

/**
 * 어드민 대시보드/문의 관리 — 데이터 계층 이전(docs/DATA_LAYER.md) 회귀 안전망.
 *
 * 변경 전에 baseline green 을 확인하고, admin/page(서버 컴포넌트 전환)·
 * admin/inquiries(API 라우트 이전) 후 동일 통과를 보장한다.
 *
 * ⚠️ testUser 는 worker 공유 → admin 승격 후 finally 에서 'user' 로 원복(다른 테스트 오염 방지).
 */
test.describe('어드민 — 데이터계층 이전 안전망', () => {
  test('대시보드: 통계 카드 라벨 렌더 (admin 게이트 통과)', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const pageErrors: string[] = []
    page.on('pageerror', e => pageErrors.push(e.message))

    await setUserRole(testUser.userId, 'admin')
    try {
      // 새 데이터 경로 직접 검증 — 정적 라벨만으론 fetch 성공을 보장 못함.
      const apiRes = await page.request.get('/api/admin/dashboard')
      expect(apiRes.status()).toBe(200)
      expect(await apiRes.json()).toHaveProperty('recentActions')

      await page.goto('/admin', { waitUntil: 'domcontentloaded' })
      // 통계 카드 라벨은 데이터 유무와 무관하게 렌더 (값만 0).
      await expect(page.getByText('전체 사용자')).toBeVisible({ timeout: 8000 })
      await expect(page.getByText('전체 레시피')).toBeVisible()
      await expect(page.getByText('대기 중 신고')).toBeVisible()
      expect(pageErrors).toEqual([])
    } finally {
      await setUserRole(testUser.userId, 'user')
    }
  })

  test('문의 관리: 헤더 + 필터 탭 렌더', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const pageErrors: string[] = []
    page.on('pageerror', e => pageErrors.push(e.message))

    await setUserRole(testUser.userId, 'admin')
    try {
      // 새 데이터 경로 직접 검증.
      const apiRes = await page.request.get('/api/admin/inquiries')
      expect(apiRes.status()).toBe(200)
      expect(await apiRes.json()).toHaveProperty('inquiries')

      await page.goto('/admin/inquiries', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: /문의 관리/ })).toBeVisible({ timeout: 8000 })
      await expect(page.getByRole('button', { name: /버그 신고/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /새로고침/ })).toBeVisible()
      expect(pageErrors).toEqual([])
    } finally {
      await setUserRole(testUser.userId, 'user')
    }
  })
})
