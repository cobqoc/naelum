'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import { useAuth } from '@/lib/auth/context';
import IngredientCategoryFilter from '@/components/Ingredients/IngredientCategoryFilter';
import ExpiringIngredientsAlert from '@/components/Ingredients/ExpiringIngredientsAlert';
import IngredientDetailModal from '@/components/Ingredients/IngredientDetailModal';
import AddIngredientModal from '@/components/Ingredients/AddIngredientModal';
import { getIngredientEmoji } from '@/lib/utils/ingredientEmoji';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';

// ── 냉장고 스타일 레이아웃 ──────────────────────────

// 밝은 배경(냉장·상온·기타)용 카테고리 색상 — 진한 텍스트로 가독성 최대화
const CATEGORY_PILL_LIGHT: Record<string, string> = {
  veggie:    'bg-green-100 text-green-800 ring-1 ring-green-300/70',
  meat:      'bg-red-100 text-red-800 ring-1 ring-red-300/70',
  seafood:   'bg-sky-100 text-sky-800 ring-1 ring-sky-300/70',
  grain:     'bg-lime-100 text-lime-800 ring-1 ring-lime-300/70',
  dairy:     'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300/70',
  seasoning: 'bg-violet-100 text-violet-800 ring-1 ring-violet-300/70',
  condiment: 'bg-teal-100 text-teal-800 ring-1 ring-teal-300/70',
  fruit:     'bg-orange-100 text-orange-800 ring-1 ring-orange-300/70',
  other:     'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300/70',
};

// 어두운 배경(기본)용 카테고리 색상 — 밝은 텍스트로 가독성 최대화
const CATEGORY_PILL_DARK: Record<string, string> = {
  veggie:    'bg-green-500/20 text-green-400 ring-1 ring-green-500/35',
  meat:      'bg-red-500/20 text-red-400 ring-1 ring-red-500/35',
  seafood:   'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/35',
  grain:     'bg-lime-500/20 text-lime-400 ring-1 ring-lime-500/35',
  dairy:     'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/35',
  seasoning: 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/35',
  condiment: 'bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/35',
  fruit:     'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/35',
  other:     'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/35',
};

const STORAGE_GROUPS = [
  { key: '냉장', label: '냉장', icon: '❄️', locations: ['냉장'] },
  { key: '냉동', label: '냉동', icon: '🧊', locations: ['냉동'] },
  { key: '상온', label: '상온', icon: '🌡️', locations: ['상온'] },
  { key: '기타', label: '기타', icon: '📦', locations: ['기타', null, undefined] },
] as const;

const STORAGE_ICONS: Record<string, string> = { '냉장': '❄️', '냉동': '🧊', '상온': '🌡️', '기타': '📦' };

function getExpiryStatus(expiryDate: string | null | undefined) {
  if (!expiryDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate); expiry.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: '만료', level: 'expired' as const };
  if (days === 0) return { text: 'D-Day', level: 'critical' as const };
  if (days <= 3) return { text: `D-${days}`, level: 'critical' as const };
  if (days <= 7) return { text: `D-${days}`, level: 'warning' as const };
  return null;
}

