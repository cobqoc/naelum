// 팁 카테고리 — DB 저장 영문 key (2026-05-25 한글 → 영문 마이그레이션, locale-stable).
// 표시 라벨은 t.tipForm.categories[key] 통해 다국어 렌더.
// 2026-10-04 PAU-27: tip/new·tip/[id]/edit·tip/[id] 에 같은 목록·아이콘 맵이 각각 있던 것을 한 곳으로.
// (components/TipCard.tsx 의 TIP_CATEGORY_ICONS 도 같은 값 — 그 파일은 이번 작업 범위 밖이라 그대로 둠)
export const CATEGORIES = ['prep', 'storage', 'cooking', 'tools', 'measuring', 'other'];
export const CATEGORY_ICONS: Record<string, string> = {
  prep: '🔪', storage: '🧊', cooking: '🍳', tools: '🥄', measuring: '⚖️', other: '💡',
};
