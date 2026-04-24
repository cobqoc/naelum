'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_KEYS = [
  { key: 'bug', icon: '🐛' },
  { key: 'feature', icon: '💡' },
  { key: 'other', icon: '💬' },
] as const;

type Category = typeof CATEGORY_KEYS[number]['key'];

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const { t } = useI18n();
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
      setError(t.contact.errorMinLength);
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
        setError(data.error || t.contact.errorSubmit);
        return;
      }
      setSubmitted(true);
    } catch {
      setError(t.contact.errorNetwork);
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
          <h3 className="text-xl font-bold">{t.contact.title}</h3>
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
            <h4 className="text-lg font-bold mb-2">{t.contact.successTitle}</h4>
            <p className="text-sm text-text-muted mb-6">{t.contact.successDesc}</p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-colors"
            >
              {t.contact.closeButton}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 카테고리 */}
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">{t.contact.typeLabel}</label>
              <div className="flex gap-2">
                {CATEGORY_KEYS.map((c) => (
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
                    <span>{c.key === 'bug' ? t.contact.typeBug : c.key === 'feature' ? t.contact.typeFeature : t.contact.typeOther}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 내용 */}
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                {t.contact.contentLabel} <span className="text-error">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder={
                  category === 'bug'
                    ? t.contact.bugPlaceholder
                    : category === 'feature'
                    ? t.contact.featurePlaceholder
                    : t.contact.otherPlaceholder
                }
                className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm/50 transition-all resize-none"
              />
              <p className="text-xs text-text-muted mt-1 text-right">{t.contact.charCount.replace('{n}', String(content.length))}</p>
            </div>

            {/* 스크린샷 첨부 (로그인 시만) */}
            {isLoggedIn === true && (
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  {t.contact.screenshotLabel} <span className="text-text-muted text-xs">{t.contact.screenshotHint}</span>
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
                    <span>📎</span> {t.contact.fileSelect}
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
                  {t.contact.emailLabel} <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.contact.emailPlaceholder}
                  className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm/50 transition-all"
                />
              </div>
            )}

            {isLoggedIn === true && (
              <p className="text-xs text-text-muted bg-background-tertiary px-4 py-2.5 rounded-xl">
                {t.contact.replyEmailNote}
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
              {screenshotUploading ? t.contact.uploadingImage : submitting ? t.contact.submitting : t.contact.submitButton}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
