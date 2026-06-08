'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from '@/components/Common/LocalizedLink';

interface DashboardStats {
  total_users: number;
  new_users_week: number;
  new_users_month: number;
  total_recipes: number;
  new_recipes_week: number;
  pending_reports: number;
  banned_users_count: number;
  views_today: number;
  comments_week: number;
}


interface RecentAction {
  id: string;
  action_type: string;
  created_at: string;
  admin: {
    username: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    // 데이터 계층 이전(docs/DATA_LAYER.md): 직접 supabase read 2개 → 서버 엔드포인트 1회.
    // GET /api/admin/dashboard 가 통계+최근활동을 Promise.all 병렬로 묶어 반환(verifyAdmin 게이트).
    try {
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) return;
      const { stats: statsData, recentActions: actionsData } = await res.json();
      if (statsData) {
        setStats(statsData);
      }
      if (actionsData) {
        setRecentActions(actionsData as RecentAction[]);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: '전체 사용자',
      value: stats?.total_users || 0,
      change: `+${stats?.new_users_week || 0} (7일)`,
      icon: '👥',
      badgeClass: 'bg-info/20 text-info'
    },
    {
      label: '전체 레시피',
      value: stats?.total_recipes || 0,
      change: `+${stats?.new_recipes_week || 0} (7일)`,
      icon: '🍳',
      badgeClass: 'bg-success/20 text-success'
    },
    {
      label: '대기 중 신고',
      value: stats?.pending_reports || 0,
      change: '처리 필요',
      icon: '🚨',
      badgeClass: 'bg-warning/20 text-warning'
    },
    {
      label: '차단된 사용자',
      value: stats?.banned_users_count || 0,
      change: '누적',
      icon: '🚫',
      badgeClass: 'bg-error/20 text-error'
    },
    {
      label: '오늘 조회수',
      value: stats?.views_today || 0,
      change: '오늘',
      icon: '👁',
      badgeClass: 'bg-info/20 text-info'
    },
    {
      label: '이번 주 댓글',
      value: stats?.comments_week || 0,
      change: '7일',
      icon: '💬',
      badgeClass: 'bg-success/20 text-success'
    },
  ];

  const formatActionType = (type: string) => {
    const actionMap: { [key: string]: string } = {
      ban_user: '사용자 차단',
      unban_user: '차단 해제',
      delete_user: '사용자 삭제',
      delete_recipe: '레시피 삭제',
      resolve_report: '신고 처리',
      change_role: '역할 변경',
    };
    return actionMap[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">관리자 대시보드</h1>
        <div className="text-sm text-text-muted">
          마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(card => (
          <div
            key={card.label}
            className="p-6 rounded-xl bg-background-secondary border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{card.icon}</span>
              <span className={`px-2 py-1 text-xs rounded ${card.badgeClass}`}>
                {card.change}
              </span>
            </div>
            <div className="text-3xl font-bold mb-1">{card.value.toLocaleString()}</div>
            <div className="text-sm text-text-muted">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4">빠른 작업</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            href="/admin/users"
            className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-medium">사용자 관리</div>
          </Link>
          <Link
            href="/admin/ingredients"
            className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🥬</div>
            <div className="text-sm font-medium">재료 관리</div>
          </Link>
          <Link
            href="/admin/recipes"
            className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🍳</div>
            <div className="text-sm font-medium">레시피 관리</div>
          </Link>
          <Link
            href="/admin/reports"
            className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🚨</div>
            <div className="text-sm font-medium">신고 처리</div>
            {(stats?.pending_reports || 0) > 0 && (
              <span className="mt-1 inline-block px-2 py-0.5 text-xs rounded-full bg-error/20 text-error font-semibold">
                {stats?.pending_reports}건 대기
              </span>
            )}
          </Link>
          <Link
            href="/admin/analytics"
            className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm font-medium">통계 확인</div>
          </Link>
          <Link
            href="/delivery"
            className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🛵</div>
            <div className="text-sm font-medium">배달 (사용자 페이지)</div>
          </Link>
          <Link
            href="/merchant"
            className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🏪</div>
            <div className="text-sm font-medium">식당 사장님</div>
          </Link>
          <Link
            href="/rider"
            className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🛴</div>
            <div className="text-sm font-medium">라이더</div>
          </Link>
          <Link
            href="/admin/dispatch"
            className="p-4 rounded-xl bg-background-secondary border border-white/10 hover:bg-white/5 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🗺️</div>
            <div className="text-sm font-medium">배차 모니터링</div>
          </Link>
        </div>
      </div>

      {/* Recent Admin Actions */}
      <div className="rounded-xl bg-background-secondary border border-white/10 p-6">
        <h2 className="text-xl font-bold mb-4">최근 관리자 활동</h2>
        <div className="space-y-3">
          {recentActions.length === 0 ? (
            <p className="text-text-muted text-center py-8">최근 활동이 없습니다.</p>
          ) : (
            recentActions.map(action => (
              <div
                key={action.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{formatActionType(action.action_type)}</div>
                  <div className="text-xs text-text-muted">
                    by @{action.admin.username} • {new Date(action.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
