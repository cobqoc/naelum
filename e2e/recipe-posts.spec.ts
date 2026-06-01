import { test, expect } from './auth-fixtures'
import { createTestRecipe, deleteTestRecipe, ensureTestUser, deleteTestUser } from './helpers/auth'

/**
 * 통합 피드(recipe_posts) API E2E — Phase 2 검증.
 *
 * 리뷰(별점)·댓글·답글이 한 테이블/한 API에서 동작하는지 + 규칙(별점 필수 인증·
 * 본인 레시피 별점 차단·답글 1단·본인글 좋아요 차단)을 DB 라운드트립으로 검증한다.
 * 리뷰는 cross-author 여야 하므로(본인 레시피 별점 차단) 별도 author 유저를 만든다.
 */
test.describe('통합 피드 (recipe_posts)', () => {
  test('리뷰·댓글·답글 라운드트립 + 필터 + 수정 + 카운트', async ({
    authenticatedPage: page,
  }) => {
    const author = await ensureTestUser(`unified-author-${Date.now()}@playwright.test`)
    const recipeId = await createTestRecipe(author.userId, {
      title: `Posts Flow ${Date.now()}`,
      withSteps: true,
    })

    try {
      // 1. 리뷰(별점) — cross-author 라 허용
      const reviewRes = await page.request.post(`/api/recipes/${recipeId}/posts`, {
        data: { rating: 5, content: '진짜 맛있어요!' },
      })
      expect(reviewRes.ok()).toBeTruthy()
      const review = (await reviewRes.json()).post
      expect(review.rating).toBe(5)

      // 2. 댓글(별점 없음)
      const commentRes = await page.request.post(`/api/recipes/${recipeId}/posts`, {
        data: { content: '닭가슴살로 대체돼요?' },
      })
      expect(commentRes.ok()).toBeTruthy()
      const comment = (await commentRes.json()).post
      expect(comment.rating).toBeNull()

      // 3. 답글
      const replyRes = await page.request.post(`/api/recipes/${recipeId}/posts`, {
        data: { content: '네 가능해요', parent_id: comment.id },
      })
      expect(replyRes.ok()).toBeTruthy()

      // 4. 전체 피드 — 리뷰 + 댓글 둘 다 노출, averageRating 반영
      const feed = await (await page.request.get(`/api/recipes/${recipeId}/posts`)).json()
      expect(feed.posts.some((p: { id: string }) => p.id === review.id)).toBeTruthy()
      expect(feed.posts.some((p: { id: string }) => p.id === comment.id)).toBeTruthy()
      expect(feed.averageRating).toBe(5)
      expect(feed.ratingsCount).toBe(1)
      const parentInFeed = feed.posts.find((p: { id: string }) => p.id === comment.id)
      expect(parentInFeed.replies_count).toBeGreaterThanOrEqual(1)

      // 5. 후기만 필터 — 리뷰만
      const reviewsOnly = await (await page.request.get(`/api/recipes/${recipeId}/posts?filter=reviews`)).json()
      expect(reviewsOnly.posts.every((p: { rating: number | null }) => p.rating !== null)).toBeTruthy()
      expect(reviewsOnly.posts.some((p: { id: string }) => p.id === review.id)).toBeTruthy()
      expect(reviewsOnly.posts.some((p: { id: string }) => p.id === comment.id)).toBeFalsy()

      // 6. 답글 목록
      const replies = await (await page.request.get(`/api/recipes/${recipeId}/posts/${comment.id}/replies`)).json()
      expect(replies.replies.some((r: { content: string }) => r.content === '네 가능해요')).toBeTruthy()

      // 7. 리뷰 별점 수정 (5 → 3)
      const editRes = await page.request.put(`/api/recipes/${recipeId}/posts/${review.id}`, {
        data: { rating: 3 },
      })
      expect(editRes.ok()).toBeTruthy()
      const feed2 = await (await page.request.get(`/api/recipes/${recipeId}/posts`)).json()
      expect(feed2.averageRating).toBe(3)
    } finally {
      await deleteTestRecipe(recipeId)
      await deleteTestUser(author.userId)
    }
  })

  test('규칙 가드: 본인 레시피 별점 403 · 답글에 별점 400 · 답글의 답글 400 · 본인글 좋아요 400', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    // 본인(testUser) 레시피
    const ownRecipe = await createTestRecipe(testUser.userId, { title: `Own ${Date.now()}`, withSteps: true })
    const author = await ensureTestUser(`unified-author2-${Date.now()}@playwright.test`)
    const otherRecipe = await createTestRecipe(author.userId, { title: `Other ${Date.now()}`, withSteps: true })

    try {
      // 본인 레시피에 별점 → 403
      const selfReview = await page.request.post(`/api/recipes/${ownRecipe}/posts`, { data: { rating: 5 } })
      expect(selfReview.status()).toBe(403)

      // 댓글 + 답글 준비 (남의 레시피)
      const comment = (await (await page.request.post(`/api/recipes/${otherRecipe}/posts`, { data: { content: '질문' } })).json()).post
      const reply = (await (await page.request.post(`/api/recipes/${otherRecipe}/posts`, { data: { content: '답', parent_id: comment.id } })).json()).post

      // 답글에 별점 → 400
      const ratedReply = await page.request.post(`/api/recipes/${otherRecipe}/posts`, { data: { rating: 4, parent_id: comment.id } })
      expect(ratedReply.status()).toBe(400)

      // 답글의 답글 → 400 (1단 강제)
      const nested = await page.request.post(`/api/recipes/${otherRecipe}/posts`, { data: { content: 'x', parent_id: reply.id } })
      expect(nested.status()).toBe(400)

      // 본인 글에 좋아요 → 400
      const selfLike = await page.request.post(`/api/recipes/${otherRecipe}/posts/${comment.id}/like`)
      expect(selfLike.status()).toBe(400)
    } finally {
      await deleteTestRecipe(ownRecipe)
      await deleteTestRecipe(otherRecipe)
      await deleteTestUser(author.userId)
    }
  })

  test('빈 댓글 → 400', async ({ authenticatedPage: page }) => {
    const author = await ensureTestUser(`unified-author3-${Date.now()}@playwright.test`)
    const recipeId = await createTestRecipe(author.userId, { title: `Guard ${Date.now()}`, withSteps: true })
    try {
      const empty = await page.request.post(`/api/recipes/${recipeId}/posts`, { data: { content: '   ' } })
      expect(empty.status()).toBe(400)
    } finally {
      await deleteTestRecipe(recipeId)
      await deleteTestUser(author.userId)
    }
  })

  // 미인증: authenticatedPage 를 요청하지 않아야 컨텍스트가 깨끗(쿠키 미주입) → 진짜 비로그인
  test('미인증 작성 → 401', async ({ page }) => {
    const author = await ensureTestUser(`unified-author4-${Date.now()}@playwright.test`)
    const recipeId = await createTestRecipe(author.userId, { title: `Guard2 ${Date.now()}`, withSteps: true })
    try {
      const unauth = await page.request.post(`/api/recipes/${recipeId}/posts`, { data: { content: 'hi' } })
      expect(unauth.status()).toBe(401)
    } finally {
      await deleteTestRecipe(recipeId)
      await deleteTestUser(author.userId)
    }
  })
})
