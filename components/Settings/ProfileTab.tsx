'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { COUNTRIES } from '@/components/Onboarding/countries';

interface ProfileTabProps {
  username: string;
  originalUsername: string;
  setUsername: (v: string) => void;
  usernameError: string | null;
  checkingUsername: boolean;
  bio: string;
  originalBio: string;
  setBio: (v: string) => void;
  avatarUrl: string | null;
  originalAvatarUrl: string | null;
  avatarFile: File | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarRemove: () => void;
  birthDate: string | null;
  originalBirthDate: string | null;
  setBirthDate: (v: string | null) => void;
  gender: string | null;
  originalGender: string | null;
  setGender: (v: string | null) => void;
  country: string | null;
  originalCountry: string | null;
  setCountry: (v: string | null) => void;
  saving: boolean;
  onSave: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

export default function ProfileTab({
  username,
  originalUsername,
  setUsername,
  usernameError,
  checkingUsername,
  bio,
  originalBio,
  setBio,
  avatarUrl,
  originalAvatarUrl,
  avatarFile,
  onAvatarChange,
  onAvatarRemove,
  birthDate,
  originalBirthDate,
  setBirthDate,
  gender,
  originalGender,
  setGender,
  country,
  originalCountry,
  setCountry,
  saving,
  onSave,
  t,
}: ProfileTabProps) {
  const sp = t.settingsPage;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty =
    username !== originalUsername ||
    bio !== originalBio ||
    avatarFile !== null ||
    avatarUrl !== originalAvatarUrl ||
    birthDate !== originalBirthDate ||
    gender !== originalGender ||
    country !== originalCountry;

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onAvatarChange}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative w-24 h-24 rounded-full bg-background-secondary overflow-hidden ring-2 ring-white/10 hover:ring-accent-warm transition-all"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-xs">{sp.changePhoto}</span>
          </div>
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-accent-warm hover:text-accent-hover transition-colors"
          >
            {sp.changePhoto}
          </button>
          {avatarUrl && (
            <>
              <span className="text-text-muted text-xs">·</span>
              <button
                type="button"
                onClick={onAvatarRemove}
                className="text-xs text-error hover:text-error/80 transition-colors"
              >
                {sp.removePhoto}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{sp.usernameLabel} *</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              const filtered = e.target.value
                .split('')
                .map(char => {
                  if (/[A-Z]/.test(char)) return char.toLowerCase();
                  if (/[a-z0-9_가-힣ㄱ-ㅎㅏ-ㅣ]/.test(char)) return char;
                  return '';
                })
                .join('');
              setUsername(filtered);
            }}
            className={`w-full pl-8 pr-10 py-3 rounded-xl bg-background-secondary outline-none ring-1 transition-all ${
              usernameError ? 'ring-error' : username && !usernameError && !checkingUsername ? 'ring-success' : 'ring-white/10 focus:ring-2 focus:ring-accent-warm'
            }`}
            placeholder={sp.usernameLabel}
            maxLength={20}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {checkingUsername && (
              <div className="w-4 h-4 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
            )}
            {!checkingUsername && username && !usernameError && (
              <span className="text-success">✓</span>
            )}
            {!checkingUsername && usernameError && (
              <span className="text-error">✗</span>
            )}
          </div>
        </div>
        <p className="text-xs text-text-muted">{sp.usernameHint}</p>
        {usernameError && <p className="text-xs text-error">{usernameError}</p>}
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{sp.bioLabel}</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background-secondary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all resize-none"
          placeholder={sp.bioLabel}
          rows={3}
          maxLength={200}
        />
        <p className="text-xs text-text-muted text-right">{bio.length}/200</p>
      </div>

      {/* Birth Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{sp.birthDate}</label>
        <input
          type="date"
          value={birthDate || ''}
          onChange={(e) => setBirthDate(e.target.value || null)}
          className="w-full px-4 py-3 rounded-xl bg-background-secondary text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all"
        />
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{sp.gender}</label>
        <div className="flex gap-3">
          {[
            { value: 'male', label: sp.male },
            { value: 'female', label: sp.female },
            { value: 'other', label: sp.other },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGender(option.value)}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                gender === option.value
                  ? 'bg-accent-warm text-background-primary'
                  : 'bg-background-secondary text-text-secondary hover:bg-white/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {gender && (
          <button
            type="button"
            onClick={() => setGender(null)}
            className="text-xs text-text-muted hover:text-accent-warm transition-colors"
          >
            {sp.clearSelection}
          </button>
        )}
      </div>

      {/* Country */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{sp.country}</label>
        <select
          value={country || ''}
          onChange={(e) => setCountry(e.target.value || null)}
          className="w-full px-4 py-3 rounded-xl bg-background-secondary text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all"
        >
          <option value="">{sp.notSelected}</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name} ({c.nameEn})
            </option>
          ))}
        </select>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={saving || !!usernameError || checkingUsername || !username || username.trim().length < 2 || !isDirty}
        className="w-full py-3.5 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover disabled:opacity-50 transition-all"
      >
        {saving ? sp.saving : sp.saveProfile}
      </button>
    </div>
  );
}
