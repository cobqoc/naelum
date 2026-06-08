'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import { Toggle } from '@/components/UI/Toggle';

interface NotificationsTabProps {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

// 알림 설정 단일 진실 소스.
// - 종류 토글(유통기한 등): profiles.push_notifications. 옵티미스틱 + DB 즉시 저장 + 실패 시 롤백.
// - 기기 푸시 구독: Web Push API + /api/push/subscribe. 브라우저 권한·구독 라이프사이클은 별도.
//   토글 ON이라도 기기 푸시 구독 안 했으면 OS 알림은 안 옴 — 두 layer 모두 ON이어야 발송.
// 헤더 🔔(NotificationPanel)은 알림 목록 전담 — 토글·구독 UI 여기로 통합 (2026-05-25).
export default function NotificationsTab({ userId, t }: NotificationsTabProps) {
  const sp = t.settingsPage;
  const supabase = createClient();
  const toast = useToast();
  const [expiryEnabled, setExpiryEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // 데이터 계층 이전(docs/DATA_LAYER.md): 직접 supabase read → 기존 GET /api/users/me 재사용
    // (profile.push_notifications 동봉). 토글 저장(handleToggle)은 mutation 이라 supabase 유지.
    let cancelled = false;
    fetch('/api/users/me')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then(({ profile }) => {
        if (cancelled) return;
        setExpiryEnabled(profile?.push_notifications ?? true);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error(t.common.error);
        setExpiryEnabled(true);
      });
    return () => { cancelled = true; };
  }, [toast, t.common.error]);

  const handleToggle = async () => {
    if (expiryEnabled === null || saving) return;
    const next = !expiryEnabled;
    setExpiryEnabled(next);
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ push_notifications: next })
      .eq('id', userId);
    setSaving(false);
    if (error) {
      setExpiryEnabled(!next);
      toast.error(t.common.error);
    }
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error(t.common.error);
      return;
    }
    setPushBusy(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission !== 'granted') return;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      const sub = subscription.toJSON();
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.keys }),
      });
      if (!res.ok) toast.error(t.common.error);
    } catch {
      toast.error(t.common.error);
    } finally {
      setPushBusy(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!('serviceWorker' in navigator)) return;
    setPushBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setPushPermission('default');
        return;
      }
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
      setPushPermission('default');
    } catch {
      toast.error(t.common.error);
    } finally {
      setPushBusy(false);
    }
  };

  if (expiryEnabled === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="w-6 h-6 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 기기 푸시 구독 — 브라우저 권한 + Web Push 구독 */}
      <div className="p-4 rounded-xl bg-background-secondary">
        {pushPermission === 'granted' ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl" aria-hidden="true">📲</span>
              <div>
                <p className="text-sm font-medium">{sp.pushDeviceTitle}</p>
                <p className="text-xs text-success">{sp.pushGranted}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={unsubscribeFromPush}
              disabled={pushBusy}
              className="text-xs text-text-muted hover:text-error transition-colors disabled:opacity-50"
            >
              {sp.pushUnsubscribe}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={subscribeToPush}
            disabled={pushBusy}
            className="w-full py-3 px-3 rounded-lg bg-accent-warm/10 border border-accent-warm/30 text-accent-warm text-sm font-medium hover:bg-accent-warm/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span aria-hidden="true">📲</span>
            {sp.pushSubscribeBtn}
          </button>
        )}
      </div>

      {/* 종류별 토글 */}
      <Toggle
        icon="⏰"
        label={sp.expiryNotification}
        description={sp.expiryNotificationDesc}
        checked={expiryEnabled}
        onChange={handleToggle}
        disabled={saving}
      />
    </div>
  );
}
