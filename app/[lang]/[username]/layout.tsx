import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string; username: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; username: string }> }): Promise<Metadata> {
  const { username: rawSegment } = await params;
  // `@` 없는 세그먼트(/ko/cart 등)는 page.tsx 가 404 로 끝낸다 — 프로필 조회 없이 기본 제목.
  // (프로필 없음 분기와 같은 값. 봇·오타 경로마다 DB 왕복 1회 절감)
  if (!rawSegment.startsWith('@') && !rawSegment.startsWith('%40')) {
    return { title: '낼름' };
  }
  const username = rawSegment.replace(/^%40|^@/, '');

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, bio, avatar_url')
    .eq('username', username)
    .maybeSingle();

  if (!profile) {
    return { title: '낼름' };
  }

  const displayName = profile.full_name || profile.username;
  const title = `${displayName} (@${profile.username}) — 낼름`;
  const description = profile.bio || `${displayName}의 레시피 모음을 낼름에서 확인하세요.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: profile.avatar_url ? [{ url: profile.avatar_url, width: 200, height: 200 }] : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default function ProfileLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
