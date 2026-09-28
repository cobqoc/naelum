'use client';

import { useState, useEffect, useCallback } from 'react';
import type { EventStats } from '@/lib/analytics/aggregateEvents';
import Link from '@/components/Common/LocalizedLink';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// 집계는 서버(/api/admin/analytics/events → lib/analytics/aggregateEvents)에서 — 같은 행·같은 코드라 숫자 동일 (perf 2026-09-28)
interface EventsResponse {
  days: number;
  total: number;
  daily: ReturnType<typeof import('@/lib/analytics/aggregateEvents').dailyPageViews>;
  topEvents: ReturnType<typeof import('@/lib/analytics/aggregateEvents').topEvents>;
  topPages: ReturnType<typeof import('@/lib/analytics/aggregateEvents').topPages>;
  stats: EventStats;
}

const RANGES = [
  { value: 1, label: '오늘' },
  { value: 7, label: '7일' },
  { value: 30, label: '30일' },
  { value: 90, label: '90일' },
];

export default function AdminEventsAnalyticsPage() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/events?days=${days}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? '로드 실패');
        setData(null);
      } else {
        setData(json);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '네트워크 오류');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const dailyPageViews = data?.daily ?? [];
  const topEvents = data?.topEvents ?? [];
  const topPages = data?.topPages ?? [];
  const stats = data?.stats ?? null;

  return (
    <div className="min-h-dvh bg-background-primary text-text-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">📊 행동 분석 (Events)</h1>
            <p className="text-sm text-text-muted mt-1">자체 analytics — 페이지뷰·클릭 이벤트</p>
          </div>
          <div className="flex items-center gap-2">
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => setDays(r.value)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  days === r.value ? 'bg-accent-warm text-background-primary font-bold' : 'bg-background-secondary text-text-secondary hover:bg-white/10'
                }`}
              >
                {r.label}
              </button>
            ))}
            <Link href="/admin/analytics" className="ml-2 text-sm text-text-muted hover:text-text-primary underline">레시피·사용자 통계 →</Link>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-text-muted">로딩...</div>}
        {error && <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-error">⚠️ {error}</div>}
        {!loading && data && data.total === 0 && (
          <div className="bg-background-secondary rounded-2xl p-12 text-center text-text-muted">
            데이터 없음 — analytics 동의한 사용자의 행동이 쌓이면 표시됩니다.
          </div>
        )}

        {!loading && data && data.total > 0 && stats && (
          <>
            {/* 핵심 KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '총 이벤트', value: data.total },
                { label: '페이지뷰', value: stats.pageViews },
                { label: '고유 세션', value: stats.uniqueSessions },
                { label: '로그인 사용자', value: stats.uniqueUsers },
              ].map(c => (
                <div key={c.label} className="bg-background-secondary rounded-2xl p-4 border border-white/5">
                  <div className="text-xs text-text-muted">{c.label}</div>
                  <div className="text-2xl font-bold mt-1">{c.value.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* 일별 페이지뷰 추이 */}
            <div className="bg-background-secondary rounded-2xl p-5 border border-white/5">
              <h2 className="font-bold mb-4">일별 페이지뷰 추이</h2>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={dailyPageViews}>
                    <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                    <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#2d2d2d', border: '1px solid #444' }} />
                    <Line type="monotone" dataKey="count" stroke="#ff9966" strokeWidth={2} dot={{ fill: '#ff9966' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top events + Top pages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-background-secondary rounded-2xl p-5 border border-white/5">
                <h2 className="font-bold mb-4">Top 이벤트 타입</h2>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={topEvents} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid stroke="#333" strokeDasharray="3 3" />
                      <XAxis type="number" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                      <YAxis type="category" dataKey="type" stroke="#888" tick={{ fill: '#888', fontSize: 11 }} width={140} />
                      <Tooltip contentStyle={{ background: '#2d2d2d', border: '1px solid #444' }} />
                      <Bar dataKey="count" fill="#ff9966" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-background-secondary rounded-2xl p-5 border border-white/5">
                <h2 className="font-bold mb-4">Top 페이지</h2>
                <div className="space-y-2">
                  {topPages.map(p => (
                    <div key={p.page} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                      <span className="font-mono text-text-secondary truncate flex-1 mr-3">{p.page}</span>
                      <span className="font-bold tabular-nums">{p.count.toLocaleString()}</span>
                    </div>
                  ))}
                  {topPages.length === 0 && <p className="text-text-muted text-sm">페이지뷰 없음</p>}
                </div>
              </div>
            </div>

            {/* 디바이스 분포 */}
            <div className="bg-background-secondary rounded-2xl p-5 border border-white/5">
              <h2 className="font-bold mb-4">디바이스 분포</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {([
                  ['mobile', '📱 모바일 (<768)'],
                  ['tablet', '📱 태블릿 (768~1280)'],
                  ['desktop', '🖥 데스크탑 (≥1280)'],
                  ['unknown', '❓ 미상'],
                ] as const).map(([k, label]) => {
                  const v = stats.dev[k];
                  const total = stats.dev.mobile + stats.dev.tablet + stats.dev.desktop + stats.dev.unknown;
                  const pct = total ? Math.round(100 * v / total) : 0;
                  return (
                    <div key={k} className="bg-background-tertiary rounded-xl p-3">
                      <div className="text-xs text-text-muted">{label}</div>
                      <div className="text-lg font-bold mt-1">{v.toLocaleString()}</div>
                      <div className="text-xs text-text-muted">{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 보류 이슈 관련 카드 */}
            <div className="bg-background-secondary rounded-2xl p-5 border border-white/5">
              <h2 className="font-bold mb-4">홈 인터랙션</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['펜던트 클릭', stats.pendantClicks],
                  ['만료 배너 클릭', stats.bannerClicks],
                  ['FAB(+) 클릭', stats.fabClicks],
                  ['빈 가이드 CTA', stats.emptyCta],
                  ['추천 pill 전체', stats.recipePill],
                  ['  └ ready', stats.recipePillModeReady],
                  ['  └ almost', stats.recipePillModeAlmost],
                  ['  └ all/0', stats.recipePillModeAll],
                  ['BottomNav 검색', stats.bottomNavSearch],
                  ['검색 오버레이 → 레시피', stats.overlayPillRecipes],
                  ['검색 오버레이 → 팁', stats.overlayPillTips],
                  ['재료 추가', stats.ingredientAdd],
                  ['재료 삭제', stats.ingredientDelete],
                ].map(([label, value]) => (
                  <div key={label} className="bg-background-tertiary rounded-xl p-3">
                    <div className="text-xs text-text-muted">{label}</div>
                    <div className="text-lg font-bold mt-1 tabular-nums">{(value as number).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-3">
                * 보류 이슈(7번 모바일 검색 발견성, 9번 추천 pill 0개 매칭, 10번 undo 5.5초, 11번 FAB 위치)를 데이터로 평가할 수 있는 핵심 메트릭들.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
