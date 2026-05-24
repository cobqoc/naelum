'use client';

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

// 공용 토글 — row 전체가 클릭 영역 (a11y hit target ↑).
// translate-x Tailwind 클래스로 cascade trap 회피 ([[feedback-tailwind-4-css-cascade-trap]]).
export function Toggle({ checked, onChange, label, description, icon, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-background-secondary transition-all disabled:opacity-50"
    >
      {icon && (
        <span className="text-xl shrink-0" aria-hidden="true">{icon}</span>
      )}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <div className={`shrink-0 w-11 h-6 rounded-full transition-all relative ${checked ? 'bg-accent-warm' : 'bg-white/20'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}
