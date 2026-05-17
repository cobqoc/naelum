import Link from '@/components/Common/LocalizedLink';
import type { TranslationKeys } from '@/lib/i18n/translations';
import type { ShoppingItem } from '@/lib/shopping-list/cache';
import type { GroupedItems, GroupMode } from '@/lib/shopping-list/groupItems';
import { COMMON_UNITS } from '@/components/cart/types';

/**
 * cart 항목 리스트 — 그룹 헤더·항목 행·수량 스테퍼·단위·메모 에디터 (순수 표현).
 *
 * god-file(ShoppingCartDropdown) 분해 Phase 2 의 최대·최고위험 블록.
 * ⚠️ 메모 optimistic clobber race 방어(pendingNoteEditIdsRef·applyServerItems·
 * updateNote)는 전부 *부모* 소유. 이 컴포넌트는 그 핸들러들을 props 로 받아
 * 호출만 한다 — race 로직 미이동 = 행위 변경 0. JSX·className·핸들러
 * 시그니처 원본과 byte-identical. 회귀 가드: cart-note.spec.ts(메모 race),
 * cart.spec.ts(체크/스테퍼/단위/삭제/owned), recipe-cart-toggle 등.
 */

interface CartItemListProps {
  t: TranslationKeys;
  loading: boolean;
  items: ShoppingItem[];
  filteredItems: ShoppingItem[];
  inputText: string;
  groups: GroupedItems[];
  groupMode: GroupMode;
  editingNoteId: string | null;
  setEditingNoteId: (id: string | null) => void;
  editingNoteValue: string;
  setEditingNoteValue: (v: string) => void;
  toggleCheck: (item: ShoppingItem) => void;
  updateQuantity: (item: ShoppingItem, delta: number) => void;
  updateUnit: (item: ShoppingItem, unit: string) => void;
  deleteItem: (id: string) => void;
  updateNote: (item: ShoppingItem, rawNote: string) => Promise<void>;
  onClose: () => void;
}

