'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { useToast } from '@/lib/toast/context';
import { getIngredientEmoji } from '@/lib/utils/ingredientEmoji';
import AddIngredientModal from '@/components/Ingredients/AddIngredientModal';

// ── 카테고리별 pill 색상 (냉장고 페이지와 동일) ──────────────────────────

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

// ── 만료 상태 ────────────────────────────────────────────────────────────

function getExpiryStatus(expiryDate: string | null | undefined) {
  if (!expiryDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate); expiry.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { text: '만료', level: 'critical' as const };
  if (days === 0) return { text: 'D-Day', level: 'critical' as const };
  if (days <= 3) return { text: `D-${days}`, level: 'critical' as const };
  if (days <= 7) return { text: `D-${days}`, level: 'warning' as const };
  return null;
}

// ── 타입 ─────────────────────────────────────────────────────────────────

interface FridgeItem {
  id: string;
  ingredient_name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  storage_location: string;
  expiry_date: string | null;
}

interface Suggestion {
  id: string;
  name: string;
  category: string;
}

// ── IngredientPill (냉장고 페이지 동일 스타일) ────────────────────────────

function IngredientPill({
  item,
  freezer = false,
  onDelete,
}: {
  item: FridgeItem;
  freezer?: boolean;
  onDelete: (id: string) => void;
}) {
  const icon = getIngredientEmoji(item.ingredient_name, item.category);
  const expiry = getExpiryStatus(item.expiry_date);

  const pillColor = (() => {
    if (expiry?.level === 'critical') {
      return freezer
        ? 'bg-red-200/60 text-red-800 ring-1 ring-red-300/50'
        : 'bg-red-50/80 text-red-700 ring-1 ring-red-300/50';
    }
    if (expiry?.level === 'warning') {
      return freezer
        ? 'bg-yellow-200/60 text-yellow-800 ring-1 ring-yellow-300/50'
        : 'bg-yellow-50/80 text-yellow-700 ring-1 ring-yellow-300/50';
    }
    if (freezer) return CATEGORY_PILL_FREEZER[item.category] ?? 'bg-white/25 text-[#2a4a6a] ring-1 ring-white/20';
    return CATEGORY_PILL_LIGHT[item.category] ?? 'bg-slate-50/80 text-slate-600 ring-1 ring-slate-200/40';
  })();

  return (
    <div
      className={`group/pill relative inline-flex items-center gap-1.5 px-3 py-1.5 mr-2 mb-1 rounded-xl text-sm select-none transition-all hover:scale-[1.06] hover:shadow-lg ${pillColor}`}
    >
      <span className="text-base">{icon}</span>
      <span className="truncate max-w-[80px] font-medium">{item.ingredient_name}</span>
      {expiry && <span className="text-[10px] font-bold flex-shrink-0">{expiry.text}</span>}
      <button
        onClick={e => { e.stopPropagation(); onDelete(item.id); }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-all z-10 opacity-0 scale-75 group-hover/pill:opacity-100 group-hover/pill:scale-100"
        aria-label="삭제"
      >
        ✕
      </button>
    </div>
  );
}

// ── Section (냉장고 페이지 동일 스타일) ──────────────────────────────────

function Section({
  icon, label, labelColor, countColor, items, freezer = false,
  emptyBorderClass, emptyTextColor,
  onDelete, onAddClick,
}: {
  icon: string;
  label: string;
  labelColor: string;
  countColor: string;
  items: FridgeItem[];
  freezer?: boolean;
  emptyBorderClass: string;
  emptyTextColor: string;
  onDelete: (id: string) => void;
  onAddClick: () => void;
}) {
  return (
    <div>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={`text-base ${labelColor}`}>{icon}</span>
          <span className={`text-sm font-bold ${labelColor}`}>{label}</span>
          <span className={`text-xs ${countColor}`}>({items.length})</span>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold text-background-primary bg-accent-warm hover:bg-accent-hover active:scale-95 transition-colors"
        >
          + 추가
        </button>
      </div>

      {/* 재료 또는 빈 상태 */}
      {items.length === 0 ? (
        <div className={`mx-4 mb-3 flex items-center justify-center border border-dashed rounded-xl min-h-[64px] ${emptyBorderClass}`}>
          <span className={`text-xs ${emptyTextColor}`}>비어있음</span>
        </div>
      ) : (
        <div className="px-4 pb-3 pt-1 flex flex-wrap min-h-[44px]">
          {items.map(item => (
            <IngredientPill key={item.id} item={item} freezer={freezer} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── FridgeDropdown ────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FridgeDropdown({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [items, setItems] = useState<FridgeItem[]>([]);

  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [adding, setAdding] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  // 어떤 섹션의 "+ 추가"를 눌렀는지 추적
  const [pendingLocation, setPendingLocation] = useState('냉장');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalLocation, setAddModalLocation] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    try {
      const client = createClient();
      const { data } = await client
        .from('user_ingredients')
        .select('id, ingredient_name, category, quantity, unit, storage_location, expiry_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setItems(data || []);
    } catch {
      // silent
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    } else {
      setInputText('');
      setSuggestions([]);
      setShowSuggestions(false);
      setPendingLocation('냉장');
    }
  }, [isOpen, fetchItems]);

  // 자동완성 (300ms 디바운스)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = inputText.trim();
    if (!trimmed) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ingredients/autocomplete?q=${encodeURIComponent(trimmed)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch { /* silent */ }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputText]);

  const addItem = async (name: string, category = '', location = pendingLocation) => {
    if (!name.trim() || adding || !user) return;
    setAdding(true);
    try {
      const client = createClient();
      const { error } = await client.from('user_ingredients').insert({
        user_id: user.id,
        ingredient_name: name.trim(),
        category: category || 'other',
        storage_location: location,
      });
      if (!error) {
        setInputText('');
        setSuggestions([]);
        setShowSuggestions(false);
        window.dispatchEvent(new Event('fridge-updated'));
        await fetchItems();
        toastSuccess(`${name.trim()} 추가됐어요!`);
      }
    } catch {
      toastError('추가에 실패했어요.');
    } finally {
      setAdding(false);
    }
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    const client = createClient();
    await client.from('user_ingredients').delete().eq('id', id);
    window.dispatchEvent(new Event('fridge-updated'));
  };

  // 섹션의 + 추가 버튼 클릭 → AddIngredientModal 열기
  const handleSectionAdd = (location: string) => {
    setAddModalLocation(location);
    setAddModalOpen(true);
  };

  // AddIngredientModal에서 재료 추가
  const handleModalAdd = async (formData: {
    ingredient_name: string;
    category: string;
    quantity: number | null;
    unit: string;
    purchase_date: string;
    expiry_date: string;
    storage_location: string;
    notes: string;
    expiry_alert: boolean;
  }) => {
    if (!user) return;
    try {
      const client = createClient();
      const { error } = await client.from('user_ingredients').insert({
        user_id: user.id,
        ingredient_name: formData.ingredient_name,
        category: formData.category || 'other',
        quantity: formData.quantity,
        unit: formData.unit !== '선택' ? formData.unit : null,
        purchase_date: formData.purchase_date || null,
        expiry_date: formData.expiry_date || null,
        storage_location: formData.storage_location,
        notes: formData.notes || null,
        expiry_alert: formData.expiry_alert,
      });
      if (!error) {
        window.dispatchEvent(new Event('fridge-updated'));
        await fetchItems();
        toastSuccess(`${formData.ingredient_name} 추가됐어요!`);
        setAddModalOpen(false);
      }
    } catch {
      toastError('추가에 실패했어요.');
    }
  };

  // 사진/영수증으로 재료 추가
  const handlePhotoAdd = async (labels: { name: string; category: string; quantity?: number | null; unit?: string; storage_location?: string; expiry_date?: string; purchase_date?: string; notes?: string; expiry_alert?: boolean }[]) => {
    if (!user) return;
    try {
      const client = createClient();
      const rows = labels.map(l => ({
        user_id: user.id,
        ingredient_name: l.name,
        category: l.category || 'other',
        quantity: l.quantity ?? null,
        unit: l.unit || null,
        purchase_date: l.purchase_date || null,
        expiry_date: l.expiry_date || null,
        storage_location: l.storage_location || addModalLocation || '냉장',
        notes: l.notes || null,
        expiry_alert: l.expiry_alert ?? false,
      }));
      const { error } = await client.from('user_ingredients').insert(rows);
      if (!error) {
        window.dispatchEvent(new Event('fridge-updated'));
        await fetchItems();
        toastSuccess(`${labels.length}개 재료가 추가됐어요!`);
        setAddModalOpen(false);
      }
    } catch {
      toastError('추가에 실패했어요.');
    }
  };

  // 검색 필터 + 저장위치별 그룹핑 (기타 별도 유지)
  const grouped = useMemo(() => {
    const filtered = inputText.trim()
      ? items.filter(i => i.ingredient_name.toLowerCase().includes(inputText.toLowerCase()))
      : items;
    return {
      냉장: filtered.filter(i => i.storage_location === '냉장'),
      냉동: filtered.filter(i => i.storage_location === '냉동'),
      상온: filtered.filter(i => i.storage_location === '상온'),
      기타: filtered.filter(i => !i.storage_location || i.storage_location === '기타'),
    };
  }, [items, inputText]);

  const hasNoResults = inputText.trim() &&
    grouped.냉장.length === 0 && grouped.냉동.length === 0 &&
    grouped.상온.length === 0 && grouped.기타.length === 0;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-1rem)] rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col"
        style={{ maxHeight: '40rem' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <span className="font-bold text-sm flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="60" height="92" rx="6" fill="#5BA8B5" stroke="#111" strokeWidth="5"/>
              <rect x="4" y="4" width="28" height="62" rx="6" fill="#4A8F9C"/>
              <rect x="4" y="66" width="60" height="4" fill="#111"/>
              <rect x="9" y="14" width="17" height="10" rx="2" fill="#F5C842" stroke="#111" strokeWidth="2.5"/>
              <rect x="32" y="4" width="32" height="62" fill="#A8DDE8"/>
              <rect x="55" y="12" width="3" height="16" rx="1" fill="#111" opacity="0.4"/>
              <rect x="59" y="12" width="3" height="16" rx="1" fill="#111" opacity="0.4"/>
              <ellipse cx="47" cy="30" rx="7" ry="5" fill="#C8925A" stroke="#111" strokeWidth="2"/>
              <path d="M42 42 L52 42 L50 50 L44 50 Z" fill="#B07840" stroke="#111" strokeWidth="2"/>
              <rect x="42" y="52" width="4" height="8" rx="1" fill="#E07070" stroke="#111" strokeWidth="2"/>
              <rect x="48" y="52" width="4" height="8" rx="1" fill="#E07070" stroke="#111" strokeWidth="2"/>
              <rect x="64" y="4" width="20" height="62" rx="4" fill="#5BA8B5" stroke="#111" strokeWidth="4"/>
              <rect x="68" y="18" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
              <rect x="68" y="26" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
              <rect x="68" y="34" width="10" height="3" rx="1.5" fill="#111" opacity="0.3"/>
              <rect x="28" y="20" width="8" height="14" rx="4" fill="#111"/>
              <rect x="28" y="42" width="8" height="14" rx="4" fill="#111"/>
              <rect x="4" y="70" width="60" height="26" rx="6" fill="#5BA8B5"/>
              <rect x="28" y="80" width="12" height="6" rx="3" fill="#111"/>
            </svg>
            냉장고{' '}
            {items.length > 0 && <span className="text-accent-warm">({items.length})</span>}
          </span>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors text-base" aria-label="닫기">✕</button>
        </div>

        {/* 재료 추가 입력창 */}
        <div className="relative px-3 py-2.5 border-b border-white/10 flex-shrink-0">
          {/* 현재 추가될 위치 표시 */}
          <div className="text-[10px] text-text-muted mb-1.5 px-1">
            추가 위치: <span className="text-accent-warm font-semibold">{pendingLocation}</span>
          </div>
          <div
            className={`relative w-full flex items-center overflow-hidden bg-background-secondary transition-all duration-300 rounded-xl [&>*]:!border-0 ${
              inputFocused
                ? 'ring-2 ring-accent-warm shadow-[0_0_20px_rgba(255,153,102,0.3)] scale-[1.01]'
                : 'ring-1 ring-white/10 shadow-[0_0_10px_rgba(255,153,102,0.15)]'
            }`}
            style={{ border: 'none' }}
          >
            <span className="pl-3 text-text-muted text-sm flex-shrink-0" style={{ border: 'none' }}>🔍</span>
            <input
              ref={inputRef}
              type="search"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && inputText.trim()) { e.preventDefault(); addItem(inputText); }
                if (e.key === 'Escape') { setInputText(''); setShowSuggestions(false); }
              }}
              onFocus={() => { setInputFocused(true); if (suggestions.length > 0) setShowSuggestions(true); }}
              onBlur={() => setInputFocused(false)}
              placeholder="재료 검색 또는 직접 추가..."
              className="w-full bg-transparent text-text-primary placeholder-text-muted !outline-none !border-0 !border-none px-2 py-2 text-sm"
              style={{ border: 'none', outline: 'none' }}
            />
            {adding ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-warm border-t-transparent flex-shrink-0 mr-3" />
            ) : (
              <button
                onMouseDown={() => inputText.trim() && addItem(inputText)}
                disabled={!inputText.trim()}
                className="flex-shrink-0 mr-2 px-3 py-1.5 text-xs rounded-lg bg-accent-warm font-semibold text-background-primary transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed !outline-none !border-0"
                style={{ border: 'none' }}
              >
                추가
              </button>
            )}
          </div>

          {/* 자동완성 */}
          {showSuggestions && inputText.trim() && (
            <div className="absolute left-3 right-3 top-full mt-1 rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-10 overflow-hidden">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onMouseDown={() => addItem(s.name, s.category)}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <span className="text-accent-warm flex-shrink-0">+</span>
                  <span className="text-text-primary flex-1 truncate">{s.name}</span>
                  {s.category && <span className="text-text-muted">{s.category}</span>}
                </button>
              ))}
              <button
                onMouseDown={() => addItem(inputText)}
                className="w-full text-left px-4 py-2.5 text-xs hover:bg-accent-warm/10 transition-colors flex items-center gap-2 border-t border-white/5"
              >
                <span className="text-accent-warm flex-shrink-0">+</span>
                <span className="text-accent-warm font-medium truncate">&ldquo;{inputText}&rdquo; 직접 추가</span>
              </button>
            </div>
          )}
        </div>

        {/* 냉장고 시각 디자인 */}
        <div className="overflow-y-auto flex-1">
          {hasNoResults ? (
            <div className="text-center py-8 px-4">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-xs text-text-muted">&ldquo;{inputText}&rdquo;와 일치하는 재료가 없어요</p>
            </div>
          ) : (
            <div>
              {/* ── 냉장고 캐비넷 (냉장 + 냉동) ── */}
              <div className="m-3 rounded-2xl overflow-hidden">
                {/* 냉장 */}
                <div style={{ background: 'linear-gradient(180deg, rgba(244,249,255,0.78) 0%, rgba(226,240,252,0.78) 100%)' }}>
                  <Section
                    icon="❄️" label="냉장"
                    labelColor="text-[#4a7a9a]" countColor="text-[#7aa8c0]"
                    items={grouped.냉장}
                    emptyBorderClass="border-sky-300/40" emptyTextColor="text-[#7aa8c0]/70"
                    onDelete={deleteItem}
                    onAddClick={() => handleSectionAdd('냉장')}
                  />
                  {/* 선반 구분선 */}
                  <div className="h-2.5" style={{
                    background: 'linear-gradient(180deg, #8ab4d4 0%, #6a94b4 100%)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  }} />
                </div>

                {/* 냉동 */}
                <div style={{ background: 'linear-gradient(180deg, rgba(141,189,224,0.72) 0%, rgba(106,158,200,0.72) 100%)' }}>
                  <Section
                    icon="🧊" label="냉동"
                    labelColor="text-[#1a3a6a]" countColor="text-[#2a5a9a]/70"
                    items={grouped.냉동}
                    freezer
                    emptyBorderClass="border-white/30" emptyTextColor="text-white/40"
                    onDelete={deleteItem}
                    onAddClick={() => handleSectionAdd('냉동')}
                  />
                </div>
              </div>

              {/* ── 팬트리 (상온 + 기타) ── */}
              <div className="mx-3 mb-3 rounded-2xl overflow-hidden">
                {/* 상온 */}
                <div style={{ background: 'linear-gradient(180deg, rgba(255,245,220,0.82) 0%, rgba(250,232,195,0.82) 100%)' }}>
                  <Section
                    icon="🌡️" label="상온"
                    labelColor="text-amber-700" countColor="text-amber-500/70"
                    items={grouped.상온}
                    emptyBorderClass="border-amber-400/30" emptyTextColor="text-amber-500/50"
                    onDelete={deleteItem}
                    onAddClick={() => handleSectionAdd('상온')}
                  />
                </div>
                {/* 나무 선반 플랭크 */}
                <div className="h-3" style={{
                  background: 'linear-gradient(180deg, #c8944a 0%, #9a7035 100%)',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.65)',
                }} />

                {/* 기타 */}
                <div style={{ background: 'linear-gradient(180deg, rgba(235,232,225,0.80) 0%, rgba(220,216,208,0.80) 100%)' }}>
                  <Section
                    icon="📦" label="기타"
                    labelColor="text-stone-600" countColor="text-stone-500/60"
                    items={grouped.기타}
                    emptyBorderClass="border-stone-400/30" emptyTextColor="text-stone-500/50"
                    onDelete={deleteItem}
                    onAddClick={() => handleSectionAdd('기타')}
                  />
                </div>
                {/* 나무 선반 플랭크 */}
                <div className="h-3" style={{
                  background: 'linear-gradient(180deg, #b08040 0%, #886030 100%)',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.65)',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* 하단 링크 */}
        <div className="border-t border-white/10 px-4 py-3 flex-shrink-0">
          <Link
            href="/fridge"
            onClick={onClose}
            className="block w-full py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-center text-xs text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
          >
            냉장고 전체보기 →
          </Link>
        </div>
      </div>

      {/* 재료 추가 모달 */}
      <AddIngredientModal
        isOpen={addModalOpen}
        location={addModalLocation}
        onClose={() => setAddModalOpen(false)}
        onAddIngredient={handleModalAdd}
        onAddFromPhoto={handlePhotoAdd}
      />
    </>
  );
}

// ── useFridgeCount ────────────────────────────────────────────────────────

export function useFridgeCount() {
  const { user } = useAuth();
  const [expiringCount, setExpiringCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const client = createClient();
      const { data } = await client
        .from('user_ingredients')
        .select('id, expiry_date')
        .eq('user_id', user.id);
      if (!data) return;
      setTotalCount(data.length);
      setExpiringCount(data.filter(i => getExpiryStatus(i.expiry_date) !== null).length);
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCount();
    const handler = () => fetchCount();
    window.addEventListener('fridge-updated', handler);
    return () => window.removeEventListener('fridge-updated', handler);
  }, [fetchCount]);

  return { expiringCount, totalCount, refetch: fetchCount };
}
