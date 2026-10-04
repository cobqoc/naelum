import Link from '@/components/Common/LocalizedLink';
import type { TranslationKeys } from '@/lib/i18n/locales';

/**
 * 가입 약관 동의 체크박스 묶음(전체 동의 + 필수 3 + 선택 1) — 순수 표현 (2026-10-04 PAU-15).
 *
 * auth/terms-agreement ↔ signup/set-password 에 178줄씩 복제(+ 파일 안 4회 반복)돼 있던 블록을
 * 행 목록 매핑 1벌로. 상태는 페이지가 그대로 소유(동의 4개 boolean + setter 를 바인딩으로 전달) —
 * 제출 검증 로직 무변경. DOM 순서·className·Link(target/stopPropagation)·텍스트가 원본과 바이트
 * 단위로 같다(렌더 동등성 하네스 확인). 전체 동의가 첫 checkbox 인 순서도 유지
 * (e2e/auth-onboarding-complete.spec.ts 가 `input[type="checkbox"]`.first() 로 의존).
 */
export type ConsentKey = 'terms' | 'privacy' | 'copyright' | 'marketing';
export type ConsentBindings = Record<ConsentKey, { checked: boolean; set: (checked: boolean) => void }>;

interface ConsentCheckboxesProps {
  t: TranslationKeys;
  consents: ConsentBindings;
  /** 바깥 div className — 'space-y-4 mb-6'(약관) | 'pt-2 space-y-3'(비밀번호 설정) */
  containerClassName: string;
  /** 전체 동의 줄 아래 여백 — 'pb-3'(약관) | 'pb-2'(비밀번호 설정) */
  agreeAllPaddingClassName: string;
}

const CHECKBOX_INPUT_CLASS =
  'peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-white/30 bg-background-primary transition-all checked:border-accent-warm checked:bg-accent-warm hover:border-accent-warm/50';

/** 체크박스 input + 체크 표시 svg (peer-checked 로 표시) */
function CheckboxBox({
  checked,
  onChange,
  wrapperClassName,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  wrapperClassName: string;
}) {
  return (
    <div className={wrapperClassName}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={CHECKBOX_INPUT_CLASS}
      />
      <svg
        className="pointer-events-none absolute h-3 w-3 text-background-primary opacity-0 peer-checked:opacity-100 transition-opacity"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export default function ConsentCheckboxes({
  t,
  consents,
  containerClassName,
  agreeAllPaddingClassName,
}: ConsentCheckboxesProps) {
  // 행 순서 = 원본 순서(이용약관 → 개인정보 → 저작권 → 마케팅). 하단은 상세 링크 또는 설명.
  const rows: Array<{
    key: ConsentKey;
    label: string;
    required: boolean;
    detailHref?: '/terms' | '/privacy';
    desc?: string;
  }> = [
    { key: 'terms', label: t.auth.termsAgreeLabel, required: true, detailHref: '/terms' },
    { key: 'privacy', label: t.auth.termsPrivacyLabel, required: true, detailHref: '/privacy' },
    { key: 'copyright', label: t.auth.termsCopyrightLabel, required: true, desc: t.auth.termsCopyrightDesc },
    { key: 'marketing', label: t.auth.termsMarketingLabel, required: false, desc: t.auth.termsMarketingDesc },
  ];

  const { terms, privacy, copyright, marketing } = consents;

  return (
    <div className={containerClassName}>
      {/* 전체 동의 — setter 호출 순서(약관→개인정보→저작권→마케팅)도 원본 그대로 */}
      <label className={`flex items-center gap-3 cursor-pointer ${agreeAllPaddingClassName} border-b border-white/10`}>
        <CheckboxBox
          checked={terms.checked && privacy.checked && copyright.checked && marketing.checked}
          onChange={(checked) => {
            terms.set(checked);
            privacy.set(checked);
            copyright.set(checked);
            marketing.set(checked);
          }}
          wrapperClassName="relative flex items-center justify-center"
        />
        <span className="text-sm font-semibold text-text-primary">{t.auth.agreeAll}</span>
      </label>

      {rows.map((row) => (
        <label key={row.key} className="flex items-start gap-3 cursor-pointer group">
          <CheckboxBox
            checked={consents[row.key].checked}
            onChange={consents[row.key].set}
            wrapperClassName="relative flex items-center justify-center mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                {row.label}
              </span>
              {row.required ? (
                <span className="text-xs text-error font-medium">{t.auth.termsRequiredLabel}</span>
              ) : (
                <span className="text-xs text-text-muted">{t.auth.termsOptionalLabel}</span>
              )}
            </div>
            {row.detailHref ? (
              <Link
                href={row.detailHref}
                target="_blank"
                className="text-xs text-text-muted hover:text-accent-warm underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t.auth.termsViewDetail}
              </Link>
            ) : (
              <p className="text-xs text-text-muted mt-0.5">
                {row.desc}
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
