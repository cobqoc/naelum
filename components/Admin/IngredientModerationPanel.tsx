'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast/context';
import { getCategoryName } from '../Ingredients/IngredientAutocompleteTypes';

interface IngredientForModeration {
  id: string;
  name: string;
  name_en: string | null;
  category: string;
  common_units: string[];
  search_count: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  creator: {
    id: string;
    username: string;
    email: string;
  } | null;
  approver: {
    id: string;
    username: string;
  } | null;
}

type StatusFilter = 'pending' | 'approved' | 'rejected';

/**
 * 재료 관리 패널 (관리자 전용)
 * 사용자가 추가한 재료를 승인/거부/삭제할 수 있음
 */
export default function IngredientModerationPanel() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [ingredients, setIngredients] = useState<IngredientForModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  /**
   * 재료 목록 로드
   */
  const fetchIngredients = async (status: StatusFilter) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/ingredients/pending?status=${status}&limit=100`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || `Failed to fetch ingredients (${response.status})`);
      }

      const data = await response.json();
      setIngredients(data.ingredients || []);

      // pending 개수 업데이트
      if (status === 'pending') {
        setPendingCount(data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError(err instanceof Error ? err.message : '재료 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 상태 변경 시 재료 목록 로드
   */
  useEffect(() => {
    fetchIngredients(statusFilter);
  }, [statusFilter]);

  /**
   * 재료 승인
   */
  const handleApprove = async (id: string) => {
    if (!confirm('이 재료를 승인하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/ingredients/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve ingredient');
      }

      // 목록 새로고침
      await fetchIngredients(statusFilter);
      toast.success('재료가 승인되었습니다');
    } catch (err) {
      console.error('Error approving ingredient:', err);
      toast.error('승인 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  /**
   * 재료 거부
   */
  const handleReject = async (id: string) => {
    if (!confirm('이 재료를 거부하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/ingredients/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject ingredient');
      }

      // 목록 새로고침
      await fetchIngredients(statusFilter);
      toast.success('재료가 거부되었습니다');
    } catch (err) {
      console.error('Error rejecting ingredient:', err);
      toast.error('거부 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  /**
   * 재료 삭제
   */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 재료를 영구 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/ingredients/${id}/approve`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete ingredient');
      }

      // 목록 새로고침
      await fetchIngredients(statusFilter);
      toast.success('재료가 삭제되었습니다');
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      toast.error('삭제 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * 상태 배지
   */
  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      pending: 'bg-warning/20 text-warning',
      approved: 'bg-success/20 text-success',
      rejected: 'bg-error/20 text-error',
    };

    const labels = {
      pending: '승인 대기',
      approved: '승인됨',
      rejected: '거부됨',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors] || 'bg-white/10 text-text-muted'
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">재료 관리</h1>
        <div className="flex gap-2">
          <div className="px-4 py-2 rounded-xl bg-background-secondary border border-white/10">
            <span className="text-sm text-text-muted">승인 대기:</span>
            <span className="ml-2 text-lg font-bold text-accent-warm">{pendingCount}</span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            statusFilter === 'pending'
              ? 'text-accent-warm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          승인 대기
          {statusFilter === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-warm" />
          )}
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            statusFilter === 'approved'
              ? 'text-accent-warm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          승인됨
          {statusFilter === 'approved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-warm" />
          )}
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            statusFilter === 'rejected'
              ? 'text-accent-warm'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          거부됨
          {statusFilter === 'rejected' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-warm" />
          )}
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="rounded-xl bg-error/10 border border-error/20 p-4">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 재료 테이블 */}
      {!loading && ingredients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-text-primary mb-2">재료가 없습니다</h3>
          <p className="text-sm text-text-muted">
            {statusFilter === 'pending' && '승인 대기 중인 재료가 없습니다'}
            {statusFilter === 'approved' && '승인된 재료가 없습니다'}
            {statusFilter === 'rejected' && '거부된 재료가 없습니다'}
          </p>
        </div>
      )}

      {!loading && ingredients.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  재료명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  카테고리
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  작성자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  작성일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ingredients.map((ingredient) => (
                <tr
                  key={ingredient.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  {/* 재료명 */}
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-text-primary">
                        {ingredient.name}
                      </div>
                      {ingredient.name_en && (
                        <div className="text-sm text-text-muted">
                          {ingredient.name_en}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 카테고리 */}
                  <td className="px-4 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-text-secondary">
                      {getCategoryName(ingredient.category)}
                    </span>
                  </td>

                  {/* 작성자 */}
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <div className="text-text-primary">
                        {ingredient.creator?.username || '-'}
                      </div>
                      <div className="text-text-muted text-xs">
                        {ingredient.creator?.email || '-'}
                      </div>
                    </div>
                  </td>

                  {/* 작성일 */}
                  <td className="px-4 py-4 text-sm text-text-secondary">
                    {formatDate(ingredient.created_at)}
                  </td>

                  {/* 상태 */}
                  <td className="px-4 py-4">
                    <StatusBadge status={ingredient.status} />
                  </td>

                  {/* 작업 버튼 */}
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {ingredient.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(ingredient.id)}
                            className="px-3 py-1 rounded-lg bg-success/20 text-success text-sm font-medium hover:bg-success/30 transition-colors"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(ingredient.id)}
                            className="px-3 py-1 rounded-lg bg-error/20 text-error text-sm font-medium hover:bg-error/30 transition-colors"
                          >
                            거부
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(ingredient.id, ingredient.name)}
                        className="px-3 py-1 rounded-lg bg-white/5 text-text-muted text-sm font-medium hover:bg-white/10 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
