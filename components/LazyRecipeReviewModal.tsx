'use client';

import dynamic from 'next/dynamic';

// RecipeReviewModal 의 지연 로딩 단일 출처 (components/LazyContactModal.tsx 와 같은 이유 — 같은 모듈을 두 곳이 따로 dynamic() 하면
// Turbopack 매니페스트가 emit 되지 않은 청크를 preload 해 404). 옵션은 `loading: () => null`: ssr:false 는
// BAILOUT_TO_CLIENT_SIDE_RENDERING 으로 hydration #418 을 유발하고, 닫힌 모달은 어차피 null 이라 SSR 결과가 같다
// (2026-10-19 감사 PAU-40).
const LazyRecipeReviewModal = dynamic(() => import('./RecipeReviewModal'), { loading: () => null });

export default LazyRecipeReviewModal;
