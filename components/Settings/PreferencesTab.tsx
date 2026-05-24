'use client';

import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import { Toggle } from '@/components/UI/Toggle';

interface PreferencesTabProps {
  interests: string[];
  setInterests: (v: string[]) => void;
  dietary: string[];
  setDietary: (v: string[]) => void;
  allergies: string;
  setAllergies: (v: string) => void;
  cuisineOptions: { value: string; icon: string }[];
  dietaryOptions: string[];
  // 프라이버시 토글 — 즉시 저장(NotificationsTab 패턴). 부모가 옵티미스틱+롤백 담당.
  showSavedToPublic: boolean;
  showCookedToPublic: boolean;
  onTogglePrivacy: (field: 'show_saved_to_public' | 'show_cooked_to_public', value: boolean) => void;
  privacySaving: boolean;
  // 명시 폼(관심사/식단/알러지) — 하단 버튼으로 batched.
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
  showCookedToPublic,
  onTogglePrivacy,
  privacySaving,
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
          <Toggle
            icon="👅"
            label={sp.privacySaved}
            checked={showSavedToPublic}
            onChange={() => onTogglePrivacy('show_saved_to_public', !showSavedToPublic)}
            disabled={privacySaving}
          />
          <Toggle
            icon="🎉"
            label={sp.privacyCooked}
            checked={showCookedToPublic}
            onChange={() => onTogglePrivacy('show_cooked_to_public', !showCookedToPublic)}
            disabled={privacySaving}
          />
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
