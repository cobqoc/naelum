import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/ratelimit'
import { uploadToBucket, getPublicUrl } from '@/lib/storage'
import { validateImageFile } from '@/lib/storage/validateImage'

// POST /api/recipes/[id]/complete - 요리 완성 기록
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { allowed } = await checkRateLimit(`complete-photo:${user.id}`, { windowMs: 60 * 1000, maxRequests: 10 })
  if (!allowed) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  try {
    // FormData에서 사진 추출
    const formData = await request.formData()
    const photo = formData.get('photo') as File | null
    let photoUrl: string | null = null

    // 사진이 있으면 검증 후 Supabase Storage에 업로드 (H2: 무검증·storage 우회·매요청 createBucket 제거)
    if (photo) {
      // 타입·크기·매직바이트 검증 — /api/upload 와 동일 규칙(단일 출처)
      const validation = await validateImageFile(photo)
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${user.id}/${recipeId}/${Date.now()}.${ext}`

      // lib/storage 경유(AWS 이전 격리). 버킷은 인프라로 사전 프로비저닝(매요청 생성 금지).
      const { path: uploadedPath, error: uploadError } = await uploadToBucket(
        supabase,
        'recipe-completion-photos',
        fileName,
        validation.bytes!,
        { contentType: photo.type, cacheControl: '3600', upsert: false }
      )

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ error: `사진 업로드 실패: ${uploadError.message}` }, { status: 500 })
      }

      photoUrl = getPublicUrl(supabase, 'recipe-completion-photos', uploadedPath ?? fileName)
    }

    // 완료 사진은 cooking_sessions.photo_url 에만 저장(아래). recipe_ratings 사진글(별점없음)은
    // 통합 피드(recipe_posts) 전환으로 폐기 — "별점 없는 만들어봤어요" 미지원(별점 필수 결정).

    // 이미 완료한 기록이 있는지 확인 (최근 24시간 이내)
    const { data: recentSession } = await supabase
      .from('cooking_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle()

    if (recentSession) {
      // 기존 세션이 있으면 사진만 업데이트
      if (photoUrl) {
        const { error: sessionPhotoError } = await supabase
          .from('cooking_sessions')
          .update({ photo_url: photoUrl })
          .eq('id', recentSession.id)
        if (sessionPhotoError) {
          console.error('Cooking session photo update error:', sessionPhotoError)
          return NextResponse.json({ error: '사진 저장에 실패했습니다' }, { status: 500 })
        }
      }

      return NextResponse.json({
        success: true,
        message: '이미 최근에 완료한 기록이 있습니다',
        sessionId: recentSession.id,
        photoUrl
      })
    }

    // 새로운 cooking session 생성
    const { data: session, error } = await supabase
      .from('cooking_sessions')
      .insert({
        user_id: user.id,
        recipe_id: recipeId,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        photo_url: photoUrl
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating cooking session:', error)
      return NextResponse.json({ error: '저장에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '요리 완성 기록이 저장되었습니다',
      sessionId: session.id,
      photoUrl
    })
  } catch (error) {
    console.error('Complete recipe error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
