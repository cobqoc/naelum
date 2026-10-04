'use client';

import dynamic from 'next/dynamic';

// ContactModal 의 지연 로딩 단일 출처.
//
// 이전엔 Header·FloatingFeedbackButton·RecipeBrowseView 가 각각 `dynamic(() => import('./ContactModal'))`
// 을 선언했다. 같은 모듈을 한 페이지 안에서 두 곳(레이아웃의 피드백 버튼 + 페이지의 헤더)이 따로
// 동적 import 하면 Turbopack 의 react-loadable-manifest(모듈 id 가 키)가 한 청크 이름만 남겨
// 실제 emit 되지 않은 청크(`/_next/static/chunks/0n54-….js`)를 모든 페이지가 `<link rel="preload">`
// 로 요청 → 404 (2026-10-04 실측, 페이지당 1회 낭비 요청 + 콘솔 에러). import 지점을 하나로 모으면
// 페이지마다 청크 그룹이 하나뿐이라 매니페스트가 실제 파일과 일치한다.
//
// 옵션(`loading: () => null`)은 세 곳이 쓰던 것과 동일 — 닫힌 모달은 어차피 null 을 렌더하므로
// SSR·hydration 결과가 변하지 않는다.
const LazyContactModal = dynamic(() => import('./ContactModal'), { loading: () => null });

export default LazyContactModal;
