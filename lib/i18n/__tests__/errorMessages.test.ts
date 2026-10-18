import { describe, it, expect } from 'vitest';
import { translateError } from '../errorMessages';
import { ko } from '../locales/ko';
import { loadLocale, SUPPORTED_LANGUAGES } from '../locales';

type ErrorInput = Parameters<typeof translateError>[0];

// 2026-10-04 PAU-06 리팩터 *전* translateError(한국어 고정 반환)의 실제 출력 — ko 동일성 골든.
// (리팩터 전 사본을 Node 로 실행해 얻은 값. 입력 = 정확일치 키 전부 + 부분일치 + 패턴 + 미매칭)
const GOLDEN: Array<[ErrorInput, string]> = [
  [null, '알 수 없는 오류가 발생했습니다'],
  [undefined, '알 수 없는 오류가 발생했습니다'],
  ['', '알 수 없는 오류가 발생했습니다'],
  [{}, '알 수 없는 오류가 발생했습니다'],
  [{ message: '' }, '알 수 없는 오류가 발생했습니다'],
  [{ message: undefined }, '알 수 없는 오류가 발생했습니다'],
  ['New password should be different from the old password', '새 비밀번호는 기존 비밀번호와 달라야 합니다'],
  ['Password should be at least 6 characters', '비밀번호는 최소 6자 이상이어야 합니다'],
  ['Password is too weak', '비밀번호가 너무 약합니다'],
  ['Invalid login credentials', '이메일 또는 비밀번호가 일치하지 않습니다'],
  ['Email not confirmed', '이메일 인증이 필요합니다'],
  ['Invalid email or password', '이메일 또는 비밀번호가 일치하지 않습니다'],
  ['User not found', '사용자를 찾을 수 없습니다'],
  ['User already registered', '이미 등록된 이메일입니다'],
  ['Email already registered', '이미 등록된 이메일입니다'],
  ['Signup requires a valid password', '유효한 비밀번호가 필요합니다'],
  ['Unable to validate email address: invalid format', '올바른 이메일 형식이 아닙니다'],
  ['Session expired', '세션이 만료되었습니다'],
  ['Invalid token', '유효하지 않은 토큰입니다'],
  ['Token has expired', '토큰이 만료되었습니다'],
  ['No user found', '사용자를 찾을 수 없습니다'],
  ['Email link is invalid or has expired', '이메일 링크가 유효하지 않거나 만료되었습니다'],
  ['Invalid email', '올바른 이메일 형식이 아닙니다'],
  ['For security purposes, you can only request this once every 60 seconds', '보안을 위해 60초마다 한 번만 요청할 수 있습니다'],
  ['Network error', '네트워크 오류가 발생했습니다'],
  ['Server error', '서버 오류가 발생했습니다'],
  ['Something went wrong', '오류가 발생했습니다'],
  ['Unable to process request', '요청을 처리할 수 없습니다'],
  ['OAuth error', 'OAuth 인증 중 오류가 발생했습니다'],
  ['Callback URL mismatch', '콜백 URL이 일치하지 않습니다'],
  ['AuthApiError: Invalid login credentials', '이메일 또는 비밀번호가 일치하지 않습니다'],
  ['invalid login credentials', '이메일 또는 비밀번호가 일치하지 않습니다'],
  ['New password should be different from the old password.', '새 비밀번호는 기존 비밀번호와 달라야 합니다'],
  ['Password should be at least 6 characters.', '비밀번호는 최소 6자 이상이어야 합니다'],
  ['USER ALREADY REGISTERED', '이미 등록된 이메일입니다'],
  ['Email not confirmed yet', '이메일 인증이 필요합니다'],
  ['Request failed: Network error (offline)', '네트워크 오류가 발생했습니다'],
  ['oauth error: access_denied', 'OAuth 인증 중 오류가 발생했습니다'],
  ['Invalid email address', '올바른 이메일 형식이 아닙니다'],
  ['Password must be stronger', '비밀번호가 너무 약합니다'],
  ['password does not match', '새 비밀번호는 기존 비밀번호와 달라야 합니다'],
  ['password is the same as before', '새 비밀번호는 기존 비밀번호와 달라야 합니다'],
  ['Password too short', '비밀번호는 최소 8자 이상이어야 합니다'],
  ['Password length invalid', '비밀번호는 최소 8자 이상이어야 합니다'],
  ['Password must contain 8 characters', '비밀번호는 최소 8자 이상이어야 합니다'],
  ['Password problem', '비밀번호 오류가 발생했습니다'],
  ['email address is invalid', '올바른 이메일 형식이 아닙니다'],
  ['Email format wrong', '올바른 이메일 형식이 아닙니다'],
  ['email already exists', '이미 등록된 이메일입니다'],
  ['This email is registered', '이미 등록된 이메일입니다'],
  ['Please confirm your email', '이메일 인증이 필요합니다'],
  ['verify your email first', '이메일 인증이 필요합니다'],
  ['Email rate limit exceeded', '이메일 오류가 발생했습니다'],
  ['network request failed', '네트워크 오류가 발생했습니다'],
  ['NetworkError when attempting to fetch resource.', '네트워크 오류가 발생했습니다'],
  ['jwt token is malformed', '세션이 만료되었습니다. 다시 로그인해주세요'],
  ['Auth session missing!', '세션이 만료되었습니다. 다시 로그인해주세요'],
  ['Refresh Token Not Found', '세션이 만료되었습니다. 다시 로그인해주세요'],
  ['link expired', '세션이 만료되었습니다. 다시 로그인해주세요'],
  ['bad credentials', '이메일 또는 비밀번호가 일치하지 않습니다'],
  ['login failed', '이메일 또는 비밀번호가 일치하지 않습니다'],
  ['incorrect value supplied', '이메일 또는 비밀번호가 일치하지 않습니다'],
  ['Rate limit exceeded', 'Rate limit exceeded'],
  ['Some random error', 'Some random error'],
  ['For security purposes, you can only request this after 59 seconds.', 'For security purposes, you can only request this after 59 seconds.'],
  ['Database error saving new user', 'Database error saving new user'],
  [{ message: 'Invalid login credentials' }, '이메일 또는 비밀번호가 일치하지 않습니다'],
  [{ message: 'weird failure' }, 'weird failure'],
];

