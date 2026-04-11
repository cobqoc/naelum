'use client';

import { useState, useEffect, useRef, KeyboardEvent, useCallback } from 'react';
import { AutocompleteItem, AutocompleteProps } from './AutocompleteTypes';

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
  placeholder = '검색...',

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
  renderLoading: _renderLoading, // eslint-disable-line @typescript-eslint/no-unused-vars

  // 스타일링
  className = '',
  dropdownClassName = '',

  // 접근성
  ariaLabel,
  disabled = false,
}: AutocompleteProps<T>) {
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

  // ===== 디바운싱 검색 =====
  useEffect(() => {
    // 검색어가 최소 길이 미만이면 초기화
    if (value.length < minQueryLength) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(value);
        setSuggestions(results);
        if (isFocusedRef.current) setShowDropdown(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
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
    onChange(item.label);
    onSelect(item);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setSuggestions([]);
    setIsFocused(false);
  }, [onChange, onSelect]);

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
      <div className={`relative flex items-center overflow-hidden rounded-xl bg-background-secondary transition-all duration-300 [&>*]:!border-0 [&>*]:!border-l-0 [&>*]:!border-r-0 ${
        isFocused
          ? 'ring-2 ring-accent-warm shadow-[0_0_20px_rgba(255,153,102,0.3)] scale-[1.01]'
          : 'ring-1 ring-white/10 shadow-[0_0_10px_rgba(255,153,102,0.15)] scale-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ border: 'none' }}
      >
        <span className="pl-4 text-text-muted flex-shrink-0 !border-0" style={{ border: 'none' }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={() => { setIsFocused(false); isFocusedRef.current = false; }}
          placeholder={placeholder}
          disabled={disabled}
          inputMode="text"
          className="w-full bg-transparent px-3 py-3.5 text-text-primary placeholder-text-muted !outline-none !border-0 !border-none touch-manipulation disabled:cursor-not-allowed"
          style={{ border: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none' }}
          autoComplete="off"
          role="combobox"
          aria-expanded={shouldShowDropdown}
          aria-autocomplete="list"
          aria-controls="autocomplete-listbox"
          aria-activedescendant={selectedIndex >= 0 ? `autocomplete-option-${selectedIndex}` : undefined}
          aria-label={ariaLabel || placeholder}
        />
        {/* 로딩 스피너 */}
        {loading && (
          <div className="pr-4 flex-shrink-0">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-warm border-t-transparent" />
          </div>
        )}
      </div>


      {/* 드롭다운 */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className={`absolute top-full left-0 right-0 mt-2 rounded-2xl bg-background-secondary border border-white/10 shadow-2xl overflow-hidden z-50 ${dropdownClassName}`}
          role="listbox"
          id="autocomplete-listbox"
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
                  <span className="text-xs font-medium text-text-secondary">최근 선택한 항목</span>
                  {onRecentItemsClear && (
                    <button
                      onClick={onRecentItemsClear}
                      className="text-xs text-accent-warm hover:text-accent-hover transition-colors"
                      type="button"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>
                {recentItems.map((item, index) => (
                  <button
                    key={`recent-${item.id}`}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`w-full px-4 py-3 min-h-[3rem] text-left transition-colors touch-manipulation active:scale-98 ${
                      selectedIndex === index
                        ? 'bg-accent-warm/20'
                        : 'hover:bg-white/5 active:bg-white/10'
                    }`}
                    role="option"
                    id={`autocomplete-option-${index}`}
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
                      id={`autocomplete-option-${globalIndex}`}
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
                      <p className="text-sm text-text-muted mb-3">검색 결과가 없습니다</p>
                    )}
                    <button
                      type="button"
                      onClick={handleCustomInput}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-accent-warm font-medium flex items-center justify-center gap-2"
                    >
                      <span>➕</span>
                      <span>&quot;{value}&quot; 직접 추가하기</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 검색 결과 없음 (커스텀 입력 비활성화) */}
            {!loading && value.length >= minQueryLength && suggestions.length === 0 && !showCustom && (
              <div className="p-4 text-center text-text-muted text-sm">
                {renderNoResults ? renderNoResults() : '검색 결과가 없습니다'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
