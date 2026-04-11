import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

// POST /api/recipes/[id]/complete - 요리 완성 기록
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params
  const supabase = await createClient()

  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  try {
    // FormData에서 사진 추출
    const formData = await request.formData()
    const photo = formData.get('photo') as File | null
    let photoUrl: string | null = null

    // 사진이 있으면 Supabase Storage에 업로드
    if (photo) {
      const fileExt = photo.name.split('.').pop()
      const fileName = `${user.id}/${recipeId}/${Date.now()}.${fileExt}`

      // 버킷 확인 및 생성
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(b => b.name === 'recipe-completion-photos')

      if (!bucketExists) {
        await supabase.storage.createBucket('recipe-completion-photos', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
        })
      }

      // 파일 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recipe-completion-photos')
        .upload(fileName, photo, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({
          error: `사진 업로드 실패: ${uploadError.message}`,
          details: uploadError
        }, { status: 500 })
      }

      // Public URL 생성
      const { data: urlData } = supabase.storage
        .from('recipe-completion-photos')
        .getPublicUrl(uploadData.path)
      photoUrl = urlData.publicUrl
    }

    // 사진이 있으면 recipe_ratings에 저장
    if (photoUrl) {
      // 1. 기존 리뷰 확인
      const { data: existingRating } = await supabase
        .from('recipe_ratings')
        .select('id, photo_url, review, rating')
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingRating) {
        // 2a. 기존 리뷰에 사진 추가/업데이트
        await supabase
          .from('recipe_ratings')
          .update({
            photo_url: photoUrl,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRating.id)
      } else {
        // 2b. 사진만 있는 새 리뷰 생성 (평점 없음)
        const { error: ratingError } = await supabase
          .from('recipe_ratings')
          .insert({
            recipe_id: recipeId,
            user_id: user.id,
            rating: null, // 평점 없음 (사진만)
            review: null,
            photo_url: photoUrl,
            is_photo_only: true,
            completed_at: new Date().toISOString()
          })

        if (ratingError) {
          console.error('Rating creation error:', ratingError)
        }
        // 주의: 평점이 NULL이므로 update_recipe_ratings 호출 불필요
        // (평균 평점 계산 시 rating=NULL 레코드는 제외됨)
      }
    }

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
        await supabase
          .from('cooking_sessions')
          .update({ photo_url: photoUrl })
          .eq('id', recentSession.id)
      }

      return NextResponse.json({
        success: true,
        message: '이미 최근에 완료한 기록이 있습니다',
        sessionId: recentSession.id
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
      sessionId: session.id
    })
  } catch (error) {
    console.error('Complete recipe error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
