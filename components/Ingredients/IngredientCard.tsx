'use client';

interface IngredientCardProps {
  ingredient: {
    id: string;
    ingredient_name: string;
    category: string;
    quantity?: number | null;
    unit?: string | null;
    expiry_date?: string | null;
    storage_location?: string | null;
    notes?: string | null;
  };
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  veggie: '🥬',
  meat: '🥩',
  seafood: '🐟',
  grain: '🌾',
  dairy: '🧀',
  seasoning: '🧂',
  condiment: '🫙',
  fruit: '🍎',
  other: '📦',
};

const STORAGE_ICONS: Record<string, string> = {
  '냉장': '❄️',
  '냉동': '🧊',
  '상온': '🌡️',
  '기타': '📦',
};

export default function IngredientCard({ ingredient, onDelete, onEdit }: IngredientCardProps) {
  // 만료일 계산
  const getExpiryInfo = () => {
    if (!ingredient.expiry_date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(ingredient.expiry_date);
    expiryDate.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: '만료됨', color: 'bg-gray-500' };
    if (diffDays === 0) return { text: 'D-Day', color: 'bg-error' };
    if (diffDays <= 3) return { text: `D-${diffDays}`, color: 'bg-error' };
    if (diffDays <= 7) return { text: `D-${diffDays}`, color: 'bg-warning' };
    return null;
  };

  const expiryInfo = getExpiryInfo();

  return (
    <div
      className="group relative rounded-2xl bg-background-secondary p-4 border border-white/5 hover:border-accent-warm/30 transition-all cursor-pointer"
      onClick={() => onEdit?.(ingredient.id)}
    >
      <div className="flex items-center gap-3">
        {/* 카테고리 아이콘 */}
        <span className="text-2xl flex-shrink-0">
          {CATEGORY_ICONS[ingredient.category] || '📦'}
        </span>

        {/* 이름 + 보관 위치 */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text-primary truncate">
            {ingredient.ingredient_name}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {ingredient.storage_location && (
              <span className="text-xs text-text-muted flex items-center gap-0.5">
                {STORAGE_ICONS[ingredient.storage_location] || '📦'}
                {ingredient.storage_location}
              </span>
            )}
            {ingredient.quantity != null && ingredient.unit && ingredient.unit !== '선택' && (
              <span className="text-xs text-text-muted">
                · {ingredient.quantity} {ingredient.unit}
              </span>
            )}
          </div>
        </div>

        {/* 만료일 배지 */}
        {expiryInfo && (
          <span className={`${expiryInfo.color} text-white text-xs px-2 py-1 rounded-full font-bold flex-shrink-0`}>
            {expiryInfo.text}
          </span>
        )}

        {/* 삭제 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(ingredient.id);
          }}
          className="h-6 w-6 rounded-full bg-white/5 text-xs text-text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-error/20 hover:text-error flex-shrink-0 flex items-center justify-center"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
