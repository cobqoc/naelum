// 통합 피드(recipe_posts) 클라이언트 타입.
// 리뷰 = rating !== null · 댓글 = rating === null · 답글 = parent_id !== null.

export interface PostUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Post {
  id: string;
  recipe_id: string;
  user_id: string;
  parent_id: string | null;
  content: string | null;
  rating: number | null;
  photo_url: string | null;
  likes_count: number;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user: PostUser;
  replies_count?: number;
  is_liked?: boolean;
}

export interface PostsResponse {
  posts: Post[];
  averageRating: number;
  ratingsCount: number;
  cookedCount: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export type TimeTranslations = {
  justNow: string;
  timeAgoYear: string;
  timeAgoMonth: string;
  timeAgoDay: string;
  timeAgoHour: string;
  timeAgoMinute: string;
};

export function formatRelativeTime(dateString: string, tc: TimeTranslations): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const intervals: { template: string; seconds: number }[] = [
    { template: tc.timeAgoYear, seconds: 31536000 },
    { template: tc.timeAgoMonth, seconds: 2592000 },
    { template: tc.timeAgoDay, seconds: 86400 },
    { template: tc.timeAgoHour, seconds: 3600 },
    { template: tc.timeAgoMinute, seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return interval.template.replace('{n}', String(count));
  }
  return tc.justNow;
}
