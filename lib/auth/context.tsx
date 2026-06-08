'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  username: string;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 데이터 계층 이전(docs/DATA_LAYER.md): 직접 profile read → GET /api/users/me/summary(lean).
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/users/me/summary');
      if (!res.ok) return;
      const { profile } = await res.json();
      if (profile) setProfile(profile);
    } catch {
      // 프로필 로드 실패 시 무시
    }
  }, []);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser({ id: session.user.id, email: session.user.email || '' });
      await fetchProfile();
    } else {
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    // onAuthStateChange는 구독 즉시 INITIAL_SESSION 이벤트를 발생시켜 초기 세션을 처리함
    // 로그인/로그아웃/토큰 갱신 모두 이 리스너에서 처리됨
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        setLoading(false);
        fetchProfile();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // useMemo: user/profile/loading/refresh 가 실제로 바뀔 때만 새 value → 전 소비처 불필요 리렌더 방지.
  // (refresh 는 useCallback, 나머지는 state 라 값이 안 바뀌면 identity 안정.)
  const value = useMemo(() => ({ user, profile, loading, refresh }), [user, profile, loading, refresh]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
