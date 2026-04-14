'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface NotificationItem {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  userId: string | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function NotificationPanel({ userId, isOpen, onOpen, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);
  const [notifSettings, setNotifSettings] = useState({ expiry: true, meal_time: true });
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('naelum_notif_settings');
    if (saved) {
      try { setNotifSettings(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadCount(count || 0);
    } catch { /* ignore */ }
  }, [supabase]);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=10');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* ignore */ }
    finally { setNotifLoading(false); }
  };

  // 폴링 (30초)
  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userId, fetchUnreadCount]);

  const markAsRead = async (id: string) => {
    const res = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const res = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    if (res.ok) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const toggleNotifSetting = (key: 'expiry' | 'meal_time') => {
    setNotifSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('naelum_notif_settings', JSON.stringify(next));
      return next;
    });
  };

  const formatNotifTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const getNotifIcon = (type: string) => {
    if (type === 'expiry') return '⏰';
    if (type === 'meal_time') return '🍽️';
    return '🔔';
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission !== 'granted') return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });
    const sub = subscription.toJSON();
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.keys }),
    });
  };

  const unsubscribeFromPush = async () => {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
    setPushPermission('default');
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (isOpen) {
            onClose();
          } else {
            onOpen();
            setNotifSettingsOpen(false);
            fetchNotifications();
          }
        }}
        className="relative p-2.5 rounded-full hover:bg-white/10 transition-colors"
        aria-label="알림"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              {notifSettingsOpen ? (
                <button
                  onClick={() => setNotifSettingsOpen(false)}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  ← 알림 설정
                </button>
              ) : (
                <>
                  <span className="font-bold text-sm">🔔 알림</span>
                  <button
                    onClick={() => setNotifSettingsOpen(true)}
                    className="text-text-muted hover:text-text-primary transition-colors text-base"
                    aria-label="알림 설정"
                  >
                    ⚙️
                  </button>
                </>
              )}
            </div>

            {/* 설정 패널 */}
            {notifSettingsOpen ? (
              <div className="p-4 space-y-4">
                <div className="pb-3 border-b border-white/10">
                  {pushPermission === 'granted' ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <span>📲</span>
                        <span>기기 알림</span>
                        <span className="text-xs text-success">허용됨</span>
                      </span>
                      <button
                        onClick={unsubscribeFromPush}
                        className="text-xs text-text-muted hover:text-error transition-colors"
                      >
                        해제
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={subscribeToPush}
                      className="w-full py-2 px-3 rounded-lg bg-accent-warm/10 border border-accent-warm/30 text-accent-warm text-sm font-medium hover:bg-accent-warm/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>📲</span>
                      앱을 닫아도 알림 받기
                    </button>
                  )}
                </div>

                {([
                  { key: 'expiry' as const, icon: '⏰', label: '유통기한 알림' },
                  { key: 'meal_time' as const, icon: '🍽️', label: '식사 추천 알림' },
                ]).map(({ key, icon, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <span>{icon}</span>
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleNotifSetting(key)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        notifSettings[key] ? 'bg-accent-warm' : 'bg-background-tertiary'
                      }`}
                      role="switch"
                      aria-checked={notifSettings[key]}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        notifSettings[key] ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-warm border-t-transparent" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-3xl mb-2">🔕</div>
                    <p className="text-sm text-text-muted">알림이 없습니다</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (!n.is_read) markAsRead(n.id);
                        onClose();
                        if (n.action_url) router.push(n.action_url);
                      }}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-white/5 ${
                        !n.is_read ? 'bg-accent-warm/5' : ''
                      }`}
                    >
                      <span className="text-xl flex-shrink-0 mt-0.5">{getNotifIcon(n.notification_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{n.title}</p>
                        <p className="text-xs text-text-muted truncate">{n.message}</p>
                        <p className="text-xs text-text-muted mt-0.5">{formatNotifTime(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-accent-warm flex-shrink-0 mt-1.5" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {!notifSettingsOpen && unreadCount > 0 && (
              <div className="border-t border-white/10 px-4 py-2.5">
                <button
                  onClick={markAllAsRead}
                  className="w-full text-center text-xs text-accent-warm hover:text-accent-hover transition-colors"
                >
                  전체 읽음
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
