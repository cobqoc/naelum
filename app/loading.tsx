export default function Loading() {
  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center">
      <div className="text-center">
        <div className="animate-bounce text-3xl font-bold text-accent-warm mb-2">
          낼름...
        </div>
        <p className="text-text-muted text-sm">로딩 중</p>
      </div>
    </div>
  );
}
