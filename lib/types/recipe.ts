export interface RecipeBase {
  id: string;
  title: string;
  thumbnail_url: string | null;
  display_image?: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty_level: string | null;
  average_rating: number;
  views_count: number;
}

export interface Recipe extends RecipeBase {
  description?: string | null;
  cooked_count?: number;
  cuisine_type?: string;
  servings?: number | null;
  is_public?: boolean;
  created_at?: string;
  author?: { username: string; avatar_url?: string | null };
  has_cooked?: boolean;
}

export interface RecipeWithCookInfo extends Recipe {
  completed_at?: string;
  completion_photo_url?: string | null;
  user_rating?: number;
  user_review?: string | null;
}

export interface RecipeWithMatch extends Recipe {
  matchRate?: number;
  missingCount?: number;
  matchedCount?: number;
  totalIngredients?: number;
  missingIngredientNames?: string[];
  substitutes?: Record<string, string[]>;
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '초급',
  medium: '중급',
  hard: '고급',
};

export function getDifficultyLabel(
  level: string | null | undefined,
  labels?: { easy: string; medium: string; hard: string }
): string | null {
  if (!level) return null;
  if (labels) {
    return labels[level as keyof typeof labels] || level;
  }
  return DIFFICULTY_LABELS[level] || level;
}

export function getTotalTime(recipe: Pick<RecipeBase, 'prep_time_minutes' | 'cook_time_minutes'>): number | null {
  if (recipe.prep_time_minutes == null && recipe.cook_time_minutes == null) return null;
  return (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
}
