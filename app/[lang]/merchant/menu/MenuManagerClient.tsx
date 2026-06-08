'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import ConfirmDialog from '@/components/Common/ConfirmDialog';

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  is_popular: boolean;
  sort_order: number;
}

interface Props {
  restaurantId: string;
  restaurantName: string;
}

export default function MenuManagerClient({ restaurantId, restaurantName }: Props) {
  const { t, language } = useI18n();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);
  // 카테고리·아이템 삭제 confirm 통합 — 단일 ConfirmDialog로 양쪽 처리.
  const [pendingDelete, setPendingDelete] = useState<{ type: 'category' | 'item'; id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 데이터 계층 이전(docs/DATA_LAYER.md): 직접 supabase read 2개 → 서버 엔드포인트.
  // 소유 식당은 owner_id 로 서버가 재유도하므로 restaurantId 전달 불필요(쓰기엔 계속 사용).
  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/delivery/merchant/menu');
      if (res.ok) {
        const { categories: catData, items: itemData } = await res.json();
        setCategories(catData ?? []);
        setItems(itemData ?? []);
      } else {
        const msg = await res.json().then((b) => b.error).catch(() => String(res.status));
        setError(msg ?? 'Failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    const { error: err } = await supabase
      .from('delivery_menu_categories')
      .insert({ restaurant_id: restaurantId, name: newCategoryName.trim(), sort_order: categories.length });
    if (err) setError(err.message);
    else {
      setNewCategoryName('');
      load();
    }
  }

  function deleteCategory(id: string) {
    setPendingDelete({ type: 'category', id });
  }

  async function addItem(categoryId: string | null, name: string, price: number, description: string) {
    if (!name.trim() || price <= 0) return;
    const { error: err } = await supabase.from('delivery_menu_items').insert({
      restaurant_id: restaurantId,
      category_id: categoryId,
      name: name.trim(),
      description: description || null,
      price,
      sort_order: items.filter((i) => i.category_id === categoryId).length,
    });
    if (err) setError(err.message);
    else load();
  }

  async function toggleSoldOut(item: MenuItem) {
    const { error: err } = await supabase
      .from('delivery_menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);
    if (err) setError(err.message);
    else load();
  }

  function deleteItem(id: string) {
    setPendingDelete({ type: 'item', id });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const table = pendingDelete.type === 'category' ? 'delivery_menu_categories' : 'delivery_menu_items';
    const { error: err } = await supabase.from(table).delete().eq('id', pendingDelete.id);
    setDeleting(false);
    if (err) {
      setError(err.message);
    } else {
      load();
    }
    setPendingDelete(null);
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t.merchant.navMenu}</h1>
        <p className="text-text-muted text-sm">{restaurantName}</p>
      </header>

      {/* Add category */}
      <div className="flex items-center gap-2 mb-6">
        <InputBoxWrapper className="flex-1 !bg-background-secondary !rounded-lg !px-3 !py-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={t.merchant.menuCategoryName}
            className={INPUT_INNER_COMFORTABLE_CLASS}
            style={INPUT_INNER_STYLE}
            data-testid="new-category-name"
          />
        </InputBoxWrapper>
        <button
          type="button"
          onClick={addCategory}
          disabled={!newCategoryName.trim()}
          className="px-4 py-2 rounded-lg bg-accent-warm text-background-primary font-bold disabled:opacity-40"
          data-testid="add-category"
        >
          + {t.merchant.menuCategoryAdd}
        </button>
      </div>

      {error && (
        <div className="text-sm text-error bg-error/10 rounded-lg p-3 mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {categories.length === 0 && (
            <p className="text-center text-text-muted py-8">카테고리를 먼저 추가해주세요</p>
          )}
          {categories.map((cat) => (
            <CategoryBlock
              key={cat.id}
              category={cat}
              items={items.filter((i) => i.category_id === cat.id)}
              onDelete={() => deleteCategory(cat.id)}
              onAddItem={(name, price, desc) => addItem(cat.id, name, price, desc)}
              onToggleSoldOut={toggleSoldOut}
              onDeleteItem={deleteItem}
              language={language}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={t.merchant.deleteConfirm}
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => { if (!deleting) setPendingDelete(null); }}
      />
    </div>
  );
}

function CategoryBlock({
  category,
  items,
  onDelete,
  onAddItem,
  onToggleSoldOut,
  onDeleteItem,
  language,
}: {
  category: Category;
  items: MenuItem[];
  onDelete: () => void;
  onAddItem: (name: string, price: number, desc: string) => void;
  onToggleSoldOut: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  language: string;
}) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', price: 0, description: '' });

  function submit() {
    if (!form.name.trim() || form.price <= 0) return;
    onAddItem(form.name, form.price, form.description);
    setForm({ name: '', price: 0, description: '' });
    setAdding(false);
  }

  return (
    <section data-testid={`category-${category.id}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">{category.name}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAdding(!adding)}
            className="text-xs px-3 py-1.5 rounded-lg bg-accent-warm/20 text-accent-warm font-bold hover:bg-accent-warm/30"
            data-testid={`add-item-${category.id}`}
          >
            + {t.merchant.menuItemAdd}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs px-3 py-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20"
          >
            ✕
          </button>
        </div>
      </div>

      {adding && (
        <div className="rounded-xl bg-background-secondary border border-accent-warm/40 p-3 mb-3 space-y-2">
          <InputBoxWrapper className="!bg-background-tertiary !rounded-lg !px-3 !py-2">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t.merchant.menuItemName}
              className={INPUT_INNER_COMFORTABLE_CLASS}
              style={INPUT_INNER_STYLE}
              data-testid={`new-item-name-${category.id}`}
            />
          </InputBoxWrapper>
          <div className="grid grid-cols-2 gap-2">
            <InputBoxWrapper className="!bg-background-tertiary !rounded-lg !px-3 !py-2">
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
                placeholder={t.merchant.menuItemPrice}
                className={INPUT_INNER_COMFORTABLE_CLASS}
                style={INPUT_INNER_STYLE}
                data-testid={`new-item-price-${category.id}`}
              />
            </InputBoxWrapper>
          </div>
          <InputBoxWrapper className="!bg-background-tertiary !rounded-lg !px-3 !py-2">
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t.merchant.menuItemDesc}
              className={INPUT_INNER_COMFORTABLE_CLASS}
              style={INPUT_INNER_STYLE}
            />
          </InputBoxWrapper>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              className="px-4 py-2 rounded-lg bg-accent-warm text-background-primary font-bold text-sm"
              data-testid={`save-item-${category.id}`}
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-4 py-2 rounded-lg bg-background-tertiary text-text-secondary text-sm"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-white/10 rounded-xl bg-background-secondary border border-white/10 overflow-hidden">
        {items.map((item) => (
          <li key={item.id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">
                {item.name}
                {!item.is_available && (
                  <span className="ml-2 text-xs text-text-muted">({t.merchant.menuItemSoldOut})</span>
                )}
              </div>
              {item.description && (
                <div className="text-xs text-text-muted line-clamp-1">{item.description}</div>
              )}
              <div className="text-sm text-accent-warm font-bold">
                {new Intl.NumberFormat(language).format(item.price)}원
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleSoldOut(item)}
              className={`px-2 py-1 rounded text-xs ${
                item.is_available
                  ? 'bg-background-tertiary text-text-muted'
                  : 'bg-warning/20 text-warning'
              }`}
            >
              {item.is_available ? '품절 처리' : '판매 재개'}
            </button>
            <button
              type="button"
              onClick={() => onDeleteItem(item.id)}
              className="p-2 text-text-muted hover:text-error"
            >
              ✕
            </button>
          </li>
        ))}
        {items.length === 0 && !adding && (
          <li className="p-3 text-text-muted text-sm">메뉴 없음</li>
        )}
      </ul>
    </section>
  );
}
