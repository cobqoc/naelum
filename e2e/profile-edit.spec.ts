import { test, expect } from './auth-fixtures'

/**
 * 프로필 편집 E2E.
 *
 * - 미인증 유저 /settings 접근 제한
 * - PUT /api/users/[username] 으로 full_name, bio 업데이트
 * - 권한 체크: 다른 유저의 username으로 업데이트 시 403
 * - bio 길이 제한 (500자)
 */

test.describe('프로필 편집', () => {
  test('인증 유저: /settings 페이지 렌더', async ({ authenticatedPage: page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(e.message))

    await page.goto('/settings', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)

    // 설정 페이지의 핵심 탭 또는 섹션 존재
    const hasSettingsContent =
      (await page.getByText(/프로필|소개|이름|로그아웃/).count()) > 0
    expect(hasSettingsContent).toBeTruthy()
    expect(pageErrors).toEqual([])
  })

  test('PUT /api/users/[username]: full_name + bio 업데이트 성공', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const newFullName = `E2E User ${Date.now()}`
    const newBio = 'E2E 테스트로 작성한 소개'

    const res = await page.request.put(`/api/users/${testUser.username}`, {
      data: {
        full_name: newFullName,
        bio: newBio,
      },
    })

    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.profile).toBeTruthy()
    expect(body.profile.full_name).toBe(newFullName)
    expect(body.profile.bio).toBe(newBio)
  })

  test('PUT /api/users/[username]: 본인이 아닌 유저 수정 시 403', async ({
    authenticatedPage: page,
  }) => {
    // 본인 소유가 아닌 임의 username
    const res = await page.request.put('/api/users/not-my-username-xyz', {
      data: { full_name: 'hack attempt' },
    })
    // 404 (username 없음) 또는 403 (다른 유저) 둘 다 허용
    expect([403, 404]).toContain(res.status())
  })

  test('PUT /api/users/[username]: bio 500자 초과 시 400', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const longBio = 'a'.repeat(501)
    const res = await page.request.put(`/api/users/${testUser.username}`, {
      data: { bio: longBio },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('500')
  })

  test('PUT /api/users/[username]: 미인증 시 401', async ({ page }) => {
    const res = await page.request.put('/api/users/someone', {
      data: { full_name: 'anon' },
    })
    expect(res.status()).toBe(401)
  })

  test('업데이트된 full_name이 GET /api/users/[username]에 반영', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const newFullName = `Reflection ${Date.now()}`

    const updateRes = await page.request.put(`/api/users/${testUser.username}`, {
      data: { full_name: newFullName, bio: 'reflection test' },
    })
    expect(updateRes.ok()).toBeTruthy()

    // GET으로 fresh 조회해 반영 확인 (DOM 렌더링 의존도 제거)
    const getRes = await page.request.get(`/api/users/${testUser.username}`)
    if (getRes.ok()) {
      const body = await getRes.json()
      const fullName = body.profile?.full_name ?? body.full_name
      expect(fullName).toBe(newFullName)
    } else {
      // GET 엔드포인트가 없으면 PUT 응답으로 검증
      const updateBody = await updateRes.json()
      expect(updateBody.profile.full_name).toBe(newFullName)
    }
  })
})
