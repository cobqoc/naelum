import type { ReactNode } from 'react';
import type { TranslationKeys } from '@/lib/i18n/locales';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import EyeIcon from './EyeIcon';

/**
 * 새 비밀번호 입력 블록 — 순수 표현 (2026-10-04 PAU-14).
 *
 * reset-password ↔ signup/set-password 에 97줄 그대로 복제돼 있던 "비밀번호 입력 + 보기 토글 +
 * 강도 표시 / 확인 입력 + 일치 힌트" 를 1벌로. 상태·검증·제출은 페이지 소유 그대로(값+setter 만).
 * 마크업·className·속성 순서가 원본과 바이트 단위로 같다(렌더 동등성 하네스로 확인).
 * signin·ResetPasswordModal 의 비밀번호 입력은 padding·토글 위치·autoComplete 가 달라 대상 아님.
 */
interface PasswordFieldProps {
  /** 라벨 본문 — 뒤에 ' *'(필수 표시)가 붙는다 */
  label: string;
  value: string;
  setValue: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
  /** InputBoxWrapper className — 호출처의 원본 문자열 그대로(에러 링 조건 포함) */
  boxClassName: string;
  placeholder?: string;
  /** 입력 줄 아래 — 강도 표시(PasswordStrengthMeter) 또는 일치 힌트(PasswordMatchHint) */
  children?: ReactNode;
}

export function PasswordField({
  label,
  value,
  setValue,
  show,
  setShow,
  boxClassName,
  placeholder,
  children,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-secondary">{label} *</label>
      <div className="relative">
        <InputBoxWrapper className={boxClassName}>
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`${INPUT_INNER_COMFORTABLE_CLASS} pr-10`}
            style={INPUT_INNER_STYLE}
            placeholder={placeholder}
            autoComplete="new-password"
            required
          />
        </InputBoxWrapper>
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
        >
          <EyeIcon open={show} />
        </button>
      </div>
      {children}
    </div>
  );
}

/** 비밀번호 강도 막대 4칸 + 힌트/강도 라벨 줄 (strength = getPasswordStrength 결과 0~4) */
export function PasswordStrengthMeter({ strength, t }: { strength: number; t: TranslationKeys }) {
  return (
    <>
      <div className="flex gap-1 pt-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i <= strength ? (strength <= 2 ? 'bg-warning' : 'bg-success') : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-text-muted italic">{t.auth.passwordHint}</p>
        {strength > 0 && (
          <p className={`text-[10px] font-medium ${strength <= 2 ? 'text-warning' : 'text-success'}`}>
            {strength === 1 ? t.auth.passwordStrengthWeak
              : strength === 2 ? t.auth.passwordStrengthFair
              : strength === 3 ? t.auth.passwordStrengthStrong
              : t.auth.passwordStrengthVeryStrong}
          </p>
        )}
      </div>
    </>
  );
}

/** 비밀번호 확인 입력 아래 ✓ 일치 / ✗ 불일치 한 줄 (확인값이 비어 있으면 아무것도 안 그림) */
export function PasswordMatchHint({ password, confirm, t }: { password: string; confirm: string; t: TranslationKeys }) {
  return (
    <>
      {confirm && password === confirm && (
        <p className="text-xs text-success">✓ {t.auth.passwordMatch}</p>
      )}
      {confirm && password !== confirm && (
        <p className="text-xs text-error">✗ {t.auth.passwordMismatch}</p>
      )}
    </>
  );
}
