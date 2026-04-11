'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { key: 'bug', label: '버그 신고', icon: '🐛' },
  { key: 'feature', label: '기능 제안', icon: '💡' },
  { key: 'other', label: '기타', icon: '💬' },
] as const;

type Category = typeof CATEGORIES[number]['key'];

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [category, setCategory] = useState<Category>('bug');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // 모달 열릴 때 로그인 상태 확인
  useEffect(() => {
    if (!isOpen) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (content.trim().length < 10) {
      setError('내용을 10자 이상 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrl = screenshotUrl;
      if (screenshotFile && !uploadedUrl) {
        setScreenshotUploading(true);
        const fd = new FormData();
        fd.append('file', screenshotFile);
        fd.append('bucket', 'contact-screenshots');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        setScreenshotUploading(false);
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedUrl = uploadData.url;
          setScreenshotUrl(uploadedUrl);
        }
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, content, email, screenshotUrl: uploadedUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '문의 접수에 실패했습니다.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCategory('bug');
    setContent('');
    setEmail('');
    setError('');
    setSubmitted(false);
    setIsLoggedIn(null);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setScreenshotUrl(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="bg-background-secondary rounded-2xl p-6 max-w-lg w-full border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">✉️ 개발자에게 문의</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          /* 성공 화면 */
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h4 className="text-lg font-bold mb-2">문의가 접수되었습니다</h4>
            <p className="text-sm text-text-muted mb-6">소중한 의견 감사합니다. 확인 후 답변 드리겠습니다.</p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-colors"
            >
              닫기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 카테고리 */}
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">문의 유형</label>
              <div className="flex gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      category === c.key
                        ? 'bg-accent-warm text-background-primary'
                        : 'bg-background-tertiary text-text-muted hover:bg-white/10'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 내용 */}
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                내용 <span className="text-error">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder={
                  category === 'bug'
                    ? '어떤 문제가 발생했나요? 재현 방법을 알려주시면 더 빠르게 해결할 수 있어요.'
                    : category === 'feature'
                    ? '어떤 기능이 있으면 좋을까요? 사용 상황을 함께 알려주세요.'
                    : '무엇이든 편하게 남겨주세요.'
                }
                className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm/50 transition-all resize-none"
              />
              <p className="text-xs text-text-muted mt-1 text-right">{content.length}자 (최소 10자)</p>
            </div>

            {/* 스크린샷 첨부 (로그인 시만) */}
            {isLoggedIn === true && (
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  스크린샷 첨부 <span className="text-text-muted text-xs">(선택, 최대 5MB)</span>
                </label>
                {screenshotPreview ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshotPreview}
                      alt="첨부 스크린샷"
                      className="max-h-40 rounded-xl border border-white/10 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotFile(null);
                        setScreenshotPreview(null);
                        setScreenshotUrl(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error text-white text-xs flex items-center justify-center hover:bg-error/80 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background-tertiary border border-white/10 hover:border-accent-warm/40 cursor-pointer transition-colors w-fit text-sm text-text-muted hover:text-text-secondary">
                    <span>📎</span> 파일 선택
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setScreenshotFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
              </div>
            )}

            {/* 이메일 (비로그인 시만) */}
            {isLoggedIn === false && (
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  이메일 <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="답변 받으실 이메일 주소"
                  className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm/50 transition-all"
                />
              </div>
            )}

            {isLoggedIn === true && (
              <p className="text-xs text-text-muted bg-background-tertiary px-4 py-2.5 rounded-xl">
                💌 로그인된 계정 이메일로 답변이 전송됩니다.
              </p>
            )}

            {error && (
              <p className="text-sm text-error bg-error/10 px-4 py-2.5 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || screenshotUploading || content.trim().length < 10}
              className="w-full py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover disabled:opacity-40 transition-all"
            >
              {screenshotUploading ? '이미지 업로드 중...' : submitting ? '전송 중...' : '문의 보내기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
