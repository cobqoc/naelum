import { guardAdminApi } from '@/lib/api/adminGuard'
import { NextRequest, NextResponse } from 'next/server'

/** 문의 목록 상한 — PostgREST 기본 max-rows 와 같은 값(명시해 silent 절단을 드러냄). 2026-10-04 ADM-11 */
const INQUIRY_LIST_LIMIT = 1000

// GET /api/admin/inquiries — 문의 목록 (admin)
// 데이터 계층 이전(docs/DATA_LAYER.md): admin/inquiries 의 직접 supabase read 를 서버로.
// layout 게이트 밖이라 verifyAdmin 으로 자체 admin 인증.
export async function GET(request: NextRequest) {
  // 2026-10-04 AG2-30: IP→rate limit→verifyAdmin 보일러플레이트 → lib/api/adminGuard(같은 키·문구·상태코드)
  const guard = await guardAdminApi(request)
  if (guard.response) return guard.response
  const auth = guard.auth

  // admin RLS 정책(20260601_contact_inquiries_admin_rls)으로 전체 문의 조회.
  // 2026-10-04 ADM-11: 목록은 limit 없이도 PostgREST max-rows(1000)에서 조용히 잘렸다 → 상한을 명시
  // (같은 1000 이라 결과 동일). 미처리·카테고리 개수는 잘린 목록의 length 가 아니라 count(head) 로 따로
  // 집계해 counts 로 함께 반환 — 기존 키(inquiries)는 그대로라 현재 페이지 동작 불변.
  const countInquiries = () =>
    auth.supabase.from('contact_inquiries').select('id', { count: 'exact', head: true })
  const [
    { data, error },
    totalRes,
    pendingRes,
    bugRes,
    featureRes,
    otherRes,
  ] = await Promise.all([
    auth.supabase
      .from('contact_inquiries')
      .select('id, user_id, email, category, content, status, created_at')
      .order('created_at', { ascending: false })
      .limit(INQUIRY_LIST_LIMIT),
    countInquiries(),
    countInquiries().eq('status', 'pending'),
    countInquiries().eq('category', 'bug'),
    countInquiries().eq('category', 'feature'),
    countInquiries().eq('category', 'other'),
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  // counts 는 보조 정보 — 실패해도 목록 응답은 기존처럼 200(로그로 표면화하고 counts: null).
  const countError = [totalRes, pendingRes, bugRes, featureRes, otherRes].find(r => r.error)?.error
  if (countError) console.error('[admin/inquiries] count failed:', countError)

  return NextResponse.json({
    inquiries: data ?? [],
    counts: countError
      ? null
      : {
          total: totalRes.count ?? 0,
          pending: pendingRes.count ?? 0,
          bug: bugRes.count ?? 0,
          feature: featureRes.count ?? 0,
          other: otherRes.count ?? 0,
        },
  })
}
