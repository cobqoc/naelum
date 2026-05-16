import { SupabaseClient, createClient } from '@supabase/supabase-js';

type NotificationType = 'like' | 'comment' | 'rating' | 'save' | 'meal_time' | 'expiry';

// 알림은 *행위자*(A)가 *수신자*(B) 행을 생성한다(A ≠ B). notifications RLS 는
// SELECT/UPDATE 만(auth.uid()=user_id) — INSERT 정책이 없어 user-context
// 클라이언트 insert 는 조용히 거부됐다(2026-05-17 RLS 감사서 발견한 선존
// 데이터유실 버그: 댓글·평점·낼름 알림 미발송). owner-scoped INSERT 정책은
// 의미상 부적합(타인 알림 차단) / true 정책은 스팸 취약 → 알림 insert 는
// service-role 로 한다(lib/ratelimit.ts 와 동일 패턴). RLS 마이그레이션 아님.
function notificationAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface CreateNotificationParams {
  supabase: SupabaseClient;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  relatedUserId?: string;
  relatedRecipeId?: string;
  relatedCommentId?: string;
}

export async function createNotification({
  supabase: _supabase, // 시그니처 안정용 유지 — insert 는 service-role 로(위 주석)
  userId,
  type,
  title,
  message,
  actionUrl,
  relatedUserId,
  relatedRecipeId,
  relatedCommentId,
}: CreateNotificationParams) {
  // Don't notify yourself
  if (relatedUserId && userId === relatedUserId) return;

  // Supabase 는 RLS 거부 시 throw 하지 않고 { error } 반환 — try/catch 로는
  // 못 잡는다. service-role insert + 명시적 error 체크(더 이상 silent 아님).
  const { error } = await notificationAdminClient().from('notifications').insert({
    user_id: userId,
    notification_type: type,
    title,
    message,
    action_url: actionUrl || null,
    related_user_id: relatedUserId || null,
    related_recipe_id: relatedRecipeId || null,
    related_comment_id: relatedCommentId || null,
    is_read: false,
  });
  if (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function notifyComment(
  supabase: SupabaseClient,
  recipeAuthorId: string,
  commenterUsername: string,
  recipeId: string,
  recipeTitle: string,
  commenterId: string,
  commentId?: string,
) {
  await createNotification({
    supabase,
    userId: recipeAuthorId,
    type: 'comment',
    title: '새로운 댓글',
    message: `${commenterUsername}님이 "${recipeTitle}" 레시피에 댓글을 남겼습니다`,
    actionUrl: `/recipes/${recipeId}`,
    relatedUserId: commenterId,
    relatedRecipeId: recipeId,
    relatedCommentId: commentId,
  });
}

export async function notifyRating(
  supabase: SupabaseClient,
  recipeAuthorId: string,
  raterUsername: string,
  recipeId: string,
  recipeTitle: string,
  rating: number,
  raterId: string,
) {
  await createNotification({
    supabase,
    userId: recipeAuthorId,
    type: 'rating',
    title: '새로운 평가',
    message: `${raterUsername}님이 "${recipeTitle}"에 ${'⭐'.repeat(rating)} 평가를 남겼습니다.`,
    actionUrl: `/recipes/${recipeId}`,
    relatedUserId: raterId,
    relatedRecipeId: recipeId,
  });
}

export async function notifySave(
  supabase: SupabaseClient,
  recipeAuthorId: string,
  saverUsername: string,
  recipeId: string,
  recipeTitle: string,
  saverId: string,
) {
  await createNotification({
    supabase,
    userId: recipeAuthorId,
    type: 'save',
    title: '레시피 낼름!',
    message: `${saverUsername}님이 "${recipeTitle}"을(를) 낼름했습니다.`,
    actionUrl: `/recipes/${recipeId}`,
    relatedUserId: saverId,
    relatedRecipeId: recipeId,
  });
}

export async function notifyExpiry(
  supabase: SupabaseClient,
  userId: string,
  ingredientName: string,
  daysLeft: number,
) {
  await createNotification({
    supabase,
    userId,
    type: 'expiry',
    title: '유통기한 임박',
    message: daysLeft <= 0
      ? `${ingredientName}의 유통기한이 지났습니다!`
      : `${ingredientName}의 유통기한이 ${daysLeft}일 남았습니다.`,
    actionUrl: '/fridge',
  });
}
