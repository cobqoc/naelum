'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { COUNTRIES } from '@/components/Onboarding/countries';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';

interface ProfileTabProps {
  username: string;
  setUsername: (v: string) => void;
  usernameError: string | null;
  checkingUsername: boolean;
  bio: string;
  setBio: (v: string) => void;
  avatarUrl: string | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarRemove: () => void;
  birthDate: string | null;
  setBirthDate: (v: string | null) => void;
  gender: string | null;
  setGender: (v: string | null) => void;
  country: string | null;
  setCountry: (v: string | null) => void;
  saving: boolean;
  /** 부모(settings/page.tsx)가 단일 출처로 계산해 전달 — 중복 계산 회피 */
  isDirty: boolean;
  onSave: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

export default function ProfileTab({
  username,
  setUsername,
  usernameError,
  checkingUsername,
  bio,
  setBio,
  avatarUrl,
  onAvatarChange,
  onAvatarRemove,
  birthDate,
  setBirthDate,
  gender,
  setGender,
  country,
  setCountry,
  saving,
  isDirty,
  onSave,
  t,
}: ProfileTabProps) {
  const sp = t.settingsPage;
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={sp.changePhoto}
          className="relative w-24 h-24 rounded-full bg-background-secondary overflow-hidden ring-2 ring-white/10 hover:ring-accent-warm transition-all"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl" aria-hidden="true">👤</div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" aria-hidden="true">
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
          <InputBoxWrapper className={`!bg-background-secondary !rounded-xl !pl-8 !pr-10 !py-3 ${
            usernameError ? '!ring-error' : username && !usernameError && !checkingUsername ? '!ring-success' : ''
          }`}>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                // 한글·일본어·중국어 IME 조합 중에는 filter 보류 — 조합이 끝나면 마지막 onChange 가 다시 발화되므로 그때 처리.
                // 조합 중 filter 하면 대소문자 변환 등으로 시각 흔들림·문자 fragmentation 가능.
                if ((e.nativeEvent as InputEvent).isComposing) {
                  setUsername(e.target.value);
                  return;
                }
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
              className={INPUT_INNER_COMFORTABLE_CLASS}
              style={INPUT_INNER_STYLE}
              placeholder={sp.usernameLabel}
              maxLength={20}
            />
          </InputBoxWrapper>
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
        <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3 !min-h-[80px] !items-start">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`${INPUT_INNER_COMFORTABLE_CLASS} resize-none`}
            style={INPUT_INNER_STYLE}
            placeholder={sp.bioLabel}
            rows={3}
            maxLength={200}
          />
        </InputBoxWrapper>
        <p className="text-xs text-text-muted text-right">{bio.length}/200</p>
      </div>

      {/* Birth Date — max=오늘 (미래 날짜 입력 차단) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">{sp.birthDate}</label>
        <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
          <input
            type="date"
            value={birthDate || ''}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthDate(e.target.value || null)}
            className={INPUT_INNER_COMFORTABLE_CLASS}
            style={INPUT_INNER_STYLE}
          />
        </InputBoxWrapper>
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
        <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-3">
        <select
          value={country || ''}
          onChange={(e) => setCountry(e.target.value || null)}
          className={INPUT_INNER_COMFORTABLE_CLASS}
          style={INPUT_INNER_STYLE}
        >
          <option value="">{sp.notSelected}</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name} ({c.nameEn})
            </option>
          ))}
        </select>
        </InputBoxWrapper>
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
