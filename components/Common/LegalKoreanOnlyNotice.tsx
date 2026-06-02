'use client';

import { useI18n } from '@/lib/i18n/context';

/**
 * 법적 페이지(약관·개인정보처리방침·저작권·쿠키) 본문은 한국어 전용이다.
 * 비한국어 로케일 사용자가 영어 <title>("Privacy Policy")만 보고 영어 본문을 기대했다가
 * 한글 본문을 만나는 mismatch를 해소하기 위한 안내. 한국어 원문이 법적 기준임을 명시.
 *
 * 전문 번역을 AI로 생성해 그대로 게시하는 것은 법적 리스크가 커서 지양 — 사람/법무 검토 필요.
 * 서버 컴포넌트(privacy/copyright/cookies)·클라이언트 컴포넌트(terms) 양쪽에서 사용 가능.
 */
export default function LegalKoreanOnlyNotice() {
  const { language, t } = useI18n();
  if (language === 'ko') return null;
  return (
    <div className="mb-8 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text-secondary">
      <span className="mr-1.5" aria-hidden="true">🌐</span>
      {t.common.legalKoreanOnly}
    </div>
  );
}