const HANGUL = /[가-힣]/;

describe('translateError — ko 출력은 리팩터 전과 동일 (PAU-06)', () => {
  it.each(GOLDEN)('%j', (input, expected) => {
    expect(translateError(input, ko)).toBe(expected);
  });
});

describe('translateError — 비-ko 로케일은 한글을 노출하지 않는다 (PAU-06)', () => {
  for (const lang of SUPPORTED_LANGUAGES.filter((l) => l !== 'ko')) {
    it(lang, async () => {
      const t = await loadLocale(lang);
      for (const [input, koOut] of GOLDEN) {
        const out = translateError(input, t);
        expect(out.length).toBeGreaterThan(0);
        expect(HANGUL.test(out), `${lang} ${JSON.stringify(input)} → ${out}`).toBe(false);
        const raw = typeof input === 'string' ? input : input?.message;
        if (koOut === raw) {
          // 미매칭 → 원문 그대로(기존 동작) — 로케일 무관
          expect(out).toBe(raw);
        } else {
          // 번역된 경우 ko 문구와 달라야 한다(번역 누락 감지)
          expect(out).not.toBe(koOut);
        }
      }
    });
  }
});

describe('translateError — 대표 시나리오', () => {
  it('en 로그인 실패 → 영어 문구', async () => {
    const en = await loadLocale('en');
    expect(translateError({ message: 'Invalid login credentials' }, en)).toBe(en.auth.errInvalidCredentials);
    expect(translateError({ message: 'Invalid login credentials' }, en)).toBe('Incorrect email or password');
  });

  it('기존 키 재사용: 이메일 형식·사용자 없음·8자', () => {
    expect(translateError('Invalid email', ko)).toBe(ko.auth.invalidEmailFormat);
    expect(translateError('User not found', ko)).toBe(ko.profile.userNotFound);
    expect(translateError('Password too short', ko)).toBe(ko.settingsPage.passwordTooShort);
  });

  it('프로토타입 키는 매핑으로 취급하지 않고 원문 반환', () => {
    // 리팩터 전엔 errorMessages['constructor'] 가 Object 함수(문자열 아님)를 돌려주던 잠재 버그 — 실입력 아님
    expect(translateError('constructor', ko)).toBe('constructor');
    expect(translateError('toString', ko)).toBe('toString');
  });
});
