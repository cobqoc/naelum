'use client';

import { useTheme } from '@/lib/theme/context';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Full toggle with 3 options
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-background-tertiary" role="radiogroup" aria-label="Theme selection">
      {(['light', 'dark', 'system'] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => setTheme(mode)}
          role="radio"
          aria-checked={theme === mode}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            theme === mode
              ? 'bg-accent-warm text-background-primary shadow-sm'
              : 'text-text-muted hover:text-text-primary hover:bg-white/5'
          }`}
        >
          {mode === 'light' && '☀️'}
          {mode === 'dark' && '🌙'}
          {mode === 'system' && '⚙️'}
        </button>
      ))}
    </div>
  );
}
