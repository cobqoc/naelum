'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';

interface SearchBarProps {
  className?: string;
  isSmall?: boolean;
  autoFocus?: boolean;
}

interface Suggestion {
  type: 'recipe' | 'ingredient' | 'user';
  value: string;
}

const HISTORY_KEY = 'naelum_search_history';
const MAX_HISTORY = 10;

function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSearchHistory(query: string) {
  const history = getSearchHistory().filter(h => h !== query);
  history.unshift(query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function clearSearchHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export default function SearchBar({ className = '', isSmall = false, autoFocus = false }: SearchBarProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // autoFocus가 true로 바뀔 때 input에 포커스 (마운트 이후에도 동작)
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const input = containerRef.current.querySelector('input') as HTMLInputElement | null;
      input?.focus();
    }
  }, [autoFocus]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(value.trim()), 300);
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    saveSearchHistory(trimmed);
    setHistory(getSearchHistory());
    setShowDropdown(false);
    setQuery(trimmed);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  const handleRemoveHistoryItem = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h !== item);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recipe': return '🍳';
      case 'ingredient': return '🥬';
      case 'user': return '👤';
      default: return '🔍';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'recipe': return t.autocomplete?.recipes || '레시피';
      case 'ingredient': return t.autocomplete?.ingredients || '재료';
      case 'user': return t.autocomplete?.users || '사용자';
      default: return '';
    }
  };

  const allItems = query.trim().length >= 2
    ? suggestions
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const totalItems = allItems.length + (query.trim().length < 2 ? history.length : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (query.trim().length < 2 && selectedIndex < history.length) {
        handleSearch(history[selectedIndex]);
      } else if (selectedIndex < allItems.length) {
        const item = allItems[selectedIndex];
        handleSearch(item.value.replace(/^@/, ''));
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const showHistory = query.trim().length < 2 && history.length > 0;
  const showSuggestionsList = query.trim().length >= 2 && (suggestions.length > 0 || loading);
  const shouldShowDropdown = showDropdown && (showHistory || showSuggestionsList);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label={t.search.searchButton}
        suppressHydrationWarning
        className={`relative w-full group flex items-center gap-0 overflow-hidden bg-background-secondary transition-all duration-300 [&>*]:!border-0 [&>*]:!border-l-0 [&>*]:!border-r-0 ${
          isSmall ? 'rounded-xl' : 'rounded-xl md:rounded-2xl'
        } ${
          isFocused
            ? 'ring-2 ring-accent-warm shadow-[0_0_20px_rgba(255,153,102,0.3)] md:shadow-[0_0_25px_rgba(255,153,102,0.4)] scale-[1.01] md:scale-[1.02]'
            : 'ring-1 ring-white/10 shadow-[0_0_10px_rgba(255,153,102,0.15)] md:shadow-[0_0_15px_rgba(255,153,102,0.2)] scale-100'
        }`}
        style={{ border: 'none' }}
      >
        <span
          className={`text-text-muted !border-0 ${isSmall ? 'pl-3 text-sm' : 'pl-3 md:pl-4 text-base md:text-lg'}`}
          style={{ border: 'none', borderLeft: 'none', borderRight: 'none' }}
        >
          🔍
        </span>

        <input
          type="search"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder=""
          aria-label={t.search.searchPlaceholderFull}
          autoComplete="off"
          autoFocus={autoFocus}
          suppressHydrationWarning
          onFocus={() => {
            setIsFocused(true);
            setShowDropdown(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className={`w-full bg-transparent text-text-primary placeholder-text-muted !outline-none !border-0 !border-none transition-all ${
            isSmall
              ? 'px-2 py-2 text-base'
              : 'px-2 md:px-4 py-3 md:py-4 text-base md:text-lg'
          }`}
          style={{ border: 'none', borderLeft: 'none', borderRight: 'none', outline: 'none' }}
        />

        <button
          type="submit"
          aria-label={t.search.searchButton}
          className={`flex-shrink-0 rounded-lg md:rounded-xl bg-accent-warm font-semibold text-background-primary transition-all hover:bg-accent-hover active:scale-95 !outline-none !border-0 flex items-center justify-center ${
            isSmall
              ? 'mr-2 w-8 h-8'
              : 'mr-2 md:mr-3 w-10 h-10 md:w-12 md:h-12'
          }`}
          style={{ border: 'none', borderLeft: 'none', borderRight: 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {shouldShowDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background-secondary rounded-xl border border-white/10 shadow-2xl z-[100] overflow-hidden max-h-[50vh] md:max-h-80 overflow-y-auto">
          {/* Recent Searches */}
          {showHistory && (
            <div>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <span className="text-xs font-bold text-text-muted">
                  {t.autocomplete?.recentSearches || t.search.recentSearches}
                </span>
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleClearHistory(); }}
                  className="text-xs text-text-muted hover:text-error transition-colors"
                >
                  {t.autocomplete?.clearAll || t.search.deleteAll}
                </button>
              </div>
              {history.map((item, idx) => (
                <button
                  key={item}
                  onMouseDown={(e) => { e.preventDefault(); handleSearch(item); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors ${
                    selectedIndex === idx ? 'bg-white/10' : ''
                  }`}
                >
                  <span className="text-text-muted">🕐</span>
                  <span className="flex-1 truncate">{item}</span>
                  <span
                    onMouseDown={(e) => handleRemoveHistoryItem(item, e)}
                    className="text-text-muted hover:text-error text-xs p-1"
                  >
                    ✕
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && query.trim().length >= 2 && (
            <div className="px-4 py-3 text-center text-text-muted text-sm">
              <span className="animate-pulse">검색 중...</span>
            </div>
          )}

          {/* Suggestions */}
          {!loading && suggestions.length > 0 && (
            <div>
              {suggestions.map((item, idx) => (
                <button
                  key={`${item.type}-${item.value}`}
                  onMouseDown={(e) => { e.preventDefault(); handleSearch(item.value.replace(/^@/, '')); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors ${
                    selectedIndex === idx ? 'bg-white/10' : ''
                  }`}
                >
                  <span>{getTypeIcon(item.type)}</span>
                  <span className="flex-1 truncate">{item.value}</span>
                  <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-background-tertiary">
                    {getTypeLabel(item.type)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && query.trim().length >= 2 && suggestions.length === 0 && (
            <div className="px-4 py-4 text-center text-text-muted text-sm">
              {t.autocomplete?.noSuggestions || t.search.noResults}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
