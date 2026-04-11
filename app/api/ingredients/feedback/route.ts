import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/ingredients/feedback - 이미지 인식 피드백 저장
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const {
      imageHash,
      detectedLabels,      // AI 원본 결과
      confirmedLabels,     // 사용자 최종 선택
      processingTime,
      consentGiven         // 학습 데이터 사용 동의
    } = body;

    // 필수 필드 검증
    if (!imageHash || !Array.isArray(detectedLabels) || !Array.isArray(confirmedLabels)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // 피드백 타입 자동 결정
    let feedbackType = 'manual';

    if (detectedLabels.length > 0 && confirmedLabels.length > 0) {
      // AI가 감지한 재료 중 사용자가 확정한 재료가 몇 개인지 계산
      const matchCount = confirmedLabels.filter((confirmed: { selectedName: string }) =>
        detectedLabels.some((detected: { koreanName: string }) =>
          detected.koreanName === confirmed.selectedName
        )
      ).length;

      if (matchCount === 0) {
        // 완전히 틀림
        feedbackType = 'incorrect';
      } else if (matchCount === confirmedLabels.length && confirmedLabels.length === detectedLabels.length) {
        // 완전히 정확
        feedbackType = 'correct';
      } else {
        // 일부만 맞음
        feedbackType = 'partial';
      }
    } else if (detectedLabels.length === 0 && confirmedLabels.length > 0) {
      // AI가 아무것도 감지 못했지만 사용자가 수동 추가
      feedbackType = 'manual';
    }

    // 피드백 저장
    const { data, error } = await supabase
      .from('ingredient_recognition_feedback')
      .insert({
        user_id: user.id,
        image_hash: imageHash,
        detected_labels: detectedLabels,
        user_confirmed_labels: confirmedLabels,
        feedback_type: feedbackType,
        model_version: 'mobilenet-v2',
        processing_time_ms: processingTime || null,
        consent_given: consentGiven !== undefined ? consentGiven : true,
        can_use_for_training: consentGiven && feedbackType === 'correct'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving feedback:', error);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedbackId: data.id,
      feedbackType
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/ingredients/feedback - 사용자의 피드백 조회 (선택적)
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error } = await supabase
      .from('ingredient_recognition_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedbacks: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
