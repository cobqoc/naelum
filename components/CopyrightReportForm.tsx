'use client';

import { useState } from 'react';

export default function CopyrightReportForm() {
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
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
      } else {
        setErrorMsg(data.error || '접수에 실패했습니다.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다. hello@naelum.app 으로 직접 연락해주세요.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
        <p className="text-green-400 font-bold text-lg mb-1">✅ 신고가 접수되었습니다.</p>
        <p className="text-text-secondary text-sm">영업일 기준 3일 이내에 처리 결과를 이메일로 안내해드립니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">이름 또는 채널명</label>
        <input
          type="text"
          value={form.reporter_name}
          onChange={e => setForm(f => ({ ...f, reporter_name: e.target.value }))}
          placeholder="홍길동 / @채널명"
          className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-white/10 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">연락처 이메일 <span className="text-accent-warm">*</span></label>
        <input
          type="email"
          required
          value={form.reporter_email}
          onChange={e => setForm(f => ({ ...f, reporter_email: e.target.value }))}
          placeholder="example@email.com"
          className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-white/10 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">침해가 의심되는 낼름 레시피 URL</label>
        <input
          type="url"
          value={form.recipe_url}
          onChange={e => setForm(f => ({ ...f, recipe_url: e.target.value }))}
          placeholder="https://naelum.app/recipes/..."
          className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-white/10 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">침해 내용 설명 <span className="text-accent-warm">*</span></label>
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="원본 영상/콘텐츠 URL, 침해된 표현, 본인이 저작권자임을 확인하는 진술 등을 포함해 주세요."
          className="w-full px-4 py-2.5 rounded-xl bg-background-secondary border border-white/10 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm resize-none"
        />
      </div>
      {status === 'error' && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full py-3 rounded-xl bg-accent-warm text-background-primary font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
      >
        {status === 'submitting' ? '접수 중...' : '저작권 침해 신고하기'}
      </button>
    </form>
  );
}
