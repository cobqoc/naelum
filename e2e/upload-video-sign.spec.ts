import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { test, expect } from './auth-fixtures'

// 영상 직접 업로드(서명 URL) 경로 — 2026-10-20 AG2-10.
// 발급(POST /api/upload-video/sign) → 서명 URL 로 본문 PUT → 공개 URL 로 읽힘. 형식·크기 거부도 확인.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function admin() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// 최소 MP4 머리(ftyp 박스) — 버킷은 Content-Type 만 보지만 실제 형식과 맞춰 둔다
const MP4_BYTES = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
  0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
])

test.describe('영상 직접 업로드 — 서명 URL', () => {
  test('발급 → PUT 업로드 → 공개 URL 로 읽힘', async ({ authenticatedPage: page }) => {
    const res = await page.request.post('/api/upload-video/sign', {
      data: { contentType: 'video/mp4', size: MP4_BYTES.length },
    })
    expect(res.status()).toBe(200)
    const { signedUrl, token, path, url } = await res.json()
    expect(typeof signedUrl).toBe('string')
    expect(typeof token).toBe('string')
    expect(path).toMatch(/^[0-9a-f-]{36}\/\d+\.mp4$/)

    try {
      const put = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'video/mp4' },
        body: MP4_BYTES,
      })
      expect(put.status).toBe(200)

      const get = await fetch(url)
      expect(get.status).toBe(200)
      expect(Buffer.from(await get.arrayBuffer()).equals(MP4_BYTES)).toBe(true)
    } finally {
      await admin().storage.from('recipe-videos').remove([path])
    }
  })

  test('형식·크기 초과는 400', async ({ authenticatedPage: page }) => {
    const badType = await page.request.post('/api/upload-video/sign', {
      data: { contentType: 'image/png', size: 100 },
    })
    expect(badType.status()).toBe(400)

    const tooBig = await page.request.post('/api/upload-video/sign', {
      data: { contentType: 'video/mp4', size: 50 * 1024 * 1024 + 1 },
    })
    expect(tooBig.status()).toBe(400)
  })
})
