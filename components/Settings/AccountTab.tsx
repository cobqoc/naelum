'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { getPasswordStrength } from '@/lib/utils/password';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useCookieConsent } from '@/lib/cookieConsent/context';

const TwoFactorTab = dynamic(() => import('@/components/Settings/TwoFactorTab'), { ssr: false });

interface AccountTabProps {
  profile: { id: string; email: string; created_at: string } | null;
  supabase: SupabaseClient;
  router: AppRouterInstance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

interface BlockedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  blocked_at: string;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  );
}

export default function AccountTab({ profile, supabase, router, t }: AccountTabProps) {
  const sp = t.settingsPage;

  // Auth provider detection
  const [isSocialAccount, setIsSocialAccount] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      const providers = data.user?.app_metadata?.providers as string[] | undefined;
      const provider = data.user?.app_metadata?.provider as string | undefined;
      const isSocial =
        (providers && providers.length > 0 && !providers.includes('email')) ||
        (provider && provider !== 'email');
      setIsSocialAccount(!!isSocial);
    });
  }, [supabase]);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Email change
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  // Data export
  const [exporting, setExporting] = useState(false);

  const passwordStrength = getPasswordStrength(newPassword as string);

  const fetchBlockedUsers = useCallback(async () => {
    setBlockedLoading(true);
    try {
      const res = await fetch('/api/users/blocks');
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blockedUsers || []);
      }
    } catch {
      // ignore
    } finally {
      setBlockedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handleChangeEmail = async () => {
    setEmailError('');
    setEmailSuccess(false);

    if (!newEmail) {
      setEmailError(sp.email + ' ' + t.common.required);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError(sp.emailInvalid || '올바른 이메일 형식이 아닙니다');
      return;
    }

    if (newEmail === profile?.email) {
      setEmailError(sp.emailSame || '현재 이메일과 동일합니다');
      return;
    }

    setEmailSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) {
        setEmailError(error.message);
      } else {
        setEmailSuccess(true);
        setNewEmail('');
        setShowEmailChange(false);
      }
    } catch {
      setEmailError(t.common.error);
    }

    setEmailSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError(sp.currentPassword + ' ' + t.common.required);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(sp.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(sp.passwordsNotMatch);
      return;
    }

    setPasswordSaving(true);

    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError(t.auth?.wrongPassword || '현재 비밀번호가 올바르지 않습니다');
        setPasswordSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch {
      setPasswordError(t.common.error);
    }

    setPasswordSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== sp.deleteConfirmPhrase) return;

    setDeleting(true);

    try {
      const res = await fetch('/api/users/delete', { method: 'DELETE' });

      if (res.ok) {
        localStorage.removeItem('naelum_auto_login');
        localStorage.removeItem('naelum_saved_email');
        await supabase.auth.signOut();
        window.location.href = '/';
      } else {
        const data = await res.json();
        setDeleting(false);
        alert(data.error || t.common.error);
      }
    } catch {
      setDeleting(false);
      alert(t.common.error);
    }
  };

  const handleUnblock = async (username: string, userId: string) => {
    setUnblockingId(userId);
    try {
      const res = await fetch(`/api/users/${username}/block`, { method: 'DELETE' });
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      }
    } catch {
      // ignore
    } finally {
      setUnblockingId(null);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [recipesRes, savedRes] = await Promise.all([
        supabase.from('recipes').select('id, title, description, cuisine_type, dish_type, prep_time_minutes, cook_time_minutes, difficulty_level, servings, created_at').eq('author_id', user.id).eq('deleted_at', null as unknown as string),
        supabase.from('recipe_saves').select('recipe_id, created_at').eq('user_id', user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: { email: profile?.email, joined: profile?.created_at },
        recipes: recipesRes.data || [],
        saved_recipes: savedRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `naelum-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Account Info */}
        <div className="p-4 rounded-xl bg-background-secondary space-y-4">
          <h3 className="font-bold">{sp.accountInfo}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-text-muted">{sp.email}</span>
              <div className="flex items-center gap-2">
                <span>{profile?.email}</span>
                {!isSocialAccount && (
                  <button
                    onClick={() => { setShowEmailChange(!showEmailChange); setEmailError(''); setEmailSuccess(false); }}
                    className="text-accent-warm text-xs hover:underline"
                  >
                    {sp.emailChange || '변경'}
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">{sp.joinDate}</span>
              <span>
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })
                  : '-'}
              </span>
            </div>
          </div>

          {emailSuccess && (
            <div className="p-3 rounded-lg bg-success/20 text-success text-sm flex items-center gap-2">
              <span>✓</span>
              {sp.emailChangeSuccess || '인증 메일이 발송되었습니다. 새 이메일에서 확인해주세요.'}
            </div>
          )}

          {showEmailChange && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="text-sm font-medium text-text-secondary">
                {sp.newEmail || '새 이메일'}
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background-tertiary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all"
                placeholder={sp.newEmailPlaceholder || '새 이메일 주소 입력'}
              />
              {emailError && <p className="text-sm text-error">{emailError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowEmailChange(false); setNewEmail(''); setEmailError(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-sm font-bold hover:bg-white/20 transition-all"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleChangeEmail}
                  disabled={emailSaving || !newEmail}
                  className="flex-1 py-2.5 rounded-xl bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover disabled:opacity-50 transition-all"
                >
                  {emailSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    </span>
                  ) : (sp.emailChangeSend || '인증 메일 발송')}
                </button>
              </div>
              <p className="text-xs text-text-muted">
                {sp.emailChangeHint || '변경 요청 후 새 이메일로 인증 메일이 발송됩니다.'}
              </p>
            </div>
          )}
        </div>

        {/* Password Change */}
        {isSocialAccount ? (
          <div className="p-4 rounded-xl bg-background-secondary space-y-2">
            <h3 className="font-bold">{sp.passwordChange}</h3>
            <p className="text-sm text-text-muted">{sp.socialAccountDesc}</p>
            <div className="flex items-center gap-2 mt-1">
              <svg className="w-5 h-5 text-text-muted" viewBox="0 0 24 24">
                <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/>
              </svg>
              <span className="text-sm text-text-secondary">{sp.socialAccount}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-background-secondary space-y-4">
            <h3 className="font-bold">{sp.passwordChange}</h3>

            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-success/20 text-success text-sm flex items-center gap-2">
                <span>✓</span>
                {sp.passwordChanged}
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{sp.currentPassword}</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-background-tertiary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all"
                  placeholder={sp.currentPasswordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <EyeIcon open={showCurrentPassword} />
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{sp.newPassword}</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-background-tertiary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm transition-all"
                  placeholder={sp.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <EyeIcon open={showNewPassword} />
                </button>
              </div>
              {newPassword && (
                <>
                  <div className="flex gap-1 pt-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= passwordStrength ? (passwordStrength <= 2 ? 'bg-warning' : 'bg-success') : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-text-muted italic">{sp.passwordHint}</p>
                </>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">{sp.passwordConfirm}</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 rounded-xl bg-background-tertiary outline-none ring-1 transition-all ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'ring-error'
                      : 'ring-white/10 focus:ring-2 focus:ring-accent-warm'
                  }`}
                  placeholder={sp.passwordConfirmPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-success">✓ {sp.passwordMatch}</p>
              )}
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-error">✗ {sp.passwordMismatch}</p>
              )}
            </div>

            {passwordError && <p className="text-sm text-error">{passwordError}</p>}

            <button
              onClick={handleChangePassword}
              disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              className="w-full py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover disabled:opacity-50 transition-all"
            >
              {passwordSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {sp.changing}
                </span>
              ) : sp.passwordChange}
            </button>
          </div>
        )}

        {/* Two-Factor Authentication */}
        {profile && <TwoFactorTab userId={profile.id} />}

        {/* Blocked Users */}
        <div className="p-4 rounded-xl bg-background-secondary space-y-3">
          <h3 className="font-bold">{sp.blockedUsers}</h3>
          {blockedLoading ? (
            <div className="flex justify-center py-4">
              <span className="w-5 h-5 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <p className="text-sm text-text-muted py-2">{sp.noBlockedUsers}</p>
          ) : (
            <ul className="space-y-2">
              {blockedUsers.map((user) => (
                <li key={user.id} className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-background-tertiary overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt={user.username} width={36} height={36} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium">@{user.username}</span>
                  <button
                    onClick={() => handleUnblock(user.username, user.id)}
                    disabled={unblockingId === user.id}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-xs hover:bg-white/20 disabled:opacity-50 transition-all"
                  >
                    {unblockingId === user.id ? sp.unblocking : sp.unblock}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Data Export */}
        <div className="p-4 rounded-xl bg-background-secondary space-y-3">
          <h3 className="font-bold">{sp.exportData}</h3>
          <p className="text-sm text-text-muted">{sp.exportDataDesc}</p>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="px-4 py-2.5 rounded-xl bg-white/10 text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition-all"
          >
            {exporting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {sp.exporting}
              </span>
            ) : sp.exportDataBtn}
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={async () => {
            localStorage.removeItem('naelum_auto_login');
            localStorage.removeItem('naelum_saved_email');
            await supabase.auth.signOut();
            router.push('/');
          }}
          className="w-full py-3 rounded-xl bg-background-secondary text-text-primary font-bold hover:bg-white/10 transition-all"
        >
          {sp.logout}
        </button>

        {/* Cookie Consent Settings — GDPR 동의 철회·변경 진입점 */}
        <CookieConsentSettings t={t} />

        {/* Delete Account */}
        <div className="p-4 rounded-xl bg-error/10 border border-error/30">
          <h3 className="font-bold text-error mb-2">{sp.deleteAccount}</h3>
          <p className="text-sm text-text-muted mb-4">{sp.deleteAccountDesc}</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-lg bg-error text-white text-sm hover:bg-error/80 transition-all"
          >
            {sp.deleteAccount}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background-secondary p-6">
            <h2 className="text-xl font-bold text-error mb-4">{sp.deleteAccount}</h2>
            <p className="text-sm text-text-secondary mb-4">{sp.deleteConfirmMsg}</p>
            <p className="text-sm text-text-muted mb-2">
              {sp.deleteConfirmInput}{' '}
              <span className="font-bold text-error font-mono">{sp.deleteConfirmPhrase}</span>
              {sp.deleteConfirmInputSuffix}
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background-tertiary outline-none ring-1 ring-white/10 focus:ring-error mb-4 font-mono"
              placeholder={sp.deleteConfirmPhrase}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-3 rounded-xl bg-white/10 font-bold hover:bg-white/20 transition-all"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== sp.deleteConfirmPhrase || deleting}
                className="flex-1 py-3 rounded-xl bg-error text-white font-bold hover:bg-error/80 disabled:opacity-50 transition-all"
              >
                {deleting ? sp.deleting : t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CookieConsentSettings({ t }: { t: AccountTabProps['t'] }) {
  const { consent, reopenBanner } = useCookieConsent();
  const sp = t.settingsPage;

  const status = !consent
    ? (sp.cookieConsentStatusUnset || '아직 선택 안 함')
    : consent.analytics && consent.marketing
      ? (sp.cookieConsentStatusAll || '모두 수락')
      : !consent.analytics && !consent.marketing
        ? (sp.cookieConsentStatusNecessary || '필수만')
        : (sp.cookieConsentStatusCustom || '사용자 지정');

  return (
    <div className="p-4 rounded-xl bg-background-secondary space-y-3">
      <h3 className="font-bold">{sp.cookieConsentTitle || '쿠키 및 추적 설정'}</h3>
      <p className="text-sm text-text-muted">
        {sp.cookieConsentDesc || '쿠키 사용에 대한 동의를 변경하거나 철회할 수 있어요. GDPR 등 개인정보 보호법에 따른 권리입니다.'}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">
          {sp.cookieConsentCurrent || '현재 상태'}: <span className="text-accent-warm font-medium">{status}</span>
        </span>
        <button
          onClick={reopenBanner}
          className="px-3 py-1.5 rounded-lg bg-accent-warm/15 border border-accent-warm/30 text-accent-warm text-xs font-medium hover:bg-accent-warm/25 transition-colors"
        >
          {sp.cookieConsentChange || '변경'}
        </button>
      </div>
    </div>
  );
}
