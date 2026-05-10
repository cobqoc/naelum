'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultLocale, loadLocale, SUPPORTED_LANGUAGES, type Language, type TranslationKeys } from './locales';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  /** URL 경로 [lang]/에서 결정된 초기 locale. 미지정 시 ko fallback. */
  initialLanguage?: Language;
  /** server layout이 미리 loadLocale로 가져온 t. SSR 첫 렌더부터 정확한 locale 표시.
   *  미지정 시 defaultLocale(ko) 사용 후 client useEffect에서 dynamic import. */
  initialT?: TranslationKeys;
}

function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'ko';
  const savedLang = localStorage.getItem('language') as Language | null;
  if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) return savedLang;
  const browserLang = navigator.language.split('-')[0] as Language;
  if (SUPPORTED_LANGUAGES.includes(browserLang)) return browserLang;
  return 'ko';
}

export function I18nProvider({ children, initialLanguage, initialT }: I18nProviderProps) {
  // initialLanguage가 주어지면 (path-based locale) SSR/CSR 둘 다 그것으로 시작.
  // 미지정이면 ko default, hydration 후 자동 감지로 폴백.
  const start: Language = initialLanguage && SUPPORTED_LANGUAGES.includes(initialLanguage) ? initialLanguage : 'ko';
  const [language, setLanguageState] = useState<Language>(start);
  // initialT가 server에서 미리 loaded되어 들어오면 SSR 첫 렌더부터 정확한 locale.
  // 그렇지 않으면 ko 기본 후 client useEffect에서 dynamic import.
  const [t, setT] = useState<TranslationKeys>(initialT ?? defaultLocale);

  // ko 외 locale은 dynamic import 후 t 갱신. initialT가 있으면 client에서 재로드 불필요.
  useEffect(() => {
    const target = initialLanguage && SUPPORTED_LANGUAGES.includes(initialLanguage)
      ? initialLanguage
      : detectBrowserLanguage();
    // SSR이 다음 방문 때 정확한 locale로 metadata 분기하도록 쿠키 기록.
    if (typeof document !== 'undefined') {
      document.cookie = `language=${target}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
    // initialT를 받았으면 이미 정확한 t. 추가 로드 불필요.
    if (initialT) return;
    if (target === 'ko') {
      // ko면 initial state가 이미 ko라 noop. setState 호출 안 해 cascade 회피.
      return;
    }

    let cancelled = false;
    loadLocale(target).then((loaded) => {
      if (cancelled) return;
      setLanguageState(target);
      setT(loaded);
    }).catch(() => {
      // 로드 실패 시 ko 유지
    });
    return () => { cancelled = true };
  }, [initialLanguage, initialT]);

  // <html lang> 동기화 — 스크린리더·검색엔진이 현재 locale을 정확히 인식하도록.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = async (lang: Language) => {
    // 현재 언어와 동일하면 noop
    if (lang === language) return;
    try {
      const loaded = await loadLocale(lang);
      setLanguageState(lang);
      setT(loaded);
      localStorage.setItem('language', lang);
      // SSR이 metadata·html lang을 정확히 분기하도록 쿠키도 동기화. 1년 유지, lax로 외부 접근 차단.
      document.cookie = `language=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    } catch (err) {
      console.error('Failed to load locale:', lang, err);
    }
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Language Switcher Component
export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  ];

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="언어 변경"
        className="flex items-center gap-1 p-2 rounded-full hover:bg-white/10 transition-colors text-sm"
      >
        <span className="text-lg">🌐</span>
        <span className="hidden md:inline text-xs text-text-muted">{currentLang?.flag}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  language === lang.code
                    ? 'bg-accent-warm/10 text-accent-warm font-medium'
                    : 'hover:bg-white/5 text-text-primary'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                {language === lang.code && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
