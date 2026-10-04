import { notFound } from 'next/navigation';
import ProfilePageClient from './ProfilePageClient';

interface PageProps {
  params: Promise<{ username: string }>;
}

// 프로필 URL은 `/@username` 형식만 유효.
// `@` 또는 URL-encoded `%40`이 없으면 존재하지 않는 경로이므로 not-found.tsx 렌더.
// (이전엔 /random-string도 이 route에 매칭되어 "userNotFound" UI + 200 status가 떴음)
//
// 이 검사는 *서버* 컴포넌트에서 한다(2026-10-04). 클라이언트 컴포넌트가 SSR 도중 notFound() 를 던지면
// 루트 loading.tsx 의 Suspense 경계가 서버 렌더 실패로 끝나 브라우저에 React #419 에러가 찍히고
// 클라이언트가 다시 렌더했다(/ko/cart 등 한 단계 경로 전부). 서버에서 던지면 같은 404 화면이 에러 없이 나온다.
export default async function ProfilePage({ params }: PageProps) {
  const { username: rawSegment } = await params;
  if (!rawSegment.startsWith('@') && !rawSegment.startsWith('%40')) {
    notFound();
  }
  return <ProfilePageClient rawSegment={rawSegment} />;
}
