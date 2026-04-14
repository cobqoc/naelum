'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useToast } from '@/lib/toast/context';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: string;
  recipes_count: number;
  created_at: string;
  is_banned: boolean;
  ban_reason: string | null;
  ban_type: string | null;
  ban_expires_at: string | null;
}

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...(search && { search })
    });

    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();

    if (data.users) {
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    }

    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  const handleBanUser = async (userId: string, reason: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ban',
        reason,
        ban_type: 'permanent'
      })
    });

    if (res.ok) {
      toast.success('사용자가 차단되었습니다');
      loadUsers();
      setShowActionModal(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unban' })
    });

    if (res.ok) {
      toast.success('차단이 해제되었습니다');
      loadUsers();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">사용자 관리</h1>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="사용자명 또는 이메일 검색..."
          className="flex-1 px-4 py-3 rounded-xl bg-background-secondary text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm"
        />
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-background-secondary border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-tertiary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">사용자</th>
                <th className="px-4 py-3 text-left text-sm font-medium">이메일</th>
                <th className="px-4 py-3 text-left text-sm font-medium">역할</th>
                <th className="px-4 py-3 text-left text-sm font-medium">레시피</th>
                <th className="px-4 py-3 text-left text-sm font-medium">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium">가입일</th>
                <th className="px-4 py-3 text-right text-sm font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    사용자가 없습니다
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background-tertiary overflow-hidden flex-shrink-0">
                          {user.avatar_url ? (
                            <Image src={user.avatar_url} alt={user.username} width={40} height={40} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">👤</div>
                          )}
                        </div>
                        <span className="font-medium">@{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        user.role === 'admin' ? 'bg-error/20 text-error' : 'bg-info/20 text-info'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{user.recipes_count}</td>
                    <td className="px-4 py-3">
                      {user.is_banned ? (
                        <div>
                          <span className="px-2 py-1 text-xs rounded bg-error/20 text-error">차단됨</span>
                          {user.ban_type === 'temporary' && user.ban_expires_at && (
                            <div className="text-xs text-text-muted mt-1">
                              만료: {new Date(user.ban_expires_at).toLocaleDateString('ko-KR')}
                            </div>
                          )}
                          {user.ban_type === 'permanent' && (
                            <div className="text-xs text-text-muted mt-1">영구</div>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-success/20 text-success">정상</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowActionModal(true);
                        }}
                        className="px-3 py-1 text-sm rounded bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        관리
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 rounded-lg bg-background-secondary disabled:opacity-50 hover:bg-white/10 transition-colors"
        >
          이전
        </button>
        <span className="px-4 py-2 rounded-lg bg-background-secondary">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 rounded-lg bg-background-secondary disabled:opacity-50 hover:bg-white/10 transition-colors"
        >
          다음
        </button>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background-secondary p-6">
            <h2 className="text-xl font-bold mb-4">사용자 관리</h2>
            <div className="space-y-3 mb-6">
              <p><strong>사용자:</strong> @{selectedUser.username}</p>
              <p><strong>이메일:</strong> {selectedUser.email}</p>
              <p><strong>상태:</strong> {selectedUser.is_banned ? '차단됨' : '정상'}</p>
              {selectedUser.is_banned && selectedUser.ban_reason && (
                <p><strong>차단 사유:</strong> {selectedUser.ban_reason}</p>
              )}
              {selectedUser.is_banned && selectedUser.ban_type === 'temporary' && selectedUser.ban_expires_at && (
                <p><strong>차단 만료:</strong> {new Date(selectedUser.ban_expires_at).toLocaleString('ko-KR')}</p>
              )}
            </div>
            <div className="space-y-3">
              {!selectedUser.is_banned ? (
                <button
                  onClick={() => {
                    const reason = prompt('차단 사유를 입력하세요:');
                    if (reason) handleBanUser(selectedUser.id, reason);
                  }}
                  className="w-full py-3 rounded-xl bg-error text-white font-bold hover:bg-error/80"
                >
                  사용자 차단
                </button>
              ) : (
                <button
                  onClick={() => handleUnbanUser(selectedUser.id)}
                  className="w-full py-3 rounded-xl bg-success text-white font-bold hover:bg-success/80"
                >
                  차단 해제
                </button>
              )}
              <button
                onClick={() => setShowActionModal(false)}
                className="w-full py-3 rounded-xl bg-white/10 font-bold hover:bg-white/20"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
