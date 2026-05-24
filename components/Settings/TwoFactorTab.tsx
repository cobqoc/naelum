'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';

interface SetupResponse {
  secret: string;
  otpauthUrl: string;
  backupCodes: string[];
}

// 모든 API 호출이 쿠키 인증 기반이라 클라이언트가 userId 가질 필요 없음.
// 호출자도 인자 없이 <TwoFactorTab /> 으로 사용.
export default function TwoFactorTab() {
  const { t } = useI18n();
  const toast = useToast();
  const tf = (t as unknown as Record<string, Record<string, string>>).twoFactor || {};

  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/2fa/setup');
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(data.isEnabled);
      } else {
        toast.error(t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [toast, t.common.error]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleStartSetup = async () => {
    setError('');
    setSuccess('');
    setProcessing(true);

    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || tf.title);
        return;
      }

      const data: SetupResponse = await res.json();
      setSetupData(data);
      setShowSetup(true);
    } catch {
      setError(t.common.error);
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError(tf.enterCode);
      return;
    }

    setError('');
    setProcessing(true);

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || tf.invalidCode);
        return;
      }

      const data = await res.json();
      setIsEnabled(true);
      setShowSetup(false);
      setBackupCodes(data.backupCodes || setupData?.backupCodes || []);
      setShowBackupCodes(true);
      setSuccess(tf.success);
      setVerificationCode('');
    } catch {
      setError(t.common.error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      setError(tf.enterCode);
      return;
    }

    setError('');
    setProcessing(true);

    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || tf.invalidCode);
        return;
      }

      setIsEnabled(false);
      setShowDisable(false);
      setDisableCode('');
      setSuccess(tf.disabled_success);
      setSetupData(null);
    } catch {
      setError(t.common.error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSetup = () => {
    setShowSetup(false);
    setSetupData(null);
    setVerificationCode('');
    setError('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="w-6 h-6 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="p-4 rounded-xl bg-background-secondary space-y-4">
        <h3 className="font-bold">{tf.title}</h3>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-success' : 'bg-text-muted'}`} />
          <span className="text-sm text-text-secondary">
            {isEnabled ? tf.enabled : tf.disabled}
          </span>
        </div>
        <p className="text-sm text-text-muted">{tf.disableWarning}</p>
      </div>

      {/* Error / Success messages */}
      {error && (
        <div className="p-3 rounded-lg bg-error/20 text-error text-sm flex items-center gap-2">
          <span>✗</span> {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-success/20 text-success text-sm flex items-center gap-2">
          <span>✓</span> {success}
        </div>
      )}

      {/* Enable / Disable Buttons */}
      {!showSetup && !showDisable && !showBackupCodes && (
        <div>
          {isEnabled ? (
            <button
              onClick={() => { setShowDisable(true); setError(''); setSuccess(''); }}
              className="w-full py-3 rounded-xl bg-error/20 text-error font-bold hover:bg-error/30 transition-all"
            >
              {tf.disable} 2FA
            </button>
          ) : (
            <button
              onClick={handleStartSetup}
              disabled={processing}
              className="w-full py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover disabled:opacity-50 transition-all"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t.common?.loading || '...'}
                </span>
              ) : `${tf.enable} 2FA`}
            </button>
          )}
        </div>
      )}

      {/* Setup Flow */}
      {showSetup && setupData && (
        <div className="p-4 rounded-xl bg-background-secondary space-y-5">
          <h3 className="font-bold">{tf.setupTitle}</h3>

          <div className="space-y-3">
            <p className="text-sm text-text-secondary">{tf.scanQR}</p>
            <div className="p-3 rounded-lg bg-background-tertiary">
              <p className="text-xs text-text-muted mb-1">{tf.secretKey}:</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-accent-warm break-all flex-1">
                  {setupData.secret}
                </code>
                <button
                  onClick={() => copyToClipboard(setupData.secret)}
                  className="shrink-0 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-all"
                >
                  {copied ? '✓' : tf.copy}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-text-secondary">{tf.enterCode}</p>
            <InputBoxWrapper className="!bg-background-tertiary !rounded-xl !px-4 !py-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className={`${INPUT_INNER_COMFORTABLE_CLASS} text-center text-2xl font-mono tracking-widest`}
                style={INPUT_INNER_STYLE}
                placeholder="000000"
              />
            </InputBoxWrapper>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancelSetup}
              className="flex-1 py-3 rounded-xl bg-white/10 font-bold hover:bg-white/20 transition-all"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleVerify}
              disabled={processing || verificationCode.length !== 6}
              className="flex-1 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover disabled:opacity-50 transition-all"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </span>
              ) : tf.verifyCode}
            </button>
          </div>
        </div>
      )}

      {/* Backup Codes Display */}
      {showBackupCodes && backupCodes.length > 0 && (
        <div className="p-4 rounded-xl bg-background-secondary space-y-4">
          <h3 className="font-bold text-warning">{tf.backupCodes}</h3>
          <p className="text-sm text-text-secondary">{tf.backupCodesWarning}</p>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, i) => (
              <div key={i} className="p-2 rounded-lg bg-background-tertiary text-center font-mono text-sm">
                {code}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
              className="flex-1 py-3 rounded-xl bg-white/10 font-bold hover:bg-white/20 transition-all"
            >
              {tf.copy}
            </button>
            <button
              onClick={() => { setShowBackupCodes(false); setBackupCodes([]); }}
              className="flex-1 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all"
            >
              {t.common.confirm || t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Disable Flow */}
      {showDisable && (
        <div className="p-4 rounded-xl bg-background-secondary space-y-4">
          <h3 className="font-bold text-error">{tf.disable} 2FA</h3>
          <p className="text-sm text-text-secondary">{tf.enterCode}</p>
          <InputBoxWrapper className="!bg-background-tertiary !rounded-xl !px-4 !py-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              className={`${INPUT_INNER_COMFORTABLE_CLASS} text-center text-2xl font-mono tracking-widest`}
              style={INPUT_INNER_STYLE}
              placeholder="000000"
            />
          </InputBoxWrapper>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowDisable(false); setDisableCode(''); setError(''); }}
              className="flex-1 py-3 rounded-xl bg-white/10 font-bold hover:bg-white/20 transition-all"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleDisable}
              disabled={processing || disableCode.length !== 6}
              className="flex-1 py-3 rounded-xl bg-error text-white font-bold hover:bg-error/80 disabled:opacity-50 transition-all"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </span>
              ) : tf.disable}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
