import { ko } from './ko'

export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'es' | 'fr' | 'de' | 'it'

// ko를 타입 소스로 사용 — 모든 locale이 동일한 key shape을 가져야 함
export type TranslationKeys = typeof ko

// ko는 fallback/초기 렌더용으로 정적 import (서비스 주 타겟 언어)
export const defaultLocale: TranslationKeys = ko

// 다른 언어는 동적 import로 분리 — 번들러가 각각 별도 chunk로 분리
// 사용자가 해당 언어로 전환할 때만 네트워크 fetch 발생
export async function loadLocale(lang: Language): Promise<TranslationKeys> {
  switch (lang) {
    case 'ko':
      return ko
    case 'en':
      return (await import('./en')).en as TranslationKeys
    case 'ja':
      return (await import('./ja')).ja as TranslationKeys
    case 'zh':
      return (await import('./zh')).zh as TranslationKeys
    case 'es':
      return (await import('./es')).es as TranslationKeys
    case 'fr':
      return (await import('./fr')).fr as TranslationKeys
    case 'de':
      return (await import('./de')).de as TranslationKeys
    case 'it':
      return (await import('./it')).it as TranslationKeys
    default:
      return ko
  }
}

export const SUPPORTED_LANGUAGES: readonly Language[] = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'it'] as const
