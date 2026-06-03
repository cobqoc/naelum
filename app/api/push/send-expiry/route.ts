import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { estimateExpiry } from '@/lib/freshness/shelfLife';

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

  // cron 은 유저 세션이 없다(anon). user-context 클라이언트면 RLS(auth.uid()=
  // user_id)로 user_ingredients·notifications 등을 0건 읽어 cron 전체가 무력.
  // → 시스템 cron 의 올바른 컨텍스트인 service-role 사용 (CRON_SECRET 게이트).
  // 2026-05-17 RLS 감사서 발견한 선존 버그 수정.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);
  const todayStr = today.toISOString().split('T')[0];
  const threeDaysStr = threeDaysLater.toISOString().split('T')[0];

  // push_notifications = true 인 유저 ID 목록
  const { data: optedInProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('push_notifications', true);

  const optedInIds = new Set((optedInProfiles ?? []).map(p => p.id));
  if (optedInIds.size === 0) {
    return NextResponse.json({ sent: 0 });
  }
  const optedInArr = [...optedInIds];

  // 'YYYY-MM-DD' → 오늘까지 남은 일수 (확정·추정 동일 계산).
  const daysFromToday = (iso: string) =>
    Math.ceil((new Date(iso + 'T00:00:00').getTime() - today.getTime()) / 86400000);

  type Notify = { userId: string; id: string; type: 'expiry' | 'expiry_estimate'; title: string; message: string };
  const notify: Notify[] = [];

  // (A) 확정 만료 — 유저가 직접 입력한 expiry_date 가 D-3 ~ D-0. 강한 알림(⏰).
  const { data: confirmed } = await supabase
    .from('user_ingredients')
    .select('id, user_id, ingredient_name, expiry_date')
    .eq('expiry_alert', true)
    .in('user_id', optedInArr)
    .not('expiry_date', 'is', null)
    .gte('expiry_date', todayStr)
    .lte('expiry_date', threeDaysStr)
    .limit(5000);
  for (const ing of confirmed ?? []) {
    const d = daysFromToday(ing.expiry_date as string);
    notify.push({
      userId: ing.user_id, id: ing.id, type: 'expiry',
      title: `⏰ 유통기한 임박: ${ing.ingredient_name}`,
      message: d === 0
        ? `${ing.ingredient_name}의 유통기한이 오늘 만료됩니다.`
        : `${ing.ingredient_name}의 유통기한이 ${d}일 후 만료됩니다. (D-${d})`,
    });
  }

  // (B) 추정 보관기한 — expiry_date 없음 + purchase_date 있음. 재료별/카테고리 보관일수로 추정.
  //     추측이라 *예상 D-1~D-0* 만(보수적, 과경보 방지) + "예상" 라벨로 확정과 구분(🧊).
  const { data: estRows } = await supabase
    .from('user_ingredients')
    .select('id, user_id, ingredient_name, category, storage_location, purchase_date, ingredients_master!ingredient_id(shelf_life_days)')
    .eq('expiry_alert', true)
    .in('user_id', optedInArr)
    .is('expiry_date', null)
    .not('purchase_date', 'is', null)
    .limit(5000);
  for (const ing of estRows ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const master = (ing as any).ingredients_master;
    const estISO = estimateExpiry({
      purchaseDate: ing.purchase_date as string,
      shelfLifeDays: master?.shelf_life_days ?? null,
      category: ing.category,
      storageLocation: ing.storage_location,
    });
    if (!estISO) continue;
    const d = daysFromToday(estISO);
    if (d < 0 || d > 1) continue; // 보수적: 예상 D-1/D-0 만 (지나면 더는 안 보냄 → 도배 방지)
    notify.push({
      userId: ing.user_id, id: ing.id, type: 'expiry_estimate',
      title: `🧊 보관기한 예상: ${ing.ingredient_name}`,
      message: `${ing.ingredient_name}의 예상 보관기한이 ${d === 0 ? '오늘' : '내일'}쯤이에요. 상태를 확인해보세요. (예상)`,
    });
  }

  if (notify.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // 사용자별로 그룹화
  const byUser = notify.reduce<Record<string, Notify[]>>((acc, n) => {
    (acc[n.userId] ??= []).push(n);
    return acc;
  }, {});

  let sent = 0;

  for (const [userId, items] of Object.entries(byUser)) {
    // 해당 사용자의 push subscriptions 조회.
    // 구독이 없어도 앱 내 알림(드롭다운)은 계속 생성한다 — OS 푸시만 구독이 있을 때.
    // (브라우저 푸시 권한을 허용 안 한 유저가 대다수라, 둘을 묶으면 앱 내 알림조차 안 떴다.)
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    for (const n of items) {
      const actionUrl = `/kitchen?highlight=${n.id}`;

      // 1) 앱 내 알림(드롭다운) — 구독 여부와 무관하게 생성. 타입+url+오늘 기준 1회 중복 방지.
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', n.type)
        .eq('action_url', actionUrl)
        .gte('created_at', todayStart)
        .limit(1);

      if (!existing || existing.length === 0) {
        const { error: insertError } = await supabase.from('notifications').insert({
          user_id: userId,
          notification_type: n.type,
          title: n.title,
          message: n.message,
          action_url: actionUrl,
          is_read: false,
        });
        if (insertError) {
          console.error('알림 저장 실패:', insertError.message);
        }
      }

      // 2) OS 푸시 — 구독이 있을 때만.
      if (!subscriptions || subscriptions.length === 0) continue;

      const payload = JSON.stringify({ title: n.title, body: n.message, url: actionUrl });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: unknown) {
          // 만료된 구독 삭제 (cron 정리 — 실패해도 다음 회차 재시도, 로그만)
          if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
            const { error: delErr } = await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
            if (delErr) console.warn('[send-expiry] 만료 구독 삭제 실패:', delErr.message);
          }
        }
      }
    }
  }

  return NextResponse.json({ sent });
}
