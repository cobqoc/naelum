import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// POST /api/ingredients/check-expiry
// 만료 임박 재료를 확인하고 알림을 생성한다 (하루 1회 중복 방지)
export async function POST() {
  const supabase = await createClient();

  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);

  // expiry_alert=true 이고 3일 이내 만료되는 재료 조회
  const { data: ingredients, error: ingError } = await supabase
    .from('user_ingredients')
    .select('id, ingredient_name, expiry_date')
    .eq('user_id', user.id)
    .eq('expiry_alert', true)
    .not('expiry_date', 'is', null)
    .gte('expiry_date', today.toISOString().split('T')[0])
    .lte('expiry_date', threeDaysLater.toISOString().split('T')[0]);

  if (ingError || !ingredients || ingredients.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  // 오늘 이미 생성된 만료 알림 조회 (중복 방지)
  const todayStart = today.toISOString();
  const { data: existingNotifications } = await supabase
    .from('notifications')
    .select('action_url')
    .eq('user_id', user.id)
    .eq('notification_type', 'expiry')
    .gte('created_at', todayStart);

  const notifiedUrls = new Set(existingNotifications?.map(n => n.action_url) || []);

  // 새 알림 생성
  const toInsert = ingredients
    .filter(ing => !notifiedUrls.has(`/ingredients?highlight=${ing.id}`))
    .map(ing => {
      const expiryDate = new Date(ing.expiry_date + 'T00:00:00');
      const diffMs = expiryDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const dLabel = daysLeft === 0 ? 'D-Day' : `D-${daysLeft}`;
      const message =
        daysLeft === 0
          ? `${ing.ingredient_name}의 유통기한이 오늘 만료됩니다.`
          : `${ing.ingredient_name}의 유통기한이 ${daysLeft}일 후 만료됩니다. (${dLabel})`;

      return {
        user_id: user.id,
        notification_type: 'expiry',
        title: `⏰ 유통기한 임박: ${ing.ingredient_name}`,
        message,
        action_url: `/ingredients?highlight=${ing.id}`,
        is_read: false,
      };
    });

  if (toInsert.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  const { error: insertError } = await supabase
    .from('notifications')
    .insert(toInsert);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ created: toInsert.length });
}
