'use client';

import { useState } from 'react';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import { Picker, type MasterResult } from './AddRelationForm';

/**
 * 변형 계층(base_ingredient_id) 설정 폼 (2026-05-31).
 *
 * "이 재료는 <base>의 한 종류" — 변형(삼겹살) 보유 → base(돼지고기) 필요 레시피 충족.
 * 설계: docs/INGREDIENT_MODEL_REDESIGN.md §2(분류)·§5(변형 매칭).
 *
 *  - 단방향: 변형→base 만 매칭. base→변형·형제는 missing(정직성).
 *  - 강제 1단계: API(set_base)가 자기참조·다단계·순환 거부.
 *  - 가공(다진마늘)·대체와 *다름* — 부위/종류(is-a)일 때만. 가공은 "관계 추가" 사용.
 */
export default function SetBaseForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const { t } = useI18n();
  const [variant, setVariant] = useState<MasterResult | null>(null);
  const [base, setBase] = useState<MasterResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!variant || !base) return;
    if (variant.id === base.id) { toast.error('서로 다른 재료를 선택하세요'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/ingredient-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_base', target_id: variant.id, base_id: base.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.common.error);
      toast.success(`${variant.name} → ${base.name} 변형 설정 완료`);
      setVariant(null);
      setBase(null);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-background-secondary/40 p-4 mb-6">
      <h3 className="text-sm font-bold mb-1">＋ 변형 계층 설정 (부위·종류)</h3>
      <p className="text-xs text-text-muted mb-3">
        삼겹살→돼지고기, 현미→쌀 처럼 <b>한 종류(is-a)</b>일 때. 변형 보유 시 base 필요 레시피가 충족됨(단방향).
        손질 단계(다진마늘)·대체는 &quot;관계 추가&quot;를 쓰세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Picker label="변형 (예: 삼겹살)" selected={variant} onSelect={setVariant} onClear={() => setVariant(null)} />
        <Picker label="base (예: 돼지고기)" selected={base} onSelect={setBase} onClear={() => setBase(null)} />
      </div>

      {variant && base && (
        <p className="text-xs text-text-secondary mb-2">
          {variant.name} 은(는) {base.name} 의 한 종류 — &quot;{base.name} 필요&quot; 레시피에 {variant.name} 보유가 충족
        </p>
      )}

      <button
        type="button"
        disabled={!variant || !base || submitting}
        onClick={submit}
        className="px-4 py-2 rounded-lg bg-accent-warm text-background-primary font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 text-sm"
      >
        {submitting ? '설정 중…' : '변형으로 설정'}
      </button>
    </section>
  );
}
