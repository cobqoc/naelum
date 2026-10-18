import type { Metadata } from 'next';

// 배달 기능은 prod 미적용 — 완성/출시 전까지 /delivery 하위 전 페이지 검색 색인 제외.
// ⚠️ 하위 page 7곳이 각자 robots 메타를 다시 지정하므로, 출시 때 이 layout 값만 지우면 색인이 복구되지 않는다
//    — 각 page 의 robots 도 함께 제거할 것(2026-10-04 확인).
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

// /delivery 영역 레이아웃. FAB은 각 페이지가 직접 렌더링 (layout segment에서
// useI18n을 호출하면 hydration 중 context 미연결 문제 발생해 회피).
export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
