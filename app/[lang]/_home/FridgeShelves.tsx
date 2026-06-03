import { freshState, formatFreshLabel } from './helpers';
import { SHELF_LEFT, SHELF_WIDTH, SHELVES } from './constants';
import { track } from '@/lib/analytics/track';
import type { FridgeItem } from './types';
import type { TranslationKeys } from '@/lib/i18n/locales';

/**
 * 냉장고 선반 overlay — 본체 3단(냉장)+1단(냉동) 그룹 chip + 만료 배너 + 펜던트
 * (presentational). god-file(HomeClient) 분해 Step 2.
 *
 * [[RecommendationPill]]·[[OnboardingBanner]] 규약 동일 — 상태·인터랙션 핸들러는
 * 전부 HomeClient 소유, 이 컴포넌트는 분배 결과(fridgeShelfDistribution)·표시
 * 헬퍼·콜백만 받는 순수 표현. **IIFE 본문은 HomeClient 에서 byte-identical 이동**
 * (props 명을 원래 변수명과 동일하게 둬 diff 0): renderGroup chip 렌더 +
 * 본체 선반 배치 + 대롱대롱 만료배너/펜던트.
 *
 * ⚠️ chip 인터랙션(handleChip*·handleDeleteFromSheet·setGroupSheet)은 여전히
 * HomeClient 소유 → 향후 Step 3 `useFridgeInteractions` hook 추출 대상.
 * 회귀 안전망: e2e/fridge-chip-interactions.spec.ts + logged-in-home:449.
 */

interface FridgeShelvesProps {
  fridgeShelfDistribution: {
    bodyShelfGroups: FridgeItem[][][];
    freezerGroups: FridgeItem[][];
    totalOverflow: number;
  };
  shelfMax: { body: number };
  items: FridgeItem[];
  expiringCount: number;
  isAuthenticated: boolean;
  t: TranslationKeys;
  getDisplayName: (item: { ingredient_name: string; id: string; isDemoItem?: boolean }) => string;
  setGroupSheet: (v: { name: string; items: FridgeItem[] }) => void;
  handleChipClickWithLongPress: (item: FridgeItem, e: React.MouseEvent) => void;
  handleChipPressStart: (item: FridgeItem) => void;
  handleChipPressEnd: () => void;
  handleDeleteFromSheet: (item: FridgeItem) => void;
  setAllSheetMode: (m: null | 'all' | 'expiring') => void;
}

