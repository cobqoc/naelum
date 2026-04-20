import { SupabaseClient } from '@supabase/supabase-js';

type NotificationType = 'like' | 'comment' | 'rating' | 'save' | 'meal_time' | 'expiry';

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
  supabase,
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

  try {
    await supabase.from('notifications').insert({
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
  } catch (error) {
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
