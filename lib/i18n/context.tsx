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
}

function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'ko';
  const savedLang = localStorage.getItem('language') as Language | null;
  if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) return savedLang;
  const browserLang = navigator.language.split('-')[0] as Language;
  if (SUPPORTED_LANGUAGES.includes(browserLang)) return browserLang;
  return 'ko';
}

export function I18nProvider({ children }: I18nProviderProps) {
  // SSR 및 초기 client 렌더는 항상 ko (정적 번들에 포함된 유일한 locale)
  // hydration 후 useEffect에서 실제 사용자 언어를 감지해 dynamic import
  const [language, setLanguageState] = useState<Language>('ko');
  const [t, setT] = useState<TranslationKeys>(defaultLocale);

  // 브라우저 언어 감지 후 필요 시 dynamic load
  useEffect(() => {
    const detected = detectBrowserLanguage();
    if (detected === 'ko') return; // 이미 기본값

    let cancelled = false;
    loadLocale(detected).then((loaded) => {
      if (cancelled) return;
      setLanguageState(detected);
      setT(loaded);
    }).catch(() => {
      // 로드 실패 시 ko 유지
    });
    return () => { cancelled = true };
  }, []);

  const setLanguage = async (lang: Language) => {
    // 현재 언어와 동일하면 noop
    if (lang === language) return;
    try {
      const loaded = await loadLocale(lang);
      setLanguageState(lang);
      setT(loaded);
      localStorage.setItem('language', lang);
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
