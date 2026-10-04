import type { TranslationKeys } from './locales';

/**
 * Supabase 및 일반 에러 메시지를 *현재 로케일* 문구로 변환하는 유틸리티.
 *
 * 2026-10-04 (PAU-06): 예전엔 한국어 고정 문자열을 반환해 비-ko 로케일 인증 화면에 한글이
 * 노출됐다. 매핑 값을 번역 셀렉터(t => t.*)로 바꿔 호출처가 넘긴 `t` 의 번역을 쓴다.
 * ko 번역 값 = 기존 한국어 문구 그대로 → ko 출력은 이전과 동일. 매칭 순서·규칙도 동일.
 * (같은 날 PAU-05: 호출처 0 이던 translateErrors·getTranslatedErrorMessage 삭제)
 */
type Message = (t: TranslationKeys) => string;

const errorMessages: Record<string, Message> = {
  // 비밀번호 관련
  'New password should be different from the old password': (t) => t.auth.errSamePassword,
  'Password should be at least 6 characters': (t) => t.auth.errPasswordMin6,
  'Password is too weak': (t) => t.auth.errPasswordWeak,

  // 로그인 관련
  'Invalid login credentials': (t) => t.auth.errInvalidCredentials,
  'Email not confirmed': (t) => t.auth.errEmailNotConfirmed,
  'Invalid email or password': (t) => t.auth.errInvalidCredentials,
  'User not found': (t) => t.profile.userNotFound,

  // 회원가입 관련
  'User already registered': (t) => t.auth.errEmailAlreadyRegistered,
  'Email already registered': (t) => t.auth.errEmailAlreadyRegistered,
  'Signup requires a valid password': (t) => t.auth.errValidPasswordRequired,
  'Unable to validate email address: invalid format': (t) => t.auth.invalidEmailFormat,

  // 세션 관련
  'Session expired': (t) => t.auth.errSessionExpired,
  'Invalid token': (t) => t.auth.errInvalidToken,
  'Token has expired': (t) => t.auth.errTokenExpired,
  'No user found': (t) => t.profile.userNotFound,

  // 이메일 관련
  'Email link is invalid or has expired': (t) => t.auth.errEmailLinkInvalid,
  'Invalid email': (t) => t.auth.invalidEmailFormat,
  'For security purposes, you can only request this once every 60 seconds': (t) => t.auth.errRequestCooldown,

  // 일반 에러
  'Network error': (t) => t.auth.errNetwork,
  'Server error': (t) => t.auth.errServer,
  'Something went wrong': (t) => t.auth.errGeneric,
  'Unable to process request': (t) => t.auth.errRequestFailed,

  // OAuth 관련
  'OAuth error': (t) => t.auth.errOAuth,
  'Callback URL mismatch': (t) => t.auth.errCallbackMismatch,
};

/**
 * 에러 메시지를 현재 로케일 문구로 변환합니다.
 * 매칭되는 메시지가 없으면 원본 메시지를 반환합니다(기존 동작 유지).
 *
 * @param error - 에러 메시지 문자열 또는 에러 객체
 * @param t - 호출처의 번역 사전(useI18n().t)
 * @returns 현재 로케일로 변환된 에러 메시지
 */
export function translateError(
  error: string | { message?: string } | null | undefined,
  t: TranslationKeys,
): string {
  if (!error) {
    return t.auth.errUnknown;
  }

  const errorMessage = typeof error === 'string' ? error : error.message;
  // message 없는 에러 객체 — 예전엔 한국어 기본 문구를 아래 매칭에 그대로 흘려 보냈고 그 결과도
  // 기본 문구였다. 번역 문구가 패턴 단어(login·email…)에 우연히 걸리지 않게 바로 반환.
  if (!errorMessage) {
    return t.auth.errUnknown;
  }

  // 정확히 일치하는 메시지 찾기 (프로토타입 키 'constructor' 등은 제외)
  if (Object.prototype.hasOwnProperty.call(errorMessages, errorMessage)) {
    return errorMessages[errorMessage](t);
  }

  // 부분 일치 검색 (case-insensitive)
  const lowerMessage = errorMessage.toLowerCase();
  for (const [key, value] of Object.entries(errorMessages)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value(t);
    }
  }

  // 특정 패턴 매칭
  if (lowerMessage.includes('password')) {
    if (lowerMessage.includes('weak') || lowerMessage.includes('strong')) {
      return t.auth.errPasswordWeak;
    }
    if (lowerMessage.includes('match') || lowerMessage.includes('same') || lowerMessage.includes('different')) {
      return t.auth.errSamePassword;
    }
    if (lowerMessage.includes('short') || lowerMessage.includes('length') || lowerMessage.includes('characters')) {
      return t.settingsPage.passwordTooShort;
    }
    return t.auth.errPassword;
  }

  if (lowerMessage.includes('email')) {
    if (lowerMessage.includes('invalid') || lowerMessage.includes('format')) {
      return t.auth.invalidEmailFormat;
    }
    if (lowerMessage.includes('exists') || lowerMessage.includes('already') || lowerMessage.includes('registered')) {
      return t.auth.errEmailAlreadyRegistered;
    }
    if (lowerMessage.includes('confirm') || lowerMessage.includes('verify')) {
      return t.auth.errEmailNotConfirmed;
    }
    return t.auth.errEmail;
  }

  if (lowerMessage.includes('network')) {
    return t.auth.errNetwork;
  }

  if (lowerMessage.includes('token') || lowerMessage.includes('session') || lowerMessage.includes('expire')) {
    return t.auth.errSessionExpiredRelogin;
  }

  if (lowerMessage.includes('credentials') || lowerMessage.includes('login') || lowerMessage.includes('incorrect')) {
    return t.auth.errInvalidCredentials;
  }

  // 매칭되지 않으면 원본 메시지 반환 (기존 동작 유지 — 일반 문구 대체는 사용자 결정 대기)
  return errorMessage;
}
