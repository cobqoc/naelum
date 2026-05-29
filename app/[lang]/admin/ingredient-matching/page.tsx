'use client';

import { useState } from 'react';
import LinkingTab from './_components/LinkingTab';
import AddRelationForm from './_components/AddRelationForm';
import RelationsPanel from '../substitute-suggestions/page';

/**
 * 재료 매칭 관리 — 한 페이지, 두 탭 (2026-05-29).
 *
 *  ① 번호 연결  — recipe_ingredients 에 ingredient_id 붙이기 (LinkingTab)
 *  ② 관계 승인  — substitute/preparable 관계 (기존 substitute-suggestions 패널 재사용)
 *
 * V2 매칭은 번호(id) 기반 — 추측 0. 번호 붙이기(①)와 관계(②)가 매칭의 두 축.
 */

type Tab = 'linking' | 'relations';

export default function IngredientMatchingPage() {
  const [tab, setTab] = useState<Tab>('linking');
  // 관계 직접 추가 후 RelationsPanel 재마운트 → 목록 새로고침
  const [relKey, setRelKey] = useState(0);

  const tabClass = (active: boolean) =>
    `px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors ${
      active
        ? 'border-accent-warm text-accent-warm'
        : 'border-transparent text-text-secondary hover:text-text-primary'
    }`;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1">재료 매칭 관리</h1>
        <p className="text-sm text-text-secondary">
          레시피 재료에 번호(ingredient_id) 붙이기 + 관계(대체·가공) 승인. V2 매칭은 번호 기반 — 추측 0.
        </p>
      </div>

      <div className="flex gap-1 border-b border-white/10 mb-6" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'linking'} onClick={() => setTab('linking')} className={tabClass(tab === 'linking')}>
          🔢 번호 연결
        </button>
        <button type="button" role="tab" aria-selected={tab === 'relations'} onClick={() => setTab('relations')} className={tabClass(tab === 'relations')}>
          🔗 관계 승인
        </button>
      </div>

      {tab === 'linking' ? (
        <LinkingTab />
      ) : (
        <>
          <AddRelationForm onAdded={() => setRelKey((k) => k + 1)} />
          <RelationsPanel key={relKey} />
        </>
      )}
    </div>
  );
}
