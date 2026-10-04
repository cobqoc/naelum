'use client';

import { useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useToast } from '@/lib/toast/context';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

type ReportContentType = 'recipe' | 'tip';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ReportContentType;
  contentId: string;
}

const REASONS: { value: string; labelKey: string }[] = [
  { value: 'spam', labelKey: 'reasonSpam' },
  { value: 'inappropriate', labelKey: 'reasonInappropriate' },
  { value: 'copyright', labelKey: 'reasonCopyright' },
  { value: 'false_info', labelKey: 'reasonFalseInfo' },
  { value: 'other', labelKey: 'reasonOther' },
];

/**
 * 콘텐츠 신고 모달 — DMCA Safe Harbor notice-and-takedown 진입점.
 * - 레시피·팁 ⋮ 메뉴에서 호출
 * - 사유 선택 + 선택적 설명
 * - 24~48시간 SLA 안내
 * - 저작권 침해 선택 시 /copyright 정식 양식 안내
 */
export default function ReportModal({ isOpen, onClose, contentType, contentId }: ReportModalProps) {
  const { t } = useI18n();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose, isOpen && !submitting);
  useFocusTrap(isOpen, panelRef);

  if (!isOpen) return null;

  // 신고 라우트 에러 → 번역 문구(ICL-06, 2026-10-04). 서버 한국어 원문(data.error)을 그대로 토스트하면 비한국어
  // 로케일에 한국어가 노출됐다 → 원문은 콘솔에만. ko 문구는 서버 원문과 같은 키라 한국어 화면은 그대로.
  // (400 은 이 UI 에서 사유·본문이 늘 유효하므로 "자기 콘텐츠 신고" 뿐)
  const reportErrorMessage = (status: number): string => {
    const isRecipe = contentType === 'recipe';
    switch (status) {
      case 401: return t.errors.loginRequired;
      case 400: return isRecipe ? t.report.errorOwnRecipe : t.report.errorOwnTip;
      case 404: return isRecipe ? t.recipeForm.errorRecipeNotFound : t.tip.detailNotFound;
      case 409: return isRecipe ? t.report.errorAlreadyReportedRecipe : t.report.errorAlreadyReportedTip;
      case 429: return t.report.errorTooMany;
      default: return t.report.errorSubmit;
    }
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast.warning(t.report.warnReason);
      return;
    }
    setSubmitting(true);
    try {
      const url = contentType === 'recipe'
        ? `/api/recipes/${contentId}/report`
        : `/api/tip/${contentId}/report`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description: description.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('[ReportModal] 신고 실패:', res.status, data?.error);
        toast.error(reportErrorMessage(res.status));
        return;
      }
      toast.success(t.report.successSubmit);
      setReason('');
      setDescription('');
      onClose();
    } catch {
      toast.error(t.report.errorSubmit);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        className="w-full max-w-md rounded-2xl bg-background-secondary p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">🚨 {t.report.title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl">×</button>
        </div>

        <p className="text-sm text-text-muted mb-4">{t.report.subtitle}</p>

        {/* 사유 선택 */}
        <div className="space-y-2 mb-4">
          {REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="report-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={(e) => setReason(e.target.value)}
                className="w-4 h-4 accent-accent-warm"
              />
              <span className="text-sm text-text-primary">
                {(t.report as Record<string, string>)[r.labelKey]}
              </span>
            </label>
          ))}
        </div>

        {/* 저작권 선택 시 정식 양식 안내 */}
        {reason === 'copyright' && (
          <div className="mb-4 p-3 rounded-lg bg-accent-warm/10 border border-accent-warm/30 text-xs text-text-secondary">
            {t.report.copyrightNotice}{' '}
            <a href="/copyright" target="_blank" className="text-accent-warm underline">
              {t.report.copyrightLink}
            </a>
          </div>
        )}

        {/* 상세 설명 (선택) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t.report.descLabel} <span className="text-text-muted">({t.report.optional})</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
            placeholder={t.report.descPlaceholder}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-background-primary border border-white/10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm resize-none"
          />
        </div>

        <p className="text-xs text-text-muted mb-4">⏱ {t.report.sla}</p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-background-tertiary text-text-secondary font-medium hover:text-text-primary transition disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="flex-[2] py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition disabled:opacity-50"
          >
            {submitting ? t.report.submitting : t.report.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
