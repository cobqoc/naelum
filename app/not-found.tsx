import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🍳</div>
        <h1 className="text-4xl font-bold mb-3">404</h1>
        <p className="text-xl text-text-secondary mb-1">페이지를 찾을 수 없습니다</p>
        <p className="text-sm text-text-muted mb-2">Page not found</p>
        <p className="text-text-muted mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          <br />
          <span className="text-xs">The page you requested does not exist or may have moved.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-colors"
          >
            홈으로 / Home
          </Link>
          <Link
            href="/search"
            className="px-6 py-3 rounded-xl bg-background-secondary border border-white/10 font-bold hover:bg-background-tertiary transition-colors"
          >
            레시피 검색 / Search
          </Link>
        </div>
      </div>
    </div>
  );
}
