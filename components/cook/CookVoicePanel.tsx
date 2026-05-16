import type { TranslationKeys } from '@/lib/i18n/translations';
import type { useVoiceGuide } from '@/lib/hooks/useVoiceGuide';

/**
 * 쿠킹 모드 음성 안내 설정 패널 (순수 표현).
 *
 * god-file(RecipeCookMode) 분해 Phase 2. voice 상태·로직은 useVoiceGuide
 * 훅(부모 소유) — 값+콜백만. JSX·className 원본과 byte-identical → 행위 변경 0.
 */

type VoiceGuide = ReturnType<typeof useVoiceGuide>;

export default function CookVoicePanel({ voice, t }: { voice: VoiceGuide; t: TranslationKeys }) {
  return (
    <div className="flex-shrink-0 px-4 py-3 bg-background-secondary border-b border-white/5">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={voice.toggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            voice.isEnabled
              ? 'bg-accent-warm text-background-primary'
              : 'bg-background-tertiary text-text-muted'
          }`}
        >
          {voice.isEnabled ? t.cookMode.voiceOnLabel : t.cookMode.voiceOffLabel}
        </button>
        {voice.isEnabled && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{t.cookMode.speedLabel}:</span>
            {(['slow', 'normal', 'fast'] as const).map(s => (
              <button
                key={s}
                onClick={() => voice.setSpeed(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  voice.speed === s
                    ? 'bg-accent-warm text-background-primary'
                    : 'bg-background-tertiary text-text-muted hover:bg-white/10'
                }`}
              >
                {s === 'slow' ? t.cookMode.speedSlow : s === 'normal' ? t.cookMode.speedNormal : t.cookMode.speedFast}
              </button>
            ))}
          </div>
        )}
      </div>
      {voice.isEnabled && voice.isSpeaking && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex gap-0.5">
            {[12, 18, 10, 16].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-accent-warm rounded-full animate-pulse"
                style={{
                  height: `${h}px`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-accent-warm">{t.cookMode.reading}</span>
          <button
            onClick={voice.stop}
            className="ml-auto text-xs text-text-muted hover:text-error transition-colors"
          >
            {t.cookMode.stopReading}
          </button>
        </div>
      )}
    </div>
  );
}
