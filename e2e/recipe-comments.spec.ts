import { test, expect } from './auth-fixtures'
import { createTestRecipe, deleteTestRecipe } from './helpers/auth'

/**
 * 레시피 댓글 흐름 E2E.
 *
 * 평점/리뷰("만들어봤어요")는 cook-mode-and-review·cook-completion 이 커버하나
 * 댓글은 전용 e2e 가 없었다(2026-06-01 감사 후속). 댓글 작성 → 목록 노출 →
 * 답글 → replies_count 반영 + 빈 댓글/미인증 가드까지 DB 라운드트립으로 검증.
 */
test.describe('레시피 댓글', () => {
  test('댓글 작성 → 목록 노출 → 답글 → replies_count 반영', async ({
    authenticatedPage: page,
    testUser,
  }) => {
    const recipeId = await createTestRecipe(testUser.userId, {
      title: `Comment Flow ${Date.now()}`,
      withSteps: true,
    })

    try {
      // 1. 댓글 작성
      const text = `테스트 댓글 ${Date.now()}`
      const postRes = await page.request.post(`/api/recipes/${recipeId}/comments`, {
        data: { content: text },
      })
      expect(postRes.ok()).toBeTruthy()
      const posted = await postRes.json()
      const commentId = posted.comment.id
      expect(posted.comment.content).toBe(text)

      // 2. 목록 GET → 방금 단 댓글 노출 + total 반영
      const listRes = await page.request.get(`/api/recipes/${recipeId}/comments`)
      expect(listRes.ok()).toBeTruthy()
      const list = await listRes.json()
      expect(list.comments.some((c: { id: string }) => c.id === commentId)).toBeTruthy()
      expect(list.pagination.total).toBeGreaterThanOrEqual(1)

      // 3. 답글 작성
      const replyText = `답글 ${Date.now()}`
      const replyRes = await page.request.post(`/api/recipes/${recipeId}/comments`, {
        data: { content: replyText, parent_comment_id: commentId },
      })
      expect(replyRes.ok()).toBeTruthy()

      // 4. 답글 목록에 노출
      const repliesRes = await page.request.get(
        `/api/recipes/${recipeId}/comments/${commentId}/replies`,
      )
      expect(repliesRes.ok()).toBeTruthy()
      const replies = await repliesRes.json()
      expect(replies.replies.some((r: { content: string }) => r.content === replyText)).toBeTruthy()

      // 5. 부모 댓글의 replies_count 가 1 이상으로 집계
      const list2 = await (await page.request.get(`/api/recipes/${recipeId}/comments`)).json()
      const parent = list2.comments.find((c: { id: string }) => c.id === commentId)
      expect(parent?.replies_count).toBeGreaterThanOrEqual(1)
    } finally {
      await deleteTestRecipe(recipeId)
    }
  })

  test('빈 댓글 → 400', async ({ authenticatedPage: page, testUser }) => {
    const recipeId = await createTestRecipe(testUser.userId, {
      title: `Comment Empty ${Date.now()}`,
      withSteps: true,
    })
    try {
      const res = await page.request.post(`/api/recipes/${recipeId}/comments`, {
        data: { content: '   ' },
      })
      expect(res.status()).toBe(400)
    } finally {
      await deleteTestRecipe(recipeId)
    }
  })

  test('미인증 댓글 작성 → 401', async ({ page, testUser }) => {
    const recipeId = await createTestRecipe(testUser.userId, {
      title: `Comment Auth ${Date.now()}`,
      withSteps: true,
    })
    try {
      const res = await page.request.post(`/api/recipes/${recipeId}/comments`, {
        data: { content: 'hi' },
      })
      expect(res.status()).toBe(401)
    } finally {
      await deleteTestRecipe(recipeId)
    }
  })
})
