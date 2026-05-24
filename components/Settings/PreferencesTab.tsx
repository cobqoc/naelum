'use client';

import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';

interface PreferencesTabProps {
  interests: string[];
  setInterests: (v: string[]) => void;
  dietary: string[];
  setDietary: (v: string[]) => void;
  allergies: string;
  setAllergies: (v: string) => void;
  cuisineOptions: { value: string; icon: string }[];
  dietaryOptions: string[];
  showSavedToPublic: boolean;
  setShowSavedToPublic: (v: boolean) => void;
  showCookedToPublic: boolean;
  setShowCookedToPublic: (v: boolean) => void;
  saving: boolean;
  onSave: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
  setList(
    list.includes(item)
      ? list.filter(i => i !== item)
      : [...list, item]
  );
}

export default function PreferencesTab({
  interests,
  setInterests,
  dietary,
  setDietary,
  allergies,
  setAllergies,
  cuisineOptions,
  dietaryOptions,
  showSavedToPublic,
  setShowSavedToPublic,
  showCookedToPublic,
  setShowCookedToPublic,
  saving,
  onSave,
  t,
}: PreferencesTabProps) {
  const sp = t.settingsPage;
  return (
    <div className="space-y-8">
      {/* Interests */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary">{t.settingsPage.interests}</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {cuisineOptions.map(item => (
            <button
              key={item.value}
              onClick={() => toggleItem(interests, setInterests, item.value)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl text-sm transition-all border ${
                interests.includes(item.value)
                  ? 'bg-accent-warm/10 border-accent-warm text-accent-warm'
                  : 'bg-background-secondary border-transparent text-text-secondary hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs">{item.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dietary */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary">{t.settingsPage.dietary}</label>
        <div className="space-y-2">
          {dietaryOptions.map(item => (
            <button
              key={item}
              onClick={() => toggleItem(dietary, setDietary, item)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                dietary.includes(item)
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-secondary text-text-secondary hover:bg-white/5'
              }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                dietary.includes(item) ? 'border-background-primary' : 'border-white/20'
              }`}>
                {dietary.includes(item) && <span className="text-xs">✓</span>}
              </div>
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{t.settingsPage.allergyLabel}</label>
        <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
          <input
            type="text"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            className={INPUT_INNER_COMFORTABLE_CLASS}
            style={INPUT_INNER_STYLE}
            placeholder={t.settingsPage.allergyPlaceholder}
          />
        </InputBoxWrapper>
        <p className="text-xs text-text-muted">{t.settingsPage.allergyHint}</p>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary">
          {sp.privacyTitle}
        </label>
        <p className="text-xs text-text-muted">
          {sp.privacyDesc}
        </p>
        <div className="space-y-2">
          {/* Show saved to public — row 전체가 토글 (a11y: role=switch + aria-checked).
              Toggle 시각: NotificationsTab과 동일하게 translate-x-5 Tailwind 클래스 (inline left 제거). */}
          <button
            type="button"
            role="switch"
            aria-checked={showSavedToPublic}
            aria-label={sp.privacySaved}
            onClick={() => setShowSavedToPublic(!showSavedToPublic)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background-secondary transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg" aria-hidden="true">👅</span>
              <span className="text-sm">{sp.privacySaved}</span>
            </div>
            <div className={`w-11 h-6 rounded-full transition-all relative ${showSavedToPublic ? 'bg-accent-warm' : 'bg-white/20'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${showSavedToPublic ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* Show cooked to public */}
          <button
            type="button"
            role="switch"
            aria-checked={showCookedToPublic}
            aria-label={sp.privacyCooked}
            onClick={() => setShowCookedToPublic(!showCookedToPublic)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background-secondary transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg" aria-hidden="true">🎉</span>
              <span className="text-sm">{sp.privacyCooked}</span>
            </div>
            <div className={`w-11 h-6 rounded-full transition-all relative ${showCookedToPublic ? 'bg-accent-warm' : 'bg-white/20'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${showCookedToPublic ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
        <p className="text-xs text-text-muted">
          {sp.privacyHint}
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-3.5 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover disabled:opacity-50 transition-all"
      >
        {saving ? sp.saving : sp.savePreferences}
      </button>
    </div>
  );
}
