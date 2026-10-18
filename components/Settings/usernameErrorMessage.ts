import { defaultLocale, type TranslationKeys } from '@/lib/i18n/locales';

/**
 * 닉네임 중복확인(GET /api/users/check-username) 실패 사유 → 현재 로케일 문구.
 *
 * 서버는 한글 문자열만 돌려준다(서버 i18n 미도입 — 문구 출처 lib/utils/usernameValidator.ts ·
 * app/api/users/check-username/route.ts). 그 원문을 UI 에 그대로 쓰면 비-ko 로케일에 한글이 노출되므로
 * (PAU-20, 2026-10-04) **ko 로케일 값이 서버 문구와 같은 키**를 찾아 그 키의 현재 로케일 번역을 쓴다
 * — ko 화면 출력은 예전(서버 원문)과 동일. 서버 문구가 바뀌어 못 찾으면 일반 문구(usernameErrReserved).
 * ⚠️ 서버 문구를 바꾸면 ko.ts settingsPage.usernameErr* 값도 같이 바꿀 것.
 */
const USERNAME_ERROR_KEYS = [
  'usernameErrLength',
  'usernameErrCharset',
  'usernameErrProfanity',
  'usernameErrReserved',
  'usernameErrTaken',
] as const;

export function usernameErrorMessage(
  serverError: unknown,
  sp: TranslationKeys['settingsPage'],
): string {
  const key = USERNAME_ERROR_KEYS.find((k) => defaultLocale.settingsPage[k] === serverError);
  return sp[key ?? 'usernameErrReserved'];
}
