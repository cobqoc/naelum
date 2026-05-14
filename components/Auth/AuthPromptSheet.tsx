'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from '@/components/Common/LocalizedLink';
import { useI18n } from '@/lib/i18n/context';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';

interface AuthPromptSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthPromptSheet({ isOpen, onClose }: AuthPromptSheetProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState<'google' | 'kakao' | null>(null);
  useEscapeKey(onClose, isOpen);

  const handleGoogle = async () => {
    setLoading('google');
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    setLoading(null);
  };

  const handleKakao = async () => {
    setLoading('kakao');
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm bg-background-primary rounded-t-3xl sm:rounded-2xl border border-white/10 shadow-2xl p-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 모바일 드래그 핸들 */}
        <div className="mx-auto w-10 h-1 rounded-full bg-white/20 mb-5 sm:hidden" />

        <div className="text-center mb-6">
          <div className="text-4xl mb-3" aria-hidden="true">🧺</div>
          <h2 className="text-base font-bold text-text-primary">{t.home.authPromptTitle}</h2>
          <p className="text-sm text-text-secondary mt-1">{t.home.authPromptDesc}</p>
        </div>

        <div className="space-y-3">
          {/* 카카오 */}
          <button
            onClick={handleKakao}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-60"
            style={{ backgroundColor: '#FEE500', color: '#000000' }}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.62 1.74 4.93 4.36 6.27-.14.53-.9 3.4-.93 3.6 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.62.09 1.27.14 1.96.14 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
            </svg>
            {loading === 'kakao' ? '...' : t.home.authPromptKakao}
          </button>

          {/* 구글 */}
          <button
            onClick={handleGoogle}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-white text-gray-800 py-3 text-sm font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading === 'google' ? '...' : t.home.authPromptGoogle}
          </button>

          <Link
            href="/signup"
            className="w-full flex items-center justify-center rounded-xl bg-accent-warm/15 border border-accent-warm/30 text-accent-warm py-3 text-sm font-semibold hover:bg-accent-warm/25 active:scale-[0.98] transition-all"
          >
            {t.home.authPromptEmail}
          </Link>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          {t.home.authPromptHasAccount}{' '}
          <Link href="/login" className="text-accent-warm font-semibold hover:underline">
            {t.home.authPromptLoginLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
