import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// GET /api/push/send-expiry
// Vercel Cron이 매일 오전 9시에 호출
export async function GET(request: NextRequest) {
  // 크론 시크릿 검증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);

  const todayStr = today.toISOString().split('T')[0];
  const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

  // 유통기한 임박 재료 조회 (expiry_alert=true)
  const { data: ingredients } = await supabase
    .from('user_ingredients')
    .select('id, user_id, ingredient_name, expiry_date')
    .eq('expiry_alert', true)
    .not('expiry_date', 'is', null)
    .gte('expiry_date', todayStr)
    .lte('expiry_date', threeDaysStr)
    .limit(5000);

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // 사용자별로 그룹화
  const byUser = ingredients.reduce<Record<string, typeof ingredients>>((acc, ing) => {
    if (!acc[ing.user_id]) acc[ing.user_id] = [];
    acc[ing.user_id].push(ing);
    return acc;
  }, {});

  let sent = 0;

  for (const [userId, userIngredients] of Object.entries(byUser)) {
    // 해당 사용자의 push subscriptions 조회
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (!subscriptions || subscriptions.length === 0) continue;

    // 각 재료마다 알림 발송
    for (const ing of userIngredients) {
      const expiryDate = new Date(ing.expiry_date + 'T00:00:00');
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const dLabel = daysLeft === 0 ? 'D-Day' : `D-${daysLeft}`;

      const payload = JSON.stringify({
        title: `⏰ 유통기한 임박: ${ing.ingredient_name}`,
        body: daysLeft === 0
          ? `${ing.ingredient_name}의 유통기한이 오늘 만료됩니다.`
          : `${ing.ingredient_name}의 유통기한이 ${daysLeft}일 후 만료됩니다. (${dLabel})`,
        url: `/ingredients?highlight=${ing.id}`,
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: unknown) {
          // 만료된 구독 삭제
          if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
        }
      }

      // DB 알림도 생성 (드롭다운에서 확인용)
      const expiryDate2 = new Date(ing.expiry_date + 'T00:00:00');
      const daysLeft2 = Math.ceil((expiryDate2.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const dLabel2 = daysLeft2 === 0 ? 'D-Day' : `D-${daysLeft2}`;
      const todayStart = today.toISOString();
      const actionUrl = `/ingredients?highlight=${ing.id}`;

      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', 'expiry')
        .eq('action_url', actionUrl)
        .gte('created_at', todayStart)
        .limit(1);

      if (!existing || existing.length === 0) {
        const { error: insertError } = await supabase.from('notifications').insert({
          user_id: userId,
          notification_type: 'expiry',
          title: `⏰ 유통기한 임박: ${ing.ingredient_name}`,
          message: daysLeft2 === 0
            ? `${ing.ingredient_name}의 유통기한이 오늘 만료됩니다.`
            : `${ing.ingredient_name}의 유통기한이 ${daysLeft2}일 후 만료됩니다. (${dLabel2})`,
          action_url: actionUrl,
          is_read: false,
        });
        if (insertError) {
          console.error('알림 저장 실패:', insertError.message);
        }
      }
    }
  }

  return NextResponse.json({ sent });
}
