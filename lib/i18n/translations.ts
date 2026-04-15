// 이 파일은 하위 호환 re-export 레이어입니다.
// 실제 번역 사전은 lib/i18n/locales/{ko,en,ja,...}.ts에 분할되어 있고,
// 런타임엔 lib/i18n/locales/index.ts의 loadLocale()로 동적 로드됩니다.
//
// 번들 최적화: 과거엔 하나의 translations 객체에 8개 언어 전부 들어있어
// 모든 클라이언트가 ~154KB를 받아갔지만, 이제 ko만 정적 번들에 포함되고
// 다른 언어는 사용자가 전환할 때만 chunk로 로드됩니다.

export type { Language, TranslationKeys } from './locales'
export { defaultLocale, loadLocale, SUPPORTED_LANGUAGES } from './locales'
