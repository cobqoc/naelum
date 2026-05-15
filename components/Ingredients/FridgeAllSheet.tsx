'use client';

import { useEffect, useRef, useState } from 'react';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useI18n } from '@/lib/i18n/context';
import { formatFreshLabel, type FreshLabelKind } from '@/app/[lang]/_home/helpers';

interface FridgeItem {
  id: string;
  ingredient_name: string;
  category: string;
  expiry_date: string | null;
  storage_location: string | null;
  purchase_date?: string | null;
  quantity?: number | null;
  unit?: string | null;
}

interface Props {
  isOpen: boolean;
  items: FridgeItem[];
  onClose: () => void;
  /** 재료 클릭 시 기존 액션 시트(만들기/수정/삭제) 오픈 */
  onItemClick: (item: FridgeItem) => void;
  /** chip hover X 클릭 시 빠른 삭제 (데스크톱) */
  onDelete: (item: FridgeItem) => void;
  /** freshState 계산 함수 (HomeClient에서 주입). category fallback을 위해 category 필드도 포함. */
  freshState: (item: Pick<FridgeItem, 'expiry_date' | 'purchase_date' | 'category'>) => {
    border: string; labelKind: FreshLabelKind; labelN: number; isDanger: boolean;
  };
  /** getEmoji 함수 주입 */
  getEmoji: (name: string, category: string) => string;
  /** 데모 칩 표시명 변환 — HomeClient의 getDisplayName 주입. 기본은 ingredient_name 그대로. */
  getDisplayName?: (item: { id: string; ingredient_name: string; isDemoItem?: boolean }) => string;
  /** 임박 재료만 표시 모드. items는 그대로 받되 시트 내부에서 isDanger 필터링.
   *  헤더 타이틀과 상단 매칭 pill 표시까지 함께 토글됨. */
  expiringOnly?: boolean;
  /** 매칭 pill 표시용 데이터 — null=로딩, 0=매칭없음, >0=숫자.
   *  expiringOnly=true일 때만 상단 노출. */
  recipeMatch?: { count: number | null; mode: 'ready' | 'almost' | 'all' | null } | null;
  /** 매칭 pill 탭 핸들러 — 일반적으로 /recommendations로 이동. */
  onCookFromExpiring?: () => void;
}

/**
 * +N 오버플로우 버튼 탭 시 열리는 전체 재료 리스트 시트.
 * 냉장/냉동/상온 별로 그룹핑, 각 chip 탭은 액션 시트로 연결.
 */