export default function CartItemList({
  t,
  loading,
  items,
  filteredItems,
  inputText,
  groups,
  groupMode,
  editingNoteId,
  setEditingNoteId,
  editingNoteValue,
  setEditingNoteValue,
  toggleCheck,
  updateQuantity,
  updateUnit,
  deleteItem,
  updateNote,
  onClose,
}: CartItemListProps) {
  return (
    <div data-testid="cart-list" className="overflow-y-auto flex-1">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-warm border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        // 빈 상태 — quick-add는 위에서 항상 노출되므로 placeholder만 표시
        <div className="text-center py-10 px-4">
          <div className="text-3xl mb-2">🛒</div>
          <p className="text-xs text-text-muted">{t.cart.emptyHint}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8 px-4">
          <div className="text-2xl mb-2">🔍</div>
          <p className="text-xs text-text-muted">{t.cart.noMatchHint.replace('{q}', inputText)}</p>
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.groupKey}>
              <div className="px-4 py-2 bg-white/5 flex items-center gap-2">
                <span className="text-sm">{group.groupIcon}</span>
                <span className="text-xs font-medium text-text-secondary truncate">
                  {groupMode === 'category'
                    ? (t.cart.categoryLabels[group.groupKey as keyof typeof t.cart.categoryLabels] ?? group.groupTitle)
                    : group.groupKey === '__manual__' ? t.cart.manualAdd : group.groupTitle}
                </span>
                <span className="text-[10px] text-text-muted ml-auto">
                  {group.items.filter(i => i.is_checked).length}/{group.items.length}
                </span>
              </div>
              {group.items.map(item => (
                <div
                  key={item.id}
                  className="px-4 py-2 hover:bg-white/5 active:bg-white/10 transition-colors group select-none"
                >
                <div
                  onClick={() => toggleCheck(item)}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  {/* 체크 인디케이터 */}
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      item.is_checked
                        ? 'bg-accent-warm'
                        : 'border-2 border-white/25 group-hover:border-accent-warm/60'
                    }`}
                  >
                    {item.is_checked && (
                      <svg className="w-3 h-3 text-background-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <span className={`text-sm truncate ${item.is_checked ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {item.ingredient_name}
                    </span>
                    {/* #1 보유 재료 배지 — 미체크 항목에만 (체크 후엔 곧 냉장고로 갈 거라 노이즈) */}
                    {item.is_owned && !item.is_checked && (
                      <span
                        className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-info/15 text-info text-[10px] font-medium"
                        title={t.cart.alreadyOwned}
                      >
                        <span aria-hidden="true">❄️</span>
                        <span>{t.cart.alreadyOwned}</span>
                      </span>
                    )}
                  </div>

                  {/* 수량 스테퍼 + 단위 통합 [−][수량 | 단위 ▾][+] — DetailFields와 일관 */}
                  {!item.is_checked ? (
                    <div className="inline-flex items-center rounded-lg border border-white/10 bg-background-tertiary overflow-hidden flex-shrink-0 h-7">
                      <button
                        onClick={e => { e.stopPropagation(); updateQuantity(item, -1); }}
                        disabled={(item.quantity ?? 1) <= 1}
                        className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-accent-warm hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                        aria-label={t.cart.quantityDecrease}
                      >
                        −
                      </button>
                      <span className="text-xs text-text-primary tabular-nums min-w-[1.5rem] px-1.5 text-center border-l border-white/10 h-7 leading-7">
                        {item.quantity ?? 1}
                      </span>
                      {/* 단위 드롭다운 — placeholder + 명시적 ▾ 화살표 */}
                      <div className="relative flex items-center border-l border-white/10 h-7">
                        <select
                          value={item.unit ?? ''}
                          onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); updateUnit(item, e.target.value); }}
                          aria-label={t.cart.unitLabel}
                          className="bg-transparent text-xs text-text-secondary appearance-none cursor-pointer outline-none pl-2 pr-5 h-full"
                        >
                          <option value="">{t.cart.unitLabel}</option>
                          {COMMON_UNITS.map(u => (
                            <option key={u} value={u}>{t.quickAdd.unitLabels[u as keyof typeof t.quickAdd.unitLabels] ?? u}</option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-1 text-text-muted text-[9px]">▾</span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); updateQuantity(item, 1); }}
                        className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-accent-warm hover:bg-white/5 transition-colors text-sm border-l border-white/10"
                        aria-label={t.cart.quantityIncrease}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    (item.quantity || item.unit) && (
                      <span className="text-xs text-text-muted flex-shrink-0">
                        {item.quantity}{item.unit}
                      </span>
                    )
                  )}

                  <button
                    onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                    className="flex-shrink-0 text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100 text-sm p-0.5"
                    aria-label="삭제"
                  >
                    🗑
                  </button>
                </div>

                {/* 메모 라인 — 체크박스 위치만큼 들여쓰기 (5+2.5=7.5 → ml-7.5 대신 pl-[1.875rem]) */}
                <div className="pl-[1.875rem] mt-0.5">
                  {editingNoteId === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingNoteValue}
                        onChange={e => setEditingNoteValue(e.target.value.slice(0, 200))}
                        onBlur={async () => {
                          const target = items.find(i => i.id === item.id);
                          if (target) await updateNote(target, editingNoteValue);
                          setEditingNoteId(null);
                          setEditingNoteValue('');
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          } else if (e.key === 'Escape') {
                            setEditingNoteId(null);
                            setEditingNoteValue('');
                          }
                        }}
                        autoFocus
                        maxLength={200}
                        placeholder={t.cart.notePlaceholder}
                        aria-label={t.cart.noteEditAria}
                        className="flex-1 min-w-0 bg-background-tertiary border border-white/15 rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-warm/60"
                      />
                      {/* ✓ 저장 — onMouseDown preventDefault로 input focus 유지, onClick으로 명시 저장 */}
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={async () => {
                          const target = items.find(i => i.id === item.id);
                          if (target) await updateNote(target, editingNoteValue);
                          setEditingNoteId(null);
                          setEditingNoteValue('');
                        }}
                        aria-label={t.cart.noteSaveAria}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-text-secondary hover:text-accent-warm hover:bg-white/5 transition-colors text-xs"
                      >
                        <span aria-hidden="true">✓</span>
                      </button>
                      {/* ✕ 취소 — 저장 없이 닫기 */}
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingNoteValue('');
                        }}
                        aria-label={t.cart.noteCancelAria}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-error hover:bg-white/5 transition-colors text-xs"
                      >
                        <span aria-hidden="true">✕</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 카테고리 모드 한정 — 어느 레시피용인지 표시 + 클릭 시 해당 레시피로 이동 */}
                      {groupMode === 'category' && item.recipe_id && item.recipe_title && (
                        <Link
                          href={`/recipes/${item.recipe_id}`}
                          onClick={e => {
                            e.stopPropagation();
                            if (typeof window !== 'undefined') {
                              sessionStorage.setItem('naelum_cart_restore', '1');
                            }
                            onClose();
                          }}
                          className={`inline-flex items-center gap-0.5 text-xs max-w-[15rem] transition-colors ${item.is_checked ? 'text-text-muted line-through hover:text-text-secondary' : 'text-text-muted hover:text-accent-warm hover:underline'}`}
                        >
                          <span aria-hidden="true">🍲</span>
                          <span className="truncate">{item.recipe_title}</span>
                          <span aria-hidden="true" className="opacity-70 ml-0.5">↗</span>
                        </Link>
                      )}
                      {/* divider — recipe chip + 우측에 메모(또는 + 메모) 둘 다 있을 때만 */}
                      {groupMode === 'category' && item.recipe_id && item.recipe_title && (item.note || !item.is_checked) && (
                        <span className="text-[10px] text-text-muted/50" aria-hidden="true">·</span>
                      )}
                      {/* 메모 */}
                      {item.note ? (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingNoteId(item.id);
                            setEditingNoteValue(item.note ?? '');
                          }}
                          aria-label={t.cart.noteEditAria}
                          className={`inline-flex items-center gap-1 text-xs ${item.is_checked ? 'text-text-muted line-through' : 'text-text-secondary'} hover:text-accent-warm transition-colors`}
                        >
                          <span aria-hidden="true">📝</span>
                          <span className="text-left">{item.note}</span>
                        </button>
                      ) : !item.is_checked ? (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingNoteId(item.id);
                            setEditingNoteValue('');
                          }}
                          className="inline-flex items-center text-[10px] text-text-muted hover:text-accent-warm transition-colors opacity-60 hover:opacity-100"
                        >
                          {t.cart.noteAddPrompt}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>

                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
