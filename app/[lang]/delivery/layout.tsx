// /delivery 영역 레이아웃. FAB은 각 페이지가 직접 렌더링 (layout segment에서
// useI18n을 호출하면 hydration 중 context 미연결 문제 발생해 회피).
export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
