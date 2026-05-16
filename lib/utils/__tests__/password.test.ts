import { describe, it, expect } from 'vitest';
import { getPasswordStrength } from '../password';

// 로그인/회원가입/설정에서 공유하는 비밀번호 강도 계산.
// 4개 가산 규칙: 길이>=8 / 대문자 / 숫자 / 특수문자 각 +1 (0~4).

describe('getPasswordStrength', () => {
  it('빈 값 = 0', () => {
    expect(getPasswordStrength('')).toBe(0);
  });

  it('짧고 소문자만 = 0', () => {
    expect(getPasswordStrength('abc')).toBe(0);
  });

  it('8자 이상 소문자만 = 1 (길이만)', () => {
    expect(getPasswordStrength('abcdefgh')).toBe(1);
    expect(getPasswordStrength('aaaaaaaa')).toBe(1);
  });

  it('길이 + 대문자 = 2', () => {
    expect(getPasswordStrength('Abcdefgh')).toBe(2);
  });

  it('길이 + 대문자 + 숫자 = 3', () => {
    expect(getPasswordStrength('Abcdefg1')).toBe(3);
  });

  it('네 규칙 모두 충족 = 4', () => {
    expect(getPasswordStrength('Abcdef1!')).toBe(4);
  });

  it('짧지만 대문자+숫자+특수문자 = 3 (길이 미충족)', () => {
    expect(getPasswordStrength('Ab1!')).toBe(3);
  });

  it('8자 특수문자만 = 2 (길이 + 특수문자)', () => {
    expect(getPasswordStrength('!@#$%^&*')).toBe(2);
  });
});
