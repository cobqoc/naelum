import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { parsePagination } from '@/lib/api/pagination';

/**
 * 관리자 권한 체크 헬퍼 함수
 */
async function checkAdminRole(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return profile?.role === 'admin';
}

/**
 * GET /api/ingredients/pending
 * 승인 대기 중인 재료 목록 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. 인증 확인
    const { user, error: authError } = await requireAuth(supabase);
    if (authError) return authError;

    // 2. 관리자 권한 체크
    const isAdmin = await checkAdminRole(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    // 3. 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending'; // pending, approved, rejected
    const { page, limit, offset, rangeEnd } = parsePagination(searchParams, { defaultLimit: 50 });

    // 4. 재료 조회
    const { data: ingredientsData, error, count } = await supabase
      .from('ingredients_master')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, rangeEnd);

    if (error) {
      console.error('Error fetching pending ingredients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ingredients' },
        { status: 500 }
      );
    }

    // 5. 작성자 및 승인자 정보 조회
    const creatorIds = ingredientsData?.map(i => i.created_by).filter(Boolean) || [];
    const approverIds = ingredientsData?.map(i => i.approved_by).filter(Boolean) || [];
    const allUserIds = [...new Set([...creatorIds, ...approverIds])];

    let profilesMap: Record<string, { id: string; username: string; email?: string }> = {};

    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, email')
        .in('id', allUserIds);

      if (profiles) {
        profilesMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, { id: string; username: string }>);
      }
    }

    // 6. 응답 포맷팅
    const ingredients = (ingredientsData || []).map((item) => ({
      id: item.id,
      name: item.name_ko || item.name,
      name_en: item.name_en,
      category: item.category,
      common_units: item.common_units || [],
      search_count: item.search_count || 0,
      status: item.status,
      created_at: item.created_at,
      approved_at: item.approved_at,
      creator: item.created_by && profilesMap[item.created_by]
        ? {
            id: profilesMap[item.created_by].id,
            username: profilesMap[item.created_by].username,
            email: profilesMap[item.created_by].email,
          }
        : null,
      approver: item.approved_by && profilesMap[item.approved_by]
        ? {
            id: profilesMap[item.approved_by].id,
            username: profilesMap[item.approved_by].username,
          }
        : null,
    }));

    return NextResponse.json({
      ingredients,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
