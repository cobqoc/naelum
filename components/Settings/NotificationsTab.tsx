'use client';

import { useState } from 'react';

interface NotificationsTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

interface NotificationPrefs {
  comments: boolean;
  recipes: boolean;
}

const STORAGE_KEY = 'naelum_notification_prefs';

function loadPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return { comments: true, recipes: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 'follows' 필드 있으면 무시 (기능 제거됨)
      return { comments: parsed.comments ?? true, recipes: parsed.recipes ?? true };
    }
  } catch {
    // ignore
  }
  return { comments: true, recipes: true };
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-accent-warm' : 'bg-white/20'}`}
      aria-checked={enabled}
      role="switch"
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function NotificationsTab({ t }: NotificationsTabProps) {
  const sp = t.settingsPage;
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => loadPrefs());
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof NotificationPrefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const items: { key: keyof NotificationPrefs; label: string; icon: string }[] = [
    { key: 'comments', label: sp.notificationComments, icon: '💬' },
    { key: 'recipes', label: sp.notificationRecipes, icon: '🍳' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-background-secondary space-y-1">
        <h3 className="font-bold mb-4">{sp.notificationsTab}</h3>
        <ul className="divide-y divide-white/5">
          {items.map(({ key, label, icon }) => (
            <li key={key} className="flex items-center gap-3 py-3">
              <span className="text-xl">{icon}</span>
              <span className="flex-1 text-sm">{label}</span>
              <Toggle enabled={prefs[key]} onToggle={() => toggle(key)} />
            </li>
          ))}
        </ul>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-success/20 text-success text-sm flex items-center gap-2">
          <span>✓</span> {sp.notificationSaved}
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all"
      >
        {sp.saving?.replace('...', '') || 'Save'} {sp.notificationsTab}
      </button>
    </div>
  );
}
