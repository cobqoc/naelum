'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { swapLangSegment } from '@/lib/i18n/localizePath';
import type { Language } from '@/lib/i18n/translations';

/**
 * 언어 선택 목록(라벨·국기) 단일 출처 — 비로그인 헤더 언어 선택기(Header)와 로그인 프로필 메뉴(UserDropdown)가 공유.
 * 2026-10-04 PAU-32: 같은 8개 목록·전환 핸들러가 두 파일에 2벌 있었다. 순서·라벨은 기존과 동일.
 * 국기(flag)는 헤더 선택기만 표시한다(프로필 메뉴는 라벨만 — 예전 CSS 국기 클래스는 스타일이 없어 늘 빈 칸이었다).
 */
export const LANG_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

/**
 * 언어 전환 — 컨텍스트 즉시 전환 + URL 의 [lang] 세그먼트 교체로 서버 재렌더 유도.
 * 경로를 안 바꾸면 /ko 가 다른 언어 콘텐츠를 서빙해 <title>·메타데이터가 이전 언어로 남는다(탭 제목·SEO 불일치).
 * query·hash 보존 — usePathname 은 query 미포함이라 직접 붙인다(안 붙이면 필터·검색어 유실).
 * 메뉴 닫기는 호출자 몫(헤더 선택기 / 프로필 메뉴가 각자 닫는다).
 */
export function useLanguageSwitch(): (code: Language) => void {
  const { setLanguage } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  return (code: Language) => {
    setLanguage(code);
    const target = swapLangSegment(
      pathname || '/',
      typeof window !== 'undefined' ? window.location.search + window.location.hash : '',
      code,
    );
    if (target) router.push(target);
  };
}
