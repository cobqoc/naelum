/**
 * 프로필 페이지 분해(Phase 2) 내부 공유 타입.
 * 부모(ProfilePage)와 추출 표현 컴포넌트가 단일 출처로 공유 — 중복 정의 회피.
 * 원본 page.tsx 의 인터페이스와 동일.
 */

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  recipes_count: number;
  created_at: string;
  show_saved_to_public?: boolean;
  show_cooked_to_public?: boolean;
}

/**
 * 프로필 카드 통계 블록용 콘텐츠 카운트 — 4개 버킷(공개 레시피·공개 팁·
 * 임시저장·비공개)이 서로 겹치지 않게 사용자의 모든 글을 분할한다.
 * recipes/tips 는 '공개' 글만 — recipes_count(비정규화 컬럼)는 공개+비공개
 * 합산이라 미사용. drafts/private 는 본인 프로필에서만 의미 있음(남에겐 0).
 */
export interface ProfileCounts {
  recipes: number;
  tips: number;
  drafts: number;
  private: number;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  thumbnail_url: string | null;
  display_image: string | null;
  average_rating: number;
  views_count: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  difficulty_level?: string;
  created_at: string;
  status: string;
  completed_at?: string; // for cooked recipes
  completion_photo_url?: string | null; // for cooked recipes - user's completion photo
  author?: { username: string; avatar_url: string | null }; // for saved/cooked recipes
  user_rating?: number; // for cooked recipes - user's review rating
  user_review?: string | null; // for cooked recipes - user's review text
  has_cooked?: boolean; // whether current user has cooked this recipe
  save_notes?: string | null; // personal memo on saved recipes
}

export type TabType = 'created' | 'saved' | 'cooked' | 'tips' | 'drafts' | 'private';

export interface Tip {
  id: string;
  title: string;
  category: string;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  views_count: number;
  is_public: boolean;
  is_draft: boolean;
  created_at: string;
}

// 관심사 이모지 매핑
export const interestEmojis: Record<string, string> = {
  '한식': '🍚',
  '중식': '🥟',
  '일식': '🍱',
  '양식': '🍝',
  '이탈리안': '🍕',
  '프렌치': '🥐',
  '멕시칸': '🌮',
  '인도': '🍛',
  '태국': '🍜',
  '비건': '🥗',
  '디저트': '🍰',
  '베이킹': '🥖',
};
