'use client';

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
        <input
          type="text"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background-secondary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all"
          placeholder={t.settingsPage.allergyPlaceholder}
        />
        <p className="text-xs text-text-muted">{t.settingsPage.allergyHint}</p>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary">
          {sp.privacyTitle || '프라이버시'}
        </label>
        <p className="text-xs text-text-muted">
          {sp.privacyDesc || '다른 사용자가 내 프로필에서 볼 수 있는 정보를 설정합니다.'}
        </p>
        <div className="space-y-2">
          {/* Show saved to public */}
          <button
            type="button"
            onClick={() => setShowSavedToPublic(!showSavedToPublic)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background-secondary transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">👅</span>
              <span className="text-sm">{sp.privacySaved || '낼름함 공개'}</span>
            </div>
            <div className={`w-11 h-6 rounded-full transition-all relative ${showSavedToPublic ? 'bg-accent-warm' : 'bg-white/20'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${showSavedToPublic ? 'left-5.5' : 'left-0.5'}`}
                style={{ left: showSavedToPublic ? '22px' : '2px' }} />
            </div>
          </button>

          {/* Show cooked to public */}
          <button
            type="button"
            onClick={() => setShowCookedToPublic(!showCookedToPublic)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background-secondary transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🎉</span>
              <span className="text-sm">{sp.privacyCooked || '만들어봤어요 공개'}</span>
            </div>
            <div className={`w-11 h-6 rounded-full transition-all relative ${showCookedToPublic ? 'bg-accent-warm' : 'bg-white/20'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${showCookedToPublic ? 'left-5.5' : 'left-0.5'}`}
                style={{ left: showCookedToPublic ? '22px' : '2px' }} />
            </div>
          </button>
        </div>
        <p className="text-xs text-text-muted">
          {sp.privacyHint || '비활성화하면 다른 사용자가 내 프로필에서 해당 탭을 볼 수 없습니다.'}
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