// ── MovePopup ──────────────────────────────────────
interface MovePopupProps {
  ingredientId: string;
  ingredientName: string;
  currentLocation: string;
  onMove: (id: string, newLocation: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function MovePopup({ ingredientId, ingredientName, currentLocation, onMove, onDelete, onClose }: MovePopupProps) {
  const targets = (['냉장', '냉동', '상온', '기타'] as const).filter(l => l !== currentLocation);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-background-secondary rounded-t-3xl sm:rounded-2xl p-6 border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-xs text-text-muted mb-1">이동할 위치 선택</p>
        <p className="font-bold text-text-primary text-base mb-4 truncate">{ingredientName}</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {targets.map(location => (
            <button
              key={location}
              onClick={() => { onMove(ingredientId, location); onClose(); }}
              className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-background-tertiary hover:bg-accent-warm/20 border border-white/5 hover:border-accent-warm/40 transition-all"
            >
              <span className="text-2xl">{STORAGE_ICONS[location]}</span>
              <span className="text-xs font-semibold text-text-primary">{location}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => { onDelete(ingredientId); onClose(); }}
          className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm font-semibold transition-colors mb-2"
        >
          🗑️ 삭제
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}

// ── IngredientPill ─────────────────────────────────
// 냉동 구역(어두운 파란 배경)용 pill — 카테고리별 밝은 색상
const CATEGORY_PILL_FREEZER: Record<string, string> = {
  veggie:    'bg-green-400/30 text-green-200 ring-1 ring-green-400/40',
  meat:      'bg-red-400/30 text-red-200 ring-1 ring-red-400/40',
  seafood:   'bg-sky-400/30 text-sky-200 ring-1 ring-sky-400/40',
  grain:     'bg-lime-400/30 text-lime-200 ring-1 ring-lime-400/40',
  dairy:     'bg-yellow-300/30 text-yellow-200 ring-1 ring-yellow-300/40',
  seasoning: 'bg-violet-400/30 text-violet-200 ring-1 ring-violet-400/40',
  condiment: 'bg-teal-400/30 text-teal-200 ring-1 ring-teal-400/40',
  fruit:     'bg-orange-400/30 text-orange-200 ring-1 ring-orange-400/40',
  other:     'bg-indigo-400/30 text-indigo-200 ring-1 ring-indigo-400/40',
};

interface IngredientPillProps {
  ingredient: {
    id: string;
    ingredient_name: string;
    category: string;
    expiry_date?: string | null;
    storage_location?: string | null;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, currentLocation: string) => void;
  lightBg?: boolean;
  freezer?: boolean;
  shoppingMode?: boolean;
  isSelectedForShopping?: boolean;
  onToggleShoppingSelect?: (id: string) => void;
}

function IngredientPill({ ingredient, onEdit, onDelete, onMove, lightBg, freezer, shoppingMode, isSelectedForShopping, onToggleShoppingSelect }: IngredientPillProps) {
  const icon = getIngredientEmoji(ingredient.ingredient_name, ingredient.category);
  const expiry = getExpiryStatus(ingredient.expiry_date);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);

  const pillColor = (() => {
    if (expiry?.level === 'critical') {
      return freezer
        ? 'bg-red-200/60 text-red-800 ring-1 ring-red-300/50'
        : lightBg
        ? 'bg-red-50/80 text-red-700 ring-1 ring-red-300/50'
        : 'bg-error/20 text-error ring-1 ring-error/40';
    }
    if (expiry?.level === 'warning') {
      return freezer
        ? 'bg-yellow-200/60 text-yellow-800 ring-1 ring-yellow-300/50'
        : lightBg
        ? 'bg-yellow-50/80 text-yellow-700 ring-1 ring-yellow-300/50'
        : 'bg-warning/20 text-warning ring-1 ring-warning/40';
    }
    if (freezer) {
      return CATEGORY_PILL_FREEZER[ingredient.category] || 'bg-white/25 text-[#2a4a6a] ring-1 ring-white/20';
    }
    if (lightBg) {
      return CATEGORY_PILL_LIGHT[ingredient.category] || 'bg-slate-50/80 text-slate-600 ring-1 ring-slate-200/40';
    }
    return CATEGORY_PILL_DARK[ingredient.category] || 'bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/35';
  })();

  const startLongPress = () => {
    wasLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      wasLongPress.current = true;
      onMove(ingredient.id, ingredient.storage_location || '기타');
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  if (shoppingMode) {
    return (
      <div
        className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 mr-2 mb-1 rounded-xl text-sm cursor-pointer transition-all select-none active:scale-95 ${
          isSelectedForShopping
            ? 'ring-2 ring-accent-warm bg-accent-warm/20 opacity-60 line-through'
            : pillColor
        }`}
        onClick={() => onToggleShoppingSelect?.(ingredient.id)}
      >
        <span className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${
          isSelectedForShopping
            ? 'bg-accent-warm border-accent-warm text-background-primary'
            : 'border-current/40'
        }`}>
          {isSelectedForShopping && '✓'}
        </span>
        <span className="text-base">{icon}</span>
        <span className="truncate max-w-[80px] font-medium">{ingredient.ingredient_name}</span>
      </div>
    );
  }

  return (
    <div
      className={`group/pill relative inline-flex items-center gap-1.5 px-3 py-1.5 mr-2 mb-1 rounded-xl text-sm cursor-pointer transition-all select-none hover:scale-[1.06] hover:shadow-lg ${pillColor}`}
      onClick={() => {
        if (!wasLongPress.current) onEdit(ingredient.id);
        wasLongPress.current = false;
      }}
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
      onContextMenu={e => e.preventDefault()}
    >
      <span className="text-base">{icon}</span>
      <span className="truncate max-w-[80px] font-medium">{ingredient.ingredient_name}</span>
      {expiry && (
        <span className="text-[10px] font-bold flex-shrink-0">{expiry.text}</span>
      )}
      <button
        onClick={e => { e.stopPropagation(); cancelLongPress(); onDelete(ingredient.id); }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-all z-10 opacity-0 scale-75 group-hover/pill:opacity-100 group-hover/pill:scale-100"
      >
        ✕
      </button>
    </div>
  );
}

// ── FridgeShelf ────────────────────────────────────
interface FridgeShelfProps {
  label: string;
  icon: string;
  items: Array<{
    id: string;
    ingredient_name: string;
    category: string;
    expiry_date?: string | null;
    storage_location?: string | null;
  }>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, currentLocation: string) => void;
  onAddClick: (location: string) => void;
  lightBg?: boolean;
  freezer?: boolean;
  borderTop?: boolean;
  warm?: boolean;
  stone?: boolean;
  shoppingMode?: boolean;
  selectedForShopping?: string[];
  onToggleShoppingSelect?: (id: string) => void;
}

function FridgeShelf({ label, icon, items, onEdit, onDelete, onMove, onAddClick, lightBg, freezer, borderTop, warm, stone, shoppingMode, selectedForShopping, onToggleShoppingSelect }: FridgeShelfProps) {
  const labelClass  = freezer ? 'text-[#1a3a6a]' : lightBg ? 'text-[#4a7a9a]' : warm ? 'text-amber-500' : stone ? 'text-stone-400' : 'text-text-muted';
  const countClass  = freezer ? 'text-[#2a5a9a]/70' : lightBg ? 'text-[#7aa8c0]' : warm ? 'text-amber-400/70' : stone ? 'text-stone-500/60' : 'text-text-muted/50';
  const addBtnClass = 'text-background-primary bg-accent-warm hover:bg-accent-hover active:scale-95';
  const emptyBorder = (freezer || lightBg) ? 'border-white/30 text-[#4a7a9a]/70' : warm ? 'border-amber-400/25 text-amber-500/50' : stone ? 'border-stone-500/20 text-stone-500/40' : 'border-white/10 text-text-muted/50';
  const dividerClass = (freezer || lightBg) ? 'border-t border-white/20' : 'border-t border-white/5';

  return (
    <div className={`px-4 py-4 ${borderTop ? dividerClass : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-base ${labelClass}`}>{icon}</span>
          <span className={`text-sm font-bold ${labelClass}`}>{label}</span>
          <span className={`text-xs ${countClass}`}>({items.length})</span>
        </div>
        <button
          onClick={() => onAddClick(label)}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-semibold ${addBtnClass}`}
        >
          + 추가
        </button>
      </div>
      {items.length === 0 ? (
        <div className={`flex items-center justify-center border border-dashed rounded-xl min-h-[70px] ${emptyBorder}`}>
          <span className="text-xs">비어있음</span>
        </div>
      ) : (
        <div className="flex flex-wrap min-h-[40px] pt-1">
          {items.map(item => (
            <IngredientPill
              key={item.id}
              ingredient={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              lightBg={lightBg}
              freezer={freezer}
              shoppingMode={shoppingMode}
              isSelectedForShopping={selectedForShopping?.includes(item.id)}
              onToggleShoppingSelect={onToggleShoppingSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────

interface Ingredient {
  id: string;
  ingredient_name: string;
  category: string;
  quantity?: number | null;
  unit?: string | null;
  purchase_date?: string | null;
  expiry_date?: string | null;
  storage_location?: string | null;
  notes?: string | null;
  expiry_alert?: boolean;
}

interface IngredientFormData {
  ingredient_name: string;
  category: string;
  quantity: number | null;
  unit: string;
  purchase_date: string;
  expiry_date: string;
  storage_location: string;
  notes: string;
  expiry_alert: boolean;
}

export default function IngredientsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useI18n();
  const toast = useToast();
  const { user: authUser, profile, loading: authLoading, refresh } = useAuth();

  // AuthProvider가 세션을 감지하지 못하는 경우 대비: 쿠키 기반 강제 리프레시
  useEffect(() => {
    if (authLoading || authUser) return;
    // 쿠키에 세션이 있는데 authUser가 null이면 refresh 재시도
    const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('sb-') && c.includes('auth-token'));
    if (hasCookie) {
      refresh();
    }
  }, [authLoading, authUser, refresh]);

  const [myIngredients, setMyIngredients] = useState<Ingredient[]>([]);
  const [loading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalLocation, setAddModalLocation] = useState<string | null>(null);
  const [movingIngredient, setMovingIngredient] = useState<{
    id: string;
    name: string;
    currentLocation: string;
  } | null>(null);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [selectedForShopping, setSelectedForShopping] = useState<string[]>([]);
  const [addingToShoppingList, setAddingToShoppingList] = useState(false);

  useEffect(() => {
    if (!authUser) return;
    let isMounted = true;

    const fetchIngredients = async () => {
      try {
        const { data, error } = await supabase
          .from('user_ingredients')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching ingredients:', error);
        } else if (isMounted) {
          setMyIngredients(data || []);
        }

        fetch('/api/ingredients/check-expiry', { method: 'POST' }).catch(() => {});
      } catch (err) {
        console.error('Error fetching ingredients:', err);
      }
    };

    fetchIngredients();

    return () => { isMounted = false; };
  }, [authUser, supabase]);

  // 섹션별 추가 버튼 핸들러
  const handleSectionAdd = (location: string) => {
    setAddModalLocation(location);
    setAddModalOpen(true);
  };

  // 이동 요청 핸들러 (길게 누르기)
  const handleMoveRequest = (id: string, currentLocation: string) => {
    const ingredient = myIngredients.find(i => i.id === id);
    if (ingredient) {
      setMovingIngredient({ id, name: ingredient.ingredient_name, currentLocation });
    }
  };

  // 재료 위치 이동
  const moveIngredient = async (id: string, newLocation: string) => {
    const { data, error } = await supabase
      .from('user_ingredients')
      .update({ storage_location: newLocation })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('이동에 실패했어요');
    } else if (data) {
      setMyIngredients(prev => prev.map(i => i.id === id ? data : i));
      toast.success(`${newLocation}으로 이동했어요`);
    }
  };

  const addIngredient = async (formData: IngredientFormData) => {
    try {
      if (!authUser) {
        toast.error(t.ingredientPage.loginRequired);
        return;
      }

      if (myIngredients.find(i =>
        i.ingredient_name === formData.ingredient_name &&
        i.storage_location === formData.storage_location
      )) {
        toast.warning(t.ingredientPage.alreadyRegistered);
        return;
      }

      const { data, error } = await supabase
        .from('user_ingredients')
        .insert({
          user_id: authUser.id,
          ingredient_name: formData.ingredient_name,
          category: formData.category,
          quantity: formData.quantity,
          unit: formData.unit !== '선택' ? formData.unit : null,
          purchase_date: formData.purchase_date || null,
          expiry_date: formData.expiry_date || null,
          storage_location: formData.storage_location,
          notes: formData.notes || null,
          expiry_alert: formData.expiry_alert
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding ingredient:', error);
        toast.error(t.ingredientPage.addFailed);
      } else if (data) {
        console.log('Ingredient added successfully:', data);
        setMyIngredients(prev => [data, ...prev]);
        toast.success(t.ingredientPage.ingredientAdded);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error(t.ingredientPage.unexpectedError);
    }
  };

  const removeIngredient = (id: string) => {
    const target = myIngredients.find(i => i.id === id);
    if (!target) return;

    // 즉시 UI에서 제거
    setMyIngredients(prev => prev.filter(i => i.id !== id));

    let undone = false;

    toast.toast(`${target.ingredient_name} 삭제됨`, 'info', {
      duration: 4000,
      action: {
        label: '되돌리기',
        onClick: () => {
          undone = true;
          setMyIngredients(prev => [target, ...prev]);
        },
      },
    });

    // 4초 후 실제 DB 삭제
    setTimeout(async () => {
      if (undone) return;
      const { error } = await supabase.from('user_ingredients').delete().eq('id', id);
      if (error) {
        console.error('Error removing ingredient:', error);
        toast.error(t.ingredientPage.deleteFailed);
        setMyIngredients(prev => [target, ...prev]);
      }
    }, 4000);
  };

  const updateIngredient = async (id: string, formData: IngredientFormData) => {
    if (!authUser) return;
    {
      const { data, error } = await supabase
        .from('user_ingredients')
        .update({
          ingredient_name: formData.ingredient_name,
          category: formData.category,
          quantity: formData.quantity,
          unit: formData.unit !== '선택' ? formData.unit : null,
          purchase_date: formData.purchase_date || null,
          expiry_date: formData.expiry_date || null,
          storage_location: formData.storage_location,
          notes: formData.notes || null,
          expiry_alert: formData.expiry_alert
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating ingredient:', error);
        toast.error(t.ingredientPage.updateFailed);
      } else if (data) {
        setMyIngredients(myIngredients.map(i => i.id === id ? data : i));
      }
    }
  };

  const addIngredientsFromPhoto = async (userLabels: {
    name: string;
    ingredientId?: string;
    category: string;
    quantity?: number | null;
    unit?: string;
    purchase_date?: string;
    expiry_date?: string;
    storage_location?: string;
    notes?: string;
    expiry_alert?: boolean;
  }[]) => {
    if (!authUser) return;

    try {
      const ingredientsToAdd = userLabels.map(label => ({
        user_id: authUser.id,
        ingredient_name: label.name,
        category: label.category,
        quantity: label.quantity || null,
        unit: label.unit && label.unit !== '선택' ? label.unit : null,
        purchase_date: label.purchase_date || null,
        expiry_date: label.expiry_date || null,
        storage_location: label.storage_location || '기타',
        notes: label.notes || null,
        expiry_alert: label.expiry_alert !== false
      }));

      const { data, error } = await supabase
        .from('user_ingredients')
        .insert(ingredientsToAdd)
        .select();

      if (error) {
        console.error('Error adding ingredients from photo:', error);
        toast.error(t.ingredientPage.addFailed);
      } else if (data) {
        setMyIngredients([...data, ...myIngredients]);
        toast.success(`${data.length}${t.ingredientPage.ingredientsAdded}`);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error(t.ingredientPage.addError);
    }
  };

  const filteredIngredients = useMemo(() => {
    let filtered = myIngredients;

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(ingredient =>
        selectedCategories.includes(ingredient.category)
      );
    }

    return filtered;
  }, [myIngredients, selectedCategories]);

  // 그룹별 재료 목록
  const groupItems = useMemo(() => {
    return STORAGE_GROUPS.reduce((acc, group) => {
      acc[group.key] = filteredIngredients.filter(i =>
        (group.locations as readonly (string | null | undefined)[]).includes(i.storage_location ?? undefined)
      );
      return acc;
    }, {} as Record<string, typeof filteredIngredients>);
  }, [filteredIngredients]);

  const toggleShoppingMode = () => {
    setShoppingMode(prev => !prev);
    setSelectedForShopping([]);
  };

  const toggleShoppingSelect = (id: string) => {
    setSelectedForShopping(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const addToShoppingList = async () => {
    if (selectedForShopping.length === 0) return;
    setAddingToShoppingList(true);
    try {
      const selected = myIngredients.filter(i => selectedForShopping.includes(i.id));
      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: null,
          recipeTitle: '냉장고에서 추가',
          ingredients: selected.map(i => ({
            ingredient_name: i.ingredient_name,
            quantity: i.quantity ?? undefined,
            unit: i.unit ?? undefined,
            category: i.category,
          })),
        }),
      });
      if (!res.ok) throw new Error('failed');
      toast.success(`${selected.length}개 재료가 장보기 목록에 추가됐어요! 헤더의 🛒 에서 확인하세요.`);
      window.dispatchEvent(new Event('shopping-list-updated'));
      setShoppingMode(false);
      setSelectedForShopping([]);
    } catch {
      toast.error('장보기 목록 추가에 실패했어요.');
    } finally {
      setAddingToShoppingList(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-20">
      <Header />
      {/* 전역 헤더(fixed) 높이만큼 여백 */}
      <div className="h-14 md:h-20" />

      <main className="container mx-auto max-w-2xl px-6 pt-6">
        {/* 페이지 타이틀 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">
            {profile?.username ? `${profile.username}님의 냉장고` : '냉장고'}
          </h1>
          <button
            onClick={toggleShoppingMode}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              shoppingMode
                ? 'bg-accent-warm text-background-primary'
                : 'bg-white/10 text-text-secondary hover:bg-white/15'
            }`}
            title={shoppingMode ? '장보기 모드 끄기' : '장보기 모드'}
          >
            🛒 {shoppingMode ? '취소' : '장보기'}
          </button>
        </div>
        {/* 만료 알림 */}
        <ExpiringIngredientsAlert />

        {/* 나의 재료 목록 */}
        <section className="mb-12">
          {/* 카테고리 필터 */}
          {myIngredients.length > 0 && (
            <IngredientCategoryFilter
              selectedCategories={selectedCategories}
              onChange={setSelectedCategories}
            />
          )}

          {loading ? (
            /* 로딩 스켈레톤 */
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden border-2 border-[#3a3a3a] bg-gradient-to-br from-[#3a3a3a] to-[#2d2d2d] p-4 space-y-3">
                {[0, 1].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
              <div className="rounded-2xl border border-white/10 p-4 space-y-3">
                {[0, 1].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            </div>
          ) : (filteredIngredients.length > 0 || myIngredients.length === 0) ? (
            <div className="space-y-3">
              {/* ── 냉장고 캐비넷 (냉장 + 냉동) ── */}
              {(() => {
                const fridgeItems = groupItems['냉장'] || [];
                const freezerItems = groupItems['냉동'] || [];
                const FRIDGE_N = 4;
                const FREEZER_N = 2;
                const fridgePerShelf = Math.max(Math.ceil(fridgeItems.length / FRIDGE_N), 1);
                const freezerPerShelf = Math.max(Math.ceil(freezerItems.length / FREEZER_N), 1);
                const fridgeShelves = Array.from({ length: FRIDGE_N }, (_, i) =>
                  fridgeItems.slice(i * fridgePerShelf, (i + 1) * fridgePerShelf)
                );
                const freezerShelves = Array.from({ length: FREEZER_N }, (_, i) =>
                  freezerItems.slice(i * freezerPerShelf, (i + 1) * freezerPerShelf)
                );
                return (
                  <div className="rounded-2xl overflow-hidden">
                    {/* 냉장 구역 — 4개 선반 */}
                    <div style={{ background: 'linear-gradient(180deg, rgba(244,249,255,0.78) 0%, rgba(226,240,252,0.78) 100%)' }}>
                      <div className="flex items-center justify-between px-4 pt-3 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base text-[#4a7a9a]">❄️</span>
                          <span className="text-sm font-bold text-[#4a7a9a]">냉장</span>
                          <span className="text-xs text-[#7aa8c0]">({fridgeItems.length})</span>
                        </div>
                        <button
                          onClick={() => handleSectionAdd('냉장')}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold text-background-primary bg-accent-warm hover:bg-accent-hover active:scale-95 transition-colors"
                        >
                          + 추가
                        </button>
                      </div>
                      {fridgeShelves.map((shelfItems, idx) => (
                        <div key={idx}>
                          <div className="px-4 pt-4 pb-3 min-h-[64px] flex flex-wrap items-center">
                            {shelfItems.length > 0
                              ? shelfItems.map(item => (
                                  <IngredientPill
                                    key={item.id}
                                    ingredient={item}
                                    onEdit={(id) => { const ing = myIngredients.find(i => i.id === id); if (ing) setEditingIngredient(ing); }}
                                    onDelete={removeIngredient}
                                    onMove={handleMoveRequest}
                                    lightBg
                                    shoppingMode={shoppingMode}
                                    isSelectedForShopping={selectedForShopping.includes(item.id)}
                                    onToggleShoppingSelect={toggleShoppingSelect}
                                  />
                                ))
                              : <span className="text-xs text-[#7aa8c0]/60 italic">빈 선반 — 재료를 추가해보세요</span>
                            }
                          </div>
                          <div className="h-2.5" style={{
                            background: 'linear-gradient(180deg, #8ab4d4 0%, #6a94b4 100%)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                          }} />
                        </div>
                      ))}
                    </div>

                    {/* 냉동 구역 — 2개 선반 */}
                    <div style={{ background: 'linear-gradient(180deg, rgba(141,189,224,0.72) 0%, rgba(106,158,200,0.72) 100%)' }}>
                      <div className="flex items-center justify-between px-4 pt-3 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base text-[#1a3a6a]">🧊</span>
                          <span className="text-sm font-bold text-[#1a3a6a]">냉동</span>
                          <span className="text-xs text-[#2a5a9a]/70">({freezerItems.length})</span>
                        </div>
                        <button
                          onClick={() => handleSectionAdd('냉동')}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold text-background-primary bg-accent-warm hover:bg-accent-hover active:scale-95 transition-colors"
                        >
                          + 추가
                        </button>
                      </div>
                      {freezerShelves.map((shelfItems, idx) => (
                        <div key={idx}>
                          <div className="px-4 pt-4 pb-3 min-h-[64px] flex flex-wrap items-center">
                            {shelfItems.length > 0
                              ? shelfItems.map(item => (
                                  <IngredientPill
                                    key={item.id}
                                    ingredient={item}
                                    onEdit={(id) => { const ing = myIngredients.find(i => i.id === id); if (ing) setEditingIngredient(ing); }}
                                    onDelete={removeIngredient}
                                    onMove={handleMoveRequest}
                                    freezer
                                    lightBg
                                    shoppingMode={shoppingMode}
                                    isSelectedForShopping={selectedForShopping.includes(item.id)}
                                    onToggleShoppingSelect={toggleShoppingSelect}
                                  />
                                ))
                              : <span className="text-xs text-white/40 italic">빈 선반 — 재료를 추가해보세요</span>
                        }
                      </div>
                          <div className="h-2.5" style={{
                            background: 'linear-gradient(180deg, rgba(70,120,170,0.90) 0%, rgba(50,90,140,0.90) 100%)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ── 팬트리 (상온 + 기타) ── */}
              <div className="rounded-2xl overflow-hidden">
                {/* 상온 섹션 */}
                <div style={{ background: 'linear-gradient(180deg, rgba(255,245,220,0.82) 0%, rgba(250,232,195,0.82) 100%)' }}>
                  <FridgeShelf
                    label="상온"
                    icon="🌡️"
                    items={groupItems['상온'] || []}
                    onEdit={(id) => {
                      const ing = myIngredients.find(i => i.id === id);
                      if (ing) setEditingIngredient(ing);
                    }}
                    onDelete={removeIngredient}
                    onMove={handleMoveRequest}
                    onAddClick={handleSectionAdd}
                    warm
                    shoppingMode={shoppingMode}
                    selectedForShopping={selectedForShopping}
                    onToggleShoppingSelect={toggleShoppingSelect}
                  />
                </div>
                {/* 선반 플랭크 */}
                <div className="h-3.5" style={{
                  background: 'linear-gradient(180deg, #c8944a 0%, #9a7035 100%)',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.65)',
                }} />

                {/* 기타 섹션 */}
                <div style={{ background: 'linear-gradient(180deg, rgba(235,232,225,0.80) 0%, rgba(220,216,208,0.80) 100%)' }}>
                  <FridgeShelf
                    label="기타"
                    icon="📦"
                    items={groupItems['기타'] || []}
                    onEdit={(id) => {
                      const ing = myIngredients.find(i => i.id === id);
                      if (ing) setEditingIngredient(ing);
                    }}
                    onDelete={removeIngredient}
                    onMove={handleMoveRequest}
                    onAddClick={handleSectionAdd}
                    stone
                    shoppingMode={shoppingMode}
                    selectedForShopping={selectedForShopping}
                    onToggleShoppingSelect={toggleShoppingSelect}
                  />
                </div>
                {/* 선반 플랭크 */}
                <div className="h-3.5" style={{
                  background: 'linear-gradient(180deg, #b08040 0%, #886030 100%)',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.65)',
                }} />
              </div>


            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-white/5 py-20 text-center">
              <p className="text-text-muted text-lg mb-4">{t.ingredientPage.noCategoryIngredients}</p>
              <p className="text-text-muted text-sm">{t.ingredientPage.noCategoryHint}</p>
              <button
                onClick={() => setSelectedCategories([])}
                className="mt-4 px-4 py-2 rounded-xl bg-accent-warm/20 text-accent-warm hover:bg-accent-warm/30 transition-colors"
              >
                {t.common.viewAll}
              </button>
            </div>
          )}
        </section>

        {/* 도움말 */}
        <section className="mb-8">
          <div className="rounded-2xl bg-background-secondary/30 p-6 border border-white/5">
            <h3 className="font-semibold text-text-secondary mb-3 text-sm">{t.ingredientPage.tipTitle}</h3>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              <li>• {t.ingredientPage.tipClick}</li>
              <li>• {t.ingredientPage.tipExpiry}</li>
              <li className="flex items-center gap-1.5 flex-wrap">
                <span>• {t.ingredientPage.tipAutoComplete}</span>
                <Link href="/recommendations" className="text-accent-warm hover:text-accent-hover transition-colors font-medium">→ 레시피 추천</Link>
              </li>
            </ul>
          </div>
        </section>
      </main>

      {/* 하단 고정 버튼 */}
      {myIngredients.length > 0 && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-20">
          {shoppingMode ? (
            <button
              onClick={addToShoppingList}
              disabled={selectedForShopping.length === 0 || addingToShoppingList}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold shadow-[0_10px_30px_rgba(255,153,102,0.3)] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-accent-warm hover:bg-accent-hover text-background-primary"
            >
              🛒 장보기 목록에 추가
              {selectedForShopping.length > 0 && (
                <span className="ml-1 bg-background-primary/20 rounded-full px-2 py-0.5 text-sm">
                  {selectedForShopping.length}개
                </span>
              )}
            </button>
          ) : (
            <Link
              href="/recommendations"
              className="flex w-full items-center justify-center rounded-2xl bg-accent-warm py-4 text-lg font-bold text-background-primary shadow-[0_10px_30px_rgba(255,153,102,0.3)] hover:bg-accent-hover transition-colors"
            >
              {t.ingredientPage.findRecipe} ({myIngredients.length})
            </Link>
          )}
        </div>
      )}

      {/* 수정 모달 */}
      {editingIngredient && (
        <IngredientDetailModal
          ingredient={editingIngredient}
          isOpen={!!editingIngredient}
          onClose={() => setEditingIngredient(null)}
          onUpdate={updateIngredient}
        />
      )}

      {/* 재료 추가 모달 */}
      <AddIngredientModal
        isOpen={addModalOpen}
        location={addModalLocation}
        onClose={() => setAddModalOpen(false)}
        onAddIngredient={addIngredient}
        onAddFromPhoto={addIngredientsFromPhoto}
      />

      {/* 이동 팝업 */}
      {movingIngredient && (
        <MovePopup
          ingredientId={movingIngredient.id}
          ingredientName={movingIngredient.name}
          currentLocation={movingIngredient.currentLocation}
          onMove={moveIngredient}
          onDelete={removeIngredient}
          onClose={() => setMovingIngredient(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}
