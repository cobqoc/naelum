import type { Metadata } from 'next';

// 배달 기능은 prod 미적용 — 완성/출시 전까지 /delivery 하위 전 페이지 검색 색인 제외.
// 출시 시 이 metadata 제거하면 색인 복구.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

// /delivery 영역 레이아웃. FAB은 각 페이지가 직접 렌더링 (layout segment에서
// useI18n을 호출하면 hydration 중 context 미연결 문제 발생해 회피).
export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
