export type FridgeItem = {
  id: string;
  ingredient_name: string;
  category: string;
  expiry_date: string | null;
  storage_location: string | null;
  quantity?: number | null;
  unit?: string | null;
  purchase_date?: string | null;
  notes?: string | null;
  expiry_alert?: boolean;
  /** ingredients_master에서 JOIN된 이모지. 없으면 정적 파일 폴백. */
  emoji?: string | null;
  /** ingredients_master에서 JOIN된 보관위치별 보관일수 {"냉장":n,...}. 신선도 추정 tier② 입력. */
  shelf_life_days?: Record<string, number> | null;
  /** 비로그인 체험 모드 / localStorage에만 존재하는 임시 재료. DB insert/delete 스킵 판정. */
  isDemoItem?: boolean;
};

export type IngredientFormData = {
  ingredient_name: string;
  category: string;
  quantity?: number | null;
  unit?: string | null;
  purchase_date?: string | null;
  expiry_date?: string | null;
  storage_location?: string | null;
  notes?: string | null;
  expiry_alert?: boolean;
  ingredient_id?: string | null;
};