export default function FridgeAllSheet({
  isOpen, items, onClose, onItemClick, onDelete, freshState, getEmoji, getDisplayName,
  expiringOnly = false, recipeMatch = null, onCookFromExpiring,
}: Props) {
  const { t } = useI18n();
  const display = (item: FridgeItem) => getDisplayName?.(item) ?? item.ingredient_name;
  const GROUP_ORDER: { key: string; icon: string; label: string }[] = [
    { key: '냉장', icon: '❄️', label: t.fridge.refrigerator },
    { key: '냉동', icon: '🧊', label: t.fridge.freezer },
    { key: '상온', icon: '🌡', label: t.fridge.roomTemp },
  ];
  useEscapeKey(onClose, isOpen);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 같은 이름 그룹 클릭 시 미니 시트로 그룹 내 항목 목록 표시
  const [groupSheet, setGroupSheet] = useState<{ name: string; items: FridgeItem[] } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // 열릴 때 이전 포커스 기억 + 닫기 버튼에 포커스 이동
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    return () => {
      // 닫힐 때 이전 포커스 복원 (연결 해제 시에만 수행)
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  // 시트 닫힐 때 groupSheet도 닫음 — queueMicrotask로 cascading render 회피
  useEffect(() => {
    if (!isOpen) queueMicrotask(() => setGroupSheet(null));
  }, [isOpen]);

  if (!isOpen) return null;

  // 임박 모드: isDanger인 재료만 필터. 시트 내 그룹별 분류는 동일.
  const visibleItems = expiringOnly
    ? items.filter(i => freshState(i).isDanger)
    : items;

  // 그룹별 분류 (상온 + 기타 포함, null은 냉장으로)
  const groups: Record<string, FridgeItem[]> = { 냉장: [], 냉동: [], 상온: [] };
  for (const item of visibleItems) {
    const loc = item.storage_location;
    if (loc === '냉동') groups['냉동'].push(item);
    else if (loc === '상온' || loc === '기타') groups['상온'].push(item);
    else groups['냉장'].push(item); // 냉장 or null
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-background-secondary rounded-t-2xl md:rounded-2xl border-t md:border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85dvh]">
        {/* 핸들 (모바일) */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* 헤더 — 임박 모드면 ⚠️ 타이틀, 일반 모드면 🧺 전체 재료 목록 */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-sm">
            {expiringOnly
              ? <>⚠️ {t.home.expiringSheetTitle} <span className="text-text-muted font-normal">({t.fridge.ingredientCount.replace('{count}', String(visibleItems.length))})</span></>
              : <>🧺 {t.home.ingredientList} <span className="text-text-muted font-normal">({t.fridge.ingredientCount.replace('{count}', String(visibleItems.length))})</span></>
            }
          </h3>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all"
            aria-label={t.common.close}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 임박 모드 — 상단 매칭 pill (홈 추천 pill과 동일 패턴).
            로딩 중이면 shimmer, 매칭 0이면 "다른 레시피 보기" fallback. */}
        {expiringOnly && onCookFromExpiring && (
          <div className="px-4 pt-3 pb-2 border-b border-white/5">
            {(() => {
              const count = recipeMatch?.count ?? null;
              const mode = recipeMatch?.mode ?? null;
              if (count === null) {
                // 로딩
                return (
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-warm/60 text-background-primary text-sm font-bold animate-pulse">
                    <span aria-hidden="true">💡</span>
                    <span>{t.home.pillDefault}</span>
                  </div>
                );
              }
              if (count === 0 || !mode) {
                return (
                  <button
                    type="button"
                    onClick={onCookFromExpiring}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-background-tertiary hover:bg-white/10 text-text-secondary hover:text-text-primary text-sm font-bold transition-all active:scale-95"
                  >
                    <span>{t.home.expiringRecipeNone}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                );
              }
              const countStr = count >= 30 ? '30+' : String(count);
              const label = mode === 'ready'
                ? t.home.expiringRecipeReady.replace('{count}', countStr)
                : mode === 'almost'
                  ? t.home.expiringRecipeAlmost.replace('{count}', countStr)
                  : t.home.expiringRecipeNone;
              return (
                <button
                  type="button"
                  onClick={onCookFromExpiring}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-warm hover:bg-accent-hover text-background-primary text-sm font-bold shadow-lg shadow-accent-warm/40 transition-all active:scale-95"
                >
                  <span>{label}</span>
                  <span aria-hidden="true">→</span>
                </button>
              );
            })()}
          </div>
        )}

        {/* 그룹별 리스트 — 같은 이름 항목은 묶음 chip(×N)으로 표시 */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {GROUP_ORDER.map(({ key, icon, label }) => {
            const list = groups[key];
            if (list.length === 0) return null;

            // 같은 ingredient_name끼리 묶음. urgencyOrder는 기존 정렬 그대로 유지 (가장 임박 우선).
            const buckets = new Map<string, FridgeItem[]>();
            for (const item of list) {
              const nameKey = item.ingredient_name.trim().toLowerCase();
              if (!buckets.has(nameKey)) buckets.set(nameKey, []);
              buckets.get(nameKey)!.push(item);
            }
            const bucketList = Array.from(buckets.values());

            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-text-secondary">
                  <span>{icon}</span>
                  <span>{label}</span>
                  <span className="text-text-muted font-normal">({list.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bucketList.map(bucket => {
                    // 대표 항목 = 가장 임박한 첫 항목
                    const repr = bucket[0];
                    const { border, labelKind, labelN, isDanger } = freshState(repr);
                    const freshLabel = formatFreshLabel(labelKind, labelN, t);
                    const emoji = getEmoji(repr.ingredient_name, repr.category);
                    const displayName = display(repr);
                    const groupCount = bucket.length;
                    return (
                      <div key={repr.id} className="relative group md:pt-2 md:pr-2 md:-mt-2 md:-mr-2">
                        <button
                          onClick={() => {
                            if (groupCount === 1) onItemClick(repr);
                            else setGroupSheet({ name: displayName, items: bucket });
                          }}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-md bg-white/95 border-2 hover:scale-105 active:scale-95 transition-all ${isDanger ? 'animate-pulse' : ''}`}
                          style={{ borderColor: border, boxShadow: isDanger ? `0 0 4px ${border}66` : '0 1px 2px rgba(0,0,0,0.15)' }}
                          title={`${displayName}${groupCount > 1 ? ` × ${groupCount}` : ''}${freshLabel ? ` · ${freshLabel}` : ''}`}
                        >
                          <span className="text-base leading-none">{emoji}</span>
                          <span className="text-xs font-bold text-gray-800 leading-none max-w-[90px] truncate">
                            {displayName}
                          </span>
                          {groupCount > 1 && (
                            <span className="ml-0.5 px-1 rounded-full bg-gray-800 text-white text-[9px] font-bold leading-none">
                              ×{groupCount}
                            </span>
                          )}
                          {freshLabel && (
                            <span className="text-[10px] font-bold leading-none" style={{ color: border }}>{freshLabel}</span>
                          )}
                        </button>
                        {/* 데스크톱 hover X 빠른 삭제 — 그룹은 비활성 (그룹 시트에서 개별 삭제) */}
                        {groupCount === 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(repr); }}
                            className="hidden md:flex absolute top-0 right-0 w-4 h-4 items-center justify-center rounded-full bg-error text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md ring-2 ring-white"
                            aria-label={`${displayName} ${t.common.delete}`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 같은 이름 그룹 미니 시트 — chip 탭 시 같은 이름 항목 목록을 보여주고 개별 선택 */}
      {groupSheet && (
        <div className="fixed inset-0 z-[75] flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setGroupSheet(null)} />
          <div className="relative w-full md:max-w-sm bg-background-secondary rounded-t-2xl md:rounded-2xl border-t md:border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[70dvh]">
            <div className="md:hidden flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {groupSheet.name} <span className="text-text-muted font-normal">×{groupSheet.items.length}</span>
              </h3>
              <button
                onClick={() => setGroupSheet(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all"
                aria-label={t.common.close}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {groupSheet.items.map(item => {
                const { border, labelKind, labelN } = freshState(item);
                const freshLabel = formatFreshLabel(labelKind, labelN, t);
                return (
                  <button
                    key={item.id}
                    onClick={() => { setGroupSheet(null); onItemClick(item); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background-tertiary hover:bg-white/10 transition-colors text-left"
                  >
                    <span className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: border }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {item.quantity != null ? `${item.quantity}${item.unit ?? ''}` : t.ingredient.qtyUnknown}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">
                        {item.purchase_date ? `${t.ingredient.purchasedShort} ${item.purchase_date.slice(5)}` : ''}
                        {item.expiry_date ? ` · ${t.ingredient.expiryShort} ${item.expiry_date.slice(5)}` : ''}
                        {freshLabel ? ` · ${freshLabel}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
