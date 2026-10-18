'use client';

import { useState, useEffect, useRef, KeyboardEvent, useCallback, useId } from 'react';
import { AutocompleteItem, AutocompleteProps } from './AutocompleteTypes';
import { useI18n } from '@/lib/i18n/context';

/**
 * 범용 자동완성 컴포넌트
 * Generic 타입을 사용하여 다양한 항목에 재사용 가능
 *
 * @example
 * ```tsx
 * <Autocomplete<IngredientItem>
 *   value={query}
 *   onChange={setQuery}
 *   onSelect={handleSelect}
 *   fetchSuggestions={fetchIngredients}
 *   allowCustomInput
 *   recentItems={recentIngredients}
 * />
 * ```
 */
export default function Autocomplete<T extends AutocompleteItem>({
  // 기본 props
  value,
  onChange,
  onSelect,
  placeholder,

  // 데이터 fetching
  fetchSuggestions,
  minQueryLength = 2,
  debounceMs = 300,

  // 추가 기능
  allowCustomInput = false,
  onCustomInput,
  recentItems = [],
  onRecentItemsClear,
  filterComponent,

  // 커스터마이징
  renderItem,
  renderNoResults,

  // 스타일링
  className = '',
  dropdownClassName = '',
  dropdownDirection = 'down',

  // 접근성
  ariaLabel,
  disabled = false,
  autoFocus = false,
}: AutocompleteProps<T>) {
  const { t } = useI18n();
  const resolvedPlaceholder = placeholder ?? t.search.searchPlaceholderSmall;
  // ARIA id 는 인스턴스마다 고유하게 — 레시피 작성 폼처럼 자동완성이 여러 개면 고정 id 가 서로를 가리켰다
  // (aria-controls/activedescendant, ICL-46 2026-10-04). id 를 셀렉터로 쓰는 코드·테스트 없음(grep 확인).
  const ariaBaseId = useId();
  const listboxId = `${ariaBaseId}-listbox`;
  const optionId = (index: number) => `${ariaBaseId}-option-${index}`;
  // ===== 상태 관리 =====
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // ===== Refs =====
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  // stale-response race 가드(H14): 발사된 요청마다 단조 증가 id 부여.
  // await 후 자신이 최신 요청일 때만 결과 반영 — 느린 옛 응답이 최신 위 덮기 방지.
  const requestIdRef = useRef(0);
  // 방금 선택한 항목의 라벨 — 선택 직후 부모가 value 를 그 라벨로 바꿔 아래 디바운스 조회가 다시 돌 때,
  // 그 응답으로 드롭다운을 *다시 열지는* 않게 한다(ICL-10, 2026-10-04). 조회·결과 저장은 이전 그대로
  // (나중에 다시 포커스하면 그 결과를 보여주는 기존 동작 유지). 사용자가 값을 바꾸면 해제.
  const justSelectedLabelRef = useRef<string | null>(null);

  // ===== 데스크톱 자동 포커스 =====
  useEffect(() => {
    if (!autoFocus) return;
    if (window.matchMedia('(pointer: fine)').matches) {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [autoFocus]);

  // ===== 디바운싱 검색 =====
  useEffect(() => {
    // 선택 후 사용자가 값을 바꿨으면 "방금 선택" 표시 해제 (ICL-10)
    if (justSelectedLabelRef.current !== null && value !== justSelectedLabelRef.current) {
      justSelectedLabelRef.current = null;
    }

    // 검색어가 최소 길이 미만이면 초기화
    if (value.length < minQueryLength) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const reqId = ++requestIdRef.current;
      try {
        const results = await fetchSuggestions(value);
        if (reqId !== requestIdRef.current) return; // 더 새 요청이 떴음 — 옛 응답 폐기
        setSuggestions(results);
        // 선택 직후(값 = 방금 고른 라벨)의 재조회는 결과만 채우고 드롭다운은 다시 열지 않는다 (ICL-10)
        if (isFocusedRef.current && value !== justSelectedLabelRef.current) setShowDropdown(true);
      } catch (error) {
        if (reqId !== requestIdRef.current) return;
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, fetchSuggestions, minQueryLength, debounceMs]);

  // ===== 외부 클릭 감지 =====
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== 키보드 네비게이션 =====
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const totalItems = getTotalSelectableItems();

    if (!showDropdown || totalItems === 0) {
      // Escape은 드롭다운 닫기만 처리
      if (e.key === 'Escape') {
        // 드롭다운(로딩·결과 없음 표시 포함)이 *보이는* 중이면 이 Esc 는 드롭다운 닫기용 — 처리했다고 표시해
        // 바깥 모달의 useEscapeKey 가 함께 닫히지 않게 한다(ICL-33). 안 보일 땐 그대로 전파(모달 닫힘 유지).
        if (isDropdownVisible()) e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Home':
        e.preventDefault();
        setSelectedIndex(0);
        break;

      case 'End':
        e.preventDefault();
        setSelectedIndex(totalItems - 1);
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < totalItems) {
          const item = getItemAtIndex(selectedIndex);
          if (item) {
            handleSelectItem(item);
          }
        } else if (allowCustomInput && onCustomInput && value.trim()) {
          // 선택된 항목이 없고 커스텀 입력이 허용된 경우
          onCustomInput(value.trim());
          setShowDropdown(false);
        }
        break;

      case 'Escape':
        // preventDefault = "이 Esc 는 드롭다운이 처리함" — useEscapeKey(바깥 모달)는 이 표시가 있으면 무시 (ICL-33)
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // ===== 헬퍼 함수 =====

  /**
   * 선택 가능한 전체 항목 수 계산
   * (최근 항목 + 검색 결과 + 커스텀 입력 옵션)
   */
  const getTotalSelectableItems = (): number => {
    let count = 0;
    if (shouldShowRecentItems()) count += recentItems.length;
    if (suggestions.length > 0) count += suggestions.length;
    if (shouldShowCustomInput()) count += 1;
    return count;
  };

  /**
   * 인덱스에 해당하는 항목 가져오기
   */
  const getItemAtIndex = (index: number): T | null => {
    let currentIndex = 0;

    // 최근 항목 섹션
    if (shouldShowRecentItems()) {
      if (index < recentItems.length) {
        return recentItems[index];
      }
      currentIndex += recentItems.length;
    }

    // 검색 결과 섹션
    if (suggestions.length > 0) {
      const suggestionIndex = index - currentIndex;
      if (suggestionIndex < suggestions.length) {
        return suggestions[suggestionIndex];
      }
      currentIndex += suggestions.length;
    }

    // 커스텀 입력은 null 반환 (별도 처리)
    return null;
  };

  /**
   * 최근 항목을 표시할지 여부
   */
  const shouldShowRecentItems = (): boolean => {
    return recentItems.length > 0 && value.length < minQueryLength && isFocused;
  };

  /**
   * 드롭다운이 실제로 보이는지 — 렌더의 shouldShowDropdown 과 같은 판정 (ICL-33 Esc 처리용)
   */
  const isDropdownVisible = (): boolean =>
    showDropdown && (shouldShowRecentItems() || suggestions.length > 0 || shouldShowCustomInput() || loading);

  /**
   * 커스텀 입력 옵션을 표시할지 여부
   * 검색 결과가 있어도 항상 표시 (사용자가 원하는 재료를 직접 추가할 수 있도록)
   */
  const shouldShowCustomInput = (): boolean => {
    return (
      allowCustomInput &&
      value.length >= minQueryLength &&
      !loading
    );
  };

  /**
   * 항목 선택 핸들러
   */
  const handleSelectItem = useCallback((item: T) => {
    // ICL-10: 선택 직후 같은 라벨 재조회 응답이 드롭다운을 다시 열지 않게 표시하고, 선택 순간 이미 날아가 있던
    // (이전 검색어) 요청의 응답도 무효화 — 그 응답이 늦게 와 옛 목록으로 드롭다운을 다시 여는 것까지 막는다.
    // 무효화된 요청은 로딩을 끄지 못하므로 여기서 끈다(진행 중 요청이 없으면 둘 다 영향 없음).
    justSelectedLabelRef.current = item.label;
    requestIdRef.current++;
    setLoading(false);
    onChange(item.label);
    onSelect(item);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setSuggestions([]);
    setIsFocused(false);
  }, [onChange, onSelect]);

  /**
   * 최근 선택 항목·"전체 삭제" 버튼의 mousedown 기본동작(포커스 이동) 차단 — ICL-09 (2026-10-04).
   * 최근 섹션은 isFocused 일 때만 보이는데, mousedown 이 input 을 blur 시키면 click 이 오기 전에 섹션이
   * 언마운트돼 마우스/터치로는 고를 수도 지울 수도 없었다. 검색 결과·직접 추가 버튼은 isFocused 와 무관하게
   * 남아 있어 원래 정상이므로 손대지 않는다.
   */
  const keepInputFocus = (e: React.MouseEvent) => e.preventDefault();

  /**
   * 커스텀 입력 핸들러
   */
  const handleCustomInput = useCallback(() => {
    if (onCustomInput && value.trim()) {
      onCustomInput(value.trim());
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  }, [onCustomInput, value]);

  /**
   * 포커스 핸들러
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    isFocusedRef.current = true;
    if (suggestions.length > 0 || recentItems.length > 0) {
      setShowDropdown(true);
    }
  }, [suggestions.length, recentItems.length]);

  /**
   * 기본 항목 렌더링
   */
  const defaultRenderItem = (item: T, isSelected: boolean): React.ReactNode => {
    return (
      <div className="flex items-center gap-3">
        {item.icon && <span className="text-2xl">{item.icon}</span>}
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${isSelected ? 'text-text-primary' : 'text-text-primary'}`}>
            {item.label}
          </div>
          {item.secondaryLabel && (
            <div className="text-sm text-text-muted truncate">
              {item.secondaryLabel}
            </div>
          )}
        </div>
        {item.badge && (
          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-text-secondary">
            {item.badge}
          </span>
        )}
      </div>
    );
  };

  // ===== 렌더링 =====

  const renderItemFn = renderItem || defaultRenderItem;
  const showRecent = shouldShowRecentItems();
  const showCustom = shouldShowCustomInput();
  const shouldShowDropdown = showDropdown && (showRecent || suggestions.length > 0 || showCustom || loading);

  return (
    <div className={`relative w-full ${className}`}>
      {/* 입력창 래퍼 */}
      <div className={`relative flex items-center overflow-hidden rounded-xl md:rounded-2xl bg-background-secondary transition-all duration-300 [&>*]:!border-0 [&>*]:!border-l-0 [&>*]:!border-r-0 ${
        isFocused
          ? 'ring-2 ring-accent-warm shadow-[0_0_20px_rgba(255,153,102,0.3)] md:shadow-[0_0_25px_rgba(255,153,102,0.4)] scale-[1.01] md:scale-[1.02]'
          : 'ring-1 ring-white/10 shadow-[0_0_10px_rgba(255,153,102,0.15)] md:shadow-[0_0_15px_rgba(255,153,102,0.2)] scale-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ border: 'none' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={() => { setIsFocused(false); isFocusedRef.current = false; }}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          inputMode="text"
          className="w-full bg-transparent pl-4 pr-2 py-3 md:py-3.5 text-base text-text-primary placeholder-text-muted !outline-none !border-0 !border-none touch-manipulation disabled:cursor-not-allowed"
          style={{ border: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none' }}
          autoComplete="off"
          role="combobox"
          aria-expanded={shouldShowDropdown}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={selectedIndex >= 0 ? optionId(selectedIndex) : undefined}
          aria-label={ariaLabel || resolvedPlaceholder}
        />
        {/* 오른쪽 아이콘 — 로딩 중엔 스피너, 평소엔 홈 검색바와 동일한 오렌지 돋보기 버튼 */}
        <div className="mr-2 flex-shrink-0">
          {loading
            ? <div className="w-9 h-9 flex items-center justify-center"><div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-warm border-t-transparent" /></div>
            : <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent-warm text-background-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
          }
        </div>
      </div>


      {/* 드롭다운 */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className={`absolute left-0 right-0 ${dropdownDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} rounded-2xl bg-background-secondary border border-white/10 shadow-2xl overflow-hidden z-50 ${dropdownClassName}`}
          role="listbox"
          id={listboxId}
        >
          {/* 필터 컴포넌트 */}
          {filterComponent && (
            <div className="border-b border-white/10">
              {filterComponent}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {/* 최근 선택 항목 섹션 */}
            {showRecent && (
              <div className="border-b border-white/10">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5">
                  <span className="text-xs font-medium text-text-secondary">{t.autocomplete.recentSelected}</span>
                  {onRecentItemsClear && (
                    <button
                      onMouseDown={keepInputFocus}
                      onClick={onRecentItemsClear}
                      className="text-xs text-accent-warm hover:text-accent-hover transition-colors"
                      type="button"
                    >
                      {t.autocomplete.clearAll}
                    </button>
                  )}
                </div>
                {recentItems.map((item, index) => (
                  <button
                    key={`recent-${item.id}`}
                    type="button"
                    onMouseDown={keepInputFocus}
                    // 고른 뒤엔 검색 결과를 마우스로 고른 경우와 같은 상태(입력창 포커스 해제)로 맞춘다 —
                    // 그래야 입력창을 다시 탭하면 포커스 이벤트로 최근 목록이 다시 열린다 (ICL-09)
                    onClick={() => { inputRef.current?.blur(); handleSelectItem(item); }}
                    className={`w-full px-4 py-3 min-h-[3rem] text-left transition-colors touch-manipulation active:scale-98 ${
                      selectedIndex === index
                        ? 'bg-accent-warm/20'
                        : 'hover:bg-white/5 active:bg-white/10'
                    }`}
                    role="option"
                    id={optionId(index)}
                    aria-selected={selectedIndex === index}
                  >
                    {renderItemFn(item, selectedIndex === index)}
                  </button>
                ))}
              </div>
            )}

            {/* 검색 결과 섹션 */}
            {suggestions.length > 0 && (
              <div>
                {suggestions.map((item, index) => {
                  const globalIndex = showRecent ? recentItems.length + index : index;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      className={`w-full px-4 py-3 min-h-[3rem] text-left transition-colors touch-manipulation active:scale-98 ${
                        selectedIndex === globalIndex
                          ? 'bg-accent-warm/20'
                          : 'hover:bg-white/5 active:bg-white/10'
                      }`}
                      role="option"
                      id={optionId(globalIndex)}
                      aria-selected={selectedIndex === globalIndex}
                    >
                      {renderItemFn(item, selectedIndex === globalIndex)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 커스텀 입력 - 검색 결과가 있어도 항상 표시 */}
            {showCustom && (
              <div className={`p-4 ${suggestions.length > 0 ? 'border-t border-white/10' : ''}`}>
                {renderNoResults && suggestions.length === 0 ? (
                  renderNoResults()
                ) : (
                  <div className="text-center">
                    {/* 검색 결과가 없을 때만 메시지 표시 */}
                    {suggestions.length === 0 && (
                      <p className="text-sm text-text-muted mb-3">{t.search.noResults}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleCustomInput}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-accent-warm font-medium flex items-center justify-center gap-2"
                    >
                      <span>➕</span>
                      {/* 함수 치환 — 입력값의 `$&` 등이 치환 패턴으로 해석되지 않게 */}
                      <span>{t.autocomplete.addCustom.replace('{value}', () => value)}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 검색 결과 없음 (커스텀 입력 비활성화) */}
            {!loading && value.length >= minQueryLength && suggestions.length === 0 && !showCustom && (
              <div className="p-4 text-center text-text-muted text-sm">
                {renderNoResults ? renderNoResults() : t.search.noResults}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
