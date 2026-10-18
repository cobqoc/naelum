import { localDateISO } from '@/lib/date/localDate';
import type { TranslationKeys } from '@/lib/i18n/locales';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';

/**
 * 생년월일(연령 gate) 입력 블록 — 순수 표현 (2026-10-04 PAU-15).
 * auth/terms-agreement ↔ signup/set-password 에 복제돼 있던 블록 1벌. 두 화면의 차이(바깥 여백·
 * 입력 배경)는 className 인자로 그대로 받는다. 마크업은 원본과 바이트 단위로 같다(하네스 확인).
 * max 는 사용자 *로컬* 오늘(lib/date/localDate — UTC 날짜 금지 규칙).
 */
interface BirthDateFieldProps {
  t: TranslationKeys;
  value: string;
  setValue: (v: string) => void;
  /** 바깥 div className — 'space-y-1.5 mb-5'(약관) | 'space-y-1.5'(비밀번호 설정) */
  wrapperClassName: string;
  /** InputBoxWrapper className — 배경색만 화면별로 다름 */
  boxClassName: string;
}

export default function BirthDateField({ t, value, setValue, wrapperClassName, boxClassName }: BirthDateFieldProps) {
  return (
    <div className={wrapperClassName}>
      <label className="text-sm font-medium text-text-secondary">
        {t.auth.birthDateLabel} <span className="text-error">*</span>
      </label>
      <InputBoxWrapper className={boxClassName}>
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          max={localDateISO()}
          className={INPUT_INNER_COMFORTABLE_CLASS}
          style={INPUT_INNER_STYLE}
          required
        />
      </InputBoxWrapper>
      <p className="text-[11px] text-text-muted">
        {t.auth.ageGateNotice}
      </p>
    </div>
  );
}
