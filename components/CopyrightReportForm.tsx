'use client';

import { useState } from 'react';
import InputBoxWrapper, { INPUT_INNER_STYLE, INPUT_INNER_COMFORTABLE_CLASS } from '@/components/UI/InputBoxWrapper';
import { useI18n } from '@/lib/i18n/context';

export default function CopyrightReportForm() {
  const { t } = useI18n();
  const cf = t.copyrightForm;
  const [form, setForm] = useState({ reporter_name: '', reporter_email: '', recipe_url: '', description: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/copyright/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        // API 에러 문자열은 한글 하드코딩(서버 i18n 미도입) — raw 노출 금지, 번역 메시지로 치환 (CLAUDE.md)
        setErrorMsg(cf.submitFailed);
        setStatus('error');
      }
    } catch {
      setErrorMsg(cf.networkError);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
        <p className="text-green-400 font-bold text-lg mb-1">{cf.successTitle}</p>
        <p className="text-text-secondary text-sm">{cf.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{cf.nameLabel}</label>
        <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-2.5">
          <input
            type="text"
            value={form.reporter_name}
            onChange={e => setForm(f => ({ ...f, reporter_name: e.target.value }))}
            placeholder={cf.namePlaceholder}
            className={INPUT_INNER_COMFORTABLE_CLASS}
            style={INPUT_INNER_STYLE}
          />
        </InputBoxWrapper>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{cf.emailLabel} <span className="text-accent-warm">*</span></label>
        <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-2.5">
          <input
            type="email"
            required
            value={form.reporter_email}
            onChange={e => setForm(f => ({ ...f, reporter_email: e.target.value }))}
            placeholder="example@email.com"
            className={INPUT_INNER_COMFORTABLE_CLASS}
            style={INPUT_INNER_STYLE}
          />
        </InputBoxWrapper>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{cf.recipeUrlLabel}</label>
        <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-2.5">
          <input
            type="url"
            value={form.recipe_url}
            onChange={e => setForm(f => ({ ...f, recipe_url: e.target.value }))}
            placeholder="https://naelum.app/recipes/..."
            className={INPUT_INNER_COMFORTABLE_CLASS}
            style={INPUT_INNER_STYLE}
          />
        </InputBoxWrapper>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">{cf.descLabel} <span className="text-accent-warm">*</span></label>
        <InputBoxWrapper className="!bg-background-secondary !rounded-xl !px-4 !py-2.5 !min-h-[100px] !items-start">
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder={cf.descPlaceholder}
            className={`${INPUT_INNER_COMFORTABLE_CLASS} resize-none`}
            style={INPUT_INNER_STYLE}
          />
        </InputBoxWrapper>
      </div>
      {status === 'error' && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
      >
        {status === 'submitting' ? cf.submitting : cf.submit}
      </button>
    </form>
  );
}
