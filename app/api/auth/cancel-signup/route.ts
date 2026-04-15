import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// 온보딩 미완료 상태에서 가입을 취소한다.
// auth.users 행을 서비스 롤 권한으로 삭제하면 profiles FK CASCADE로 함께 정리된다.
// 약관 동의 완료 후에는 호출할 수 없다(의도치 않은 계정 삭제 방지).
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: true })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarding_completed) {
    return NextResponse.json(
      { error: 'onboarding_already_completed' },
      { status: 400 }
    )
  }

  const admin = createServiceClient()
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('cancel-signup delete error:', deleteError)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }

  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