export default function FridgeShelves({
  fridgeShelfDistribution,
  shelfMax,
  items,
  expiringCount,
  isAuthenticated,
  t,
  getDisplayName,
  setGroupSheet,
  handleChipClickWithLongPress,
  handleChipPressStart,
  handleChipPressEnd,
  handleDeleteFromSheet,
  setAllSheetMode,
}: FridgeShelvesProps) {
  return (
          <div className="absolute inset-0 pointer-events-none">
            {(() => {
              // 분배된 본체·냉동 그룹 + 통합 overflow를 상단 useMemo(fridgeShelfDistribution)에서 참조.
              const { bodyShelfGroups, freezerGroups, totalOverflow } = fridgeShelfDistribution;

              // 렌더 helper — 그룹 chip (대표 항목 + ×N 배지)
              const renderGroup = (group: FridgeItem[], compact = false) => {
                const repr = group[0]; // 가장 임박한 항목
                const groupCount = group.length;
                const { border, labelKind, labelN, isDanger, isEstimate } = freshState(repr);
                const label = formatFreshLabel(labelKind, labelN, t, isEstimate);
                const emoji = repr.emoji ?? null;
                const displayName = getDisplayName(repr);
                const handleClick = (e: React.MouseEvent) => {
                  if (groupCount > 1) {
                    e.stopPropagation();
                    setGroupSheet({ name: displayName, items: group });
                  } else {
                    handleChipClickWithLongPress(repr, e);
                  }
                };
                return (
                  <div key={repr.id} className="relative pointer-events-auto group shrink-0 md:pt-2 md:pr-2 md:-mt-2 md:-mr-2">
                    <button
                      onClick={handleClick}
                      onTouchStart={() => groupCount === 1 && handleChipPressStart(repr)}
                      onTouchEnd={handleChipPressEnd}
                      onTouchMove={handleChipPressEnd}
                      onTouchCancel={handleChipPressEnd}
                      className={`flex items-center gap-0.5 rounded-md border-2 hover:scale-105 active:scale-95 transition-all ${isDanger ? 'animate-pulse bg-red-100/95' : (label ? 'bg-amber-100/95' : 'bg-white/90')} ${compact ? 'px-0.5 py-0.5' : 'px-1 py-0.5'}`}
                      style={{
                        borderColor: border,
                        boxShadow: isDanger ? `0 0 4px ${border}66` : undefined,
                      }}
                      title={`${displayName}${groupCount > 1 ? ` × ${groupCount}` : ''}${label ? ` · ${label}` : ''}`}
                    >
                      {emoji && <span className={`leading-none ${compact ? 'text-[10px]' : 'text-sm md:text-base'}`}>{emoji}</span>}
                      <span className={`font-bold text-gray-800 leading-none truncate ${compact ? 'text-[8px] max-w-[28px]' : 'text-[10px] md:text-[11px] max-w-[80px]'}`}>
                        {displayName}
                      </span>
                      {groupCount > 1 && (
                        <span className={`font-bold leading-none rounded-full bg-gray-800 text-white ${compact ? 'text-[8px] px-0.5' : 'text-[9px] px-1'}`}>
                          ×{groupCount}
                        </span>
                      )}
                      {/* 도어 선반은 공간 타이트 → compact 모드에서는 만료 라벨 숨김(툴팁/시트에서 확인 가능) */}
                      {label && !compact && (
                        <span className="font-bold leading-none text-[10px] md:text-[11px]" style={{ color: border }}>
                          {label}
                        </span>
                      )}
                    </button>
                    {/* 데스크톱 hover 시 우상단 X 버튼 — 그룹 1개일 때만 (다중은 미니 시트에서 개별 삭제) */}
                    {groupCount === 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteFromSheet(repr); }}
                        className="hidden md:flex absolute top-0 right-0 w-4 h-4 items-center justify-center rounded-full bg-error text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity shadow-md ring-2 ring-white"
                        aria-label={`${displayName} ${t.common.delete}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              };

              return (
                <>
                  {/* 본체 선반 4개 (냉장 3 + 냉동 1) — per-shelf +N 제거, 서랍에 통합 */}
                  {SHELVES.map((shelf, idx) => {
                    const list = idx < 3 ? bodyShelfGroups[idx] : freezerGroups;
                    const visible = list.slice(0, shelfMax.body);
                    return (
                      <div
                        key={`body-${idx}`}
                        className="absolute flex flex-wrap items-end justify-center gap-0.5"
                        style={{ left: SHELF_LEFT, width: SHELF_WIDTH, top: shelf.top, height: shelf.height, pointerEvents: 'none' }}
                      >
                        {visible.map(group => renderGroup(group, false))}
                      </div>
                    );
                  })}

                  {/* 도어 선반 데코는 FridgeSVG 내부에 SVG로 직접 렌더됨 (병·카톤 실루엣) */}

                  {/* 전체 재료 목록 + 만료 배너 — 카툰 스타일 대롱대롱 효과.
                      썸택(thumb-tack) → 노끈(rope) → 태그(tag).
                      bold black outline + hard cartoon shadow + 미세 흔들림 애니메이션.
                      비로그인은 데모 재료라 전체 목록 진입 필요성 낮음 + pill과 시각적 겹침 방지로 hide.

                      stack 순서 (위 → 아래):
                      1. 만료 배너 (expiringCount > 0일 때만, 빨강 톤, 펜던트보다 위)
                      2. 펜던트 (재료 목록, cream/wood 톤) */}
                  {isAuthenticated && (
                  <div
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-dangle"
                    style={{ bottom: 'calc(100% - 2px)' }}
                  >
                    {/* 썸택 + 윗 노끈 (배너 위까지) — gradient는 항상 정의돼 있어야 두 SVG가 모두 참조 가능 */}
                    <svg
                      width="44"
                      height={expiringCount > 0 ? 18 : 32}
                      viewBox={`0 0 44 ${expiringCount > 0 ? 18 : 32}`}
                      style={{ overflow: 'visible', display: 'block' }}
                      aria-hidden="true"
                    >
                      <defs>
                        <radialGradient id="dangleTackG" cx="32%" cy="28%" r="72%">
                          <stop offset="0%" stopColor="#fff5c0"/>
                          <stop offset="45%" stopColor="#e0a830"/>
                          <stop offset="100%" stopColor="#5a3208"/>
                        </radialGradient>
                        <linearGradient id="dangleRopeG" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6a3a10"/>
                          <stop offset="40%" stopColor="#a8731c"/>
                          <stop offset="100%" stopColor="#5a2e08"/>
                        </linearGradient>
                      </defs>

                      {/* 노끈 (썸택 아래 ~ SVG 끝까지) — 배너 있을 땐 짧게, 없을 땐 풀 길이 */}
                      <line x1="22" y1="9" x2="22" y2={expiringCount > 0 ? 18 : 32} stroke="#000" strokeWidth="4" strokeLinecap="round"/>
                      <line x1="22" y1="9" x2="22" y2={expiringCount > 0 ? 18 : 32} stroke="url(#dangleRopeG)" strokeWidth="2.4" strokeLinecap="round"/>
                      {/* 꼬임 detail (긴 노끈일 때만 자연스러움) */}
                      {expiringCount === 0 && (
                        <>
                          <line x1="20.5" y1="13" x2="23.5" y2="15" stroke="rgba(40,20,4,0.55)" strokeWidth="0.7" strokeLinecap="round"/>
                          <line x1="20.5" y1="19" x2="23.5" y2="21" stroke="rgba(40,20,4,0.55)" strokeWidth="0.7" strokeLinecap="round"/>
                          <line x1="20.5" y1="25" x2="23.5" y2="27" stroke="rgba(40,20,4,0.55)" strokeWidth="0.7" strokeLinecap="round"/>
                          <line x1="21.5" y1="12" x2="21.5" y2="30" stroke="rgba(255,235,180,0.45)" strokeWidth="0.6" strokeLinecap="round"/>
                        </>
                      )}

                      {/* 썸택 — 항상 노끈 시작점에 */}
                      <circle cx="22" cy="7" r="7" fill="#000"/>
                      <circle cx="22" cy="7" r="6" fill="url(#dangleTackG)"/>
                      <ellipse cx="19.5" cy="4.5" rx="2.5" ry="1.8" fill="rgba(255,250,220,0.85)"/>
                      <circle cx="22" cy="7" r="1.4" fill="#3a1f08" opacity="0.5"/>
                    </svg>

                    {/* 만료 임박 배너 — 윗 노끈 끝과 아랫 노끈 시작 사이에 매달림. 한 줄에 두 태그 효과. */}
                    {expiringCount > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); track('expiring_banner_click', { expiring_count: expiringCount }); setAllSheetMode('expiring'); }}
                          className="pointer-events-auto flex items-center gap-1 px-3 py-1 rounded-2xl text-[10px] md:text-xs font-extrabold whitespace-nowrap hover:scale-105 active:scale-95 transition-all animate-pulse"
                          style={{
                            background: '#fecaca',
                            color: '#7c2d12',
                            border: '2px solid #000',
                            boxShadow: '0 3px 0 #000, 0 5px 8px rgba(0,0,0,0.3)',
                          }}
                          aria-label={t.home.expiringBannerAria.replace('{count}', String(expiringCount))}
                        >
                          <span>{t.home.expiringBannerLabel.replace('{count}', String(expiringCount))}</span>
                        </button>

                        {/* 아랫 노끈 — 배너 ~ 펜던트 태그 사이 연결. 같은 dangleRopeG 참조(첫 SVG 정의) */}
                        <svg
                          width="44"
                          height="12"
                          viewBox="0 0 44 12"
                          style={{ overflow: 'visible', display: 'block' }}
                          aria-hidden="true"
                        >
                          <line x1="22" y1="0" x2="22" y2="12" stroke="#000" strokeWidth="4" strokeLinecap="round"/>
                          <line x1="22" y1="0" x2="22" y2="12" stroke="url(#dangleRopeG)" strokeWidth="2.4" strokeLinecap="round"/>
                        </svg>
                      </>
                    )}

                    {/* 펜던트 태그 — cream/wood 톤 (빈티지 나무 명패 컨셉). 노끈·썸택 갈색 톤과 일관 + 페이지 솔리드 오렌지 분포 감소.
                        칩 truncate(60→80px 보강 후에도 정확 이름 확인) 동선의 진입점이므로 발견성 약간 강화 — 폰트 size 한 단계 ↑, padding 살짝 ↑, hover scale 더 강. */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); track('pendant_click', { items_count: items.length, overflow: totalOverflow }); setAllSheetMode('all'); }}
                      className="pointer-events-auto -mt-[3px] flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[11px] md:text-sm font-extrabold whitespace-nowrap hover:scale-110 active:scale-95 transition-all"
                      style={{
                        background: '#f4d8a0',
                        color: '#5a3208',
                        border: '2px solid #000',
                        boxShadow: '0 3px 0 #000, 0 6px 10px rgba(0,0,0,0.35)',
                      }}
                      title={t.home.ingredientList}
                      aria-label={t.home.ingredientList}
                    >
                      <span className="text-base md:text-lg leading-none">📋</span>
                      <span>{t.home.ingredientList}</span>
                    </button>
                  </div>
                  )}
                </>
              );
            })()}
          </div>
  );
}
