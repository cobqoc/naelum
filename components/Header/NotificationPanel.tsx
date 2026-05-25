'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import LocalizedLink from '@/components/Common/LocalizedLink';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import { useOutsideClick } from '@/lib/hooks/useOutsideClick';

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

// 알림 목록 전담 — 종류 토글·푸시 구독 UI는 설정 페이지 알림 탭으로 이전 (2026-05-25).
// 헤더는 "최근 알림 보기·읽음 처리" 즉시 행동만, 환경 설정은 설정 페이지에서.
export default function NotificationPanel({ userId, isOpen, onOpen, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // 외부 클릭 시 닫기 — overlay div 대신 document-level listener 로 first-click consume 해소 (이슈 #1).
  useOutsideClick(isOpen, panelRef, onClose, triggerRef);

  // 백그라운드 폴링 (30초) — 실패 시 silent. 매 30초마다 토스트 띄우면 노이즈.
  // 네트워크 일시 장애도 다음 폴링에서 자동 복구되므로 사용자 인지 불필요.
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadCount(count || 0);
    } catch { /* silent — 백그라운드 폴링, 다음 30초 후 자동 재시도 */ }
  }, [supabase]);

  // 사용자가 종 아이콘 클릭해 패널 열 때 호출 — 실패 시 빈 상태 표시되므로 표면화 필요.
  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=10');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        toast.error(t.common.error);
      }
    } catch {
      toast.error(t.common.error);
    } finally { setNotifLoading(false); }
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

  const formatNotifTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes}${t.notifications.minutesAgo}`;
    if (hours < 24) return `${hours}${t.notifications.hoursAgo}`;
    return `${days}${t.notifications.daysAgo}`;
  };

  const getNotifIcon = (type: string) => {
    if (type === 'expiry') return '⏰';
    if (type === 'meal_time') return '🍽️';
    return '🔔';
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => {
          if (isOpen) {
            onClose();
          } else {
            onOpen();
            fetchNotifications();
          }
        }}
        className="relative p-2.5 rounded-full hover:bg-white/10 transition-colors"
        aria-label={t.common.notifications}
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
          <div ref={panelRef} className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-xl bg-background-secondary border border-white/10 shadow-2xl z-50 overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="font-bold text-sm">🔔 {t.common.notifications}</span>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-80 overflow-y-auto">
              {notifLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-warm border-t-transparent" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-2">🔕</div>
                  <p className="text-sm text-text-muted">{t.notifications.empty}</p>
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

            {/* Footer: 전체 읽음 + 알림 설정 진입로 */}
            <div className="border-t border-white/10 px-4 py-2.5 flex items-center justify-between gap-2">
              {unreadCount > 0 ? (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-accent-warm hover:text-accent-hover transition-colors"
                >
                  {t.notifications.markAllRead}
                </button>
              ) : <span />}
              <LocalizedLink
                href="/settings?tab=notifications"
                onClick={onClose}
                className="text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                {t.settingsPage.notificationSettingsLink}
              </LocalizedLink>
            </div>
          </div>
      )}
    </div>
  );
}
