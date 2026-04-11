import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/ingredients/expiring - 만료 임박 재료 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // 기본값: 7일 이내 만료 재료
  const days = parseInt(searchParams.get('days') || '7');

  try {
    // 현재 로그인한 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 오늘 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // N일 후 날짜
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    // 만료 임박 재료 조회
    const { data, error } = await supabase
      .from('user_ingredients')
      .select('*')
      .eq('user_id', user.id)
      .not('expiry_date', 'is', null)
      .gte('expiry_date', today.toISOString().split('T')[0])
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Error fetching expiring ingredients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch expiring ingredients' },
        { status: 500 }
      );
    }

    // 남은 일수 계산 추가
    const expiring = (data || []).map(ingredient => {
      const expiryDate = new Date(ingredient.expiry_date!);
      expiryDate.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: ingredient.id,
        ingredient_name: ingredient.ingredient_name,
        category: ingredient.category,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        expiry_date: ingredient.expiry_date,
        days_until_expiry: daysUntilExpiry,
        storage_location: ingredient.storage_location
      };
    });

    return NextResponse.json({ expiring });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
