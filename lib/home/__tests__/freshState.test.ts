import { describe, it, expect } from 'vitest';
import { freshState, addDaysISO } from '@/app/[lang]/_home/helpers';

// 회귀 가드(2026-06-03): freshState 에 "추정(estimate)" 경로를 추가하기 전 baseline.
// ── 확정(유저 입력 expiry_date) 경로의 행위(테두리·labelKind·isDanger)는 불변이어야 한다. ──
// objectContaining: 새로 추가되는 isEstimate 필드엔 견고하게, 핵심 행위만 검증.
describe('freshState — 확정 만료(expiry_date) 경로 [불변 보장]', () => {
  it('만료됨(D-0 이하): expired·isDanger·진한 빨강', () => {
    expect(freshState({ expiry_date: addDaysISO(-1), category: 'veggie', storage_location: '냉장' }))
      .toEqual(expect.objectContaining({ border: '#991b1b', labelKind: 'expired', labelN: 0, isDanger: true }));
  });
  it('임박(D-3 이하): dDay·isDanger·빨강', () => {
    expect(freshState({ expiry_date: addDaysISO(2), category: 'veggie', storage_location: '냉장' }))
      .toEqual(expect.objectContaining({ border: '#dc2626', labelKind: 'dDay', labelN: 2, isDanger: true }));
  });
  it('주의(D-7 이하): dDay·비위험·주황', () => {
    expect(freshState({ expiry_date: addDaysISO(5), category: 'veggie', storage_location: '냉장' }))
      .toEqual(expect.objectContaining({ border: '#d97706', labelKind: 'dDay', labelN: 5, isDanger: false }));
  });
  it('여유(D-8 이상): 라벨 없음·초록', () => {
    expect(freshState({ expiry_date: addDaysISO(20), category: 'veggie', storage_location: '냉장' }))
      .toEqual(expect.objectContaining({ border: '#4d7c0f', labelKind: null, labelN: 0, isDanger: false }));
  });
  it('확정 경로는 추정 아님', () => {
    expect(freshState({ expiry_date: addDaysISO(2), category: 'veggie', storage_location: '냉장' }).isEstimate).toBe(false);
  });
});

// ── 신규: 추정 경로(expiry_date 없음 + purchase_date + 보관위치별 보관일수) ──
// 핵심 불변식: 추정은 절대 isDanger(빨강 펄스) 안 띄움 — isEstimate=true.
describe('freshState — 추정(estimate) 경로 [신규]', () => {
  it('임박 추정: 오늘 산 해산물 냉장(2일) → dDay·비위험·추정', () => {
    expect(freshState({ expiry_date: null, purchase_date: addDaysISO(0), category: 'seafood', storage_location: '냉장' }))
      .toEqual({ border: '#d97706', labelKind: 'dDay', labelN: 2, isDanger: false, isEstimate: true });
  });
  it('만료 추정(과거 구매): isDanger 안 띄움(빨강X), 추정', () => {
    const s = freshState({ expiry_date: null, purchase_date: addDaysISO(-10), category: 'seafood', storage_location: '냉장' });
    expect(s.labelKind).toBe('expired');
    expect(s.isDanger).toBe(false); // 추정은 절대 빨강 아님
    expect(s.isEstimate).toBe(true);
  });
  it('여유 추정: 오늘 산 채소 냉동(180일) → 라벨 없음·추정', () => {
    expect(freshState({ expiry_date: null, purchase_date: addDaysISO(0), category: 'veggie', storage_location: '냉동' }))
      .toEqual({ border: '#4d7c0f', labelKind: null, labelN: 0, isDanger: false, isEstimate: true });
  });
  it('tier②: 재료별 shelf_life_days 가 카테고리 추정을 이김', () => {
    // category seafood 냉장=2 라면 dDay 임박이지만, 재료별 {냉장:30} 이면 여유(라벨 없음)
    expect(freshState({ expiry_date: null, purchase_date: addDaysISO(0), category: 'seafood', storage_location: '냉장', shelf_life_days: { 냉장: 30 } }))
      .toEqual({ border: '#4d7c0f', labelKind: null, labelN: 0, isDanger: false, isEstimate: true });
    // 같은 재료라도 {냉장:2} 면 임박 추정
    expect(freshState({ expiry_date: null, purchase_date: addDaysISO(0), category: 'seafood', storage_location: '냉장', shelf_life_days: { 냉장: 2 } }))
      .toEqual({ border: '#d97706', labelKind: 'dDay', labelN: 2, isDanger: false, isEstimate: true });
  });
});

describe('freshState — 추정 불가 시 fallback [불변 보장]', () => {
  it('expiry·purchase 둘 다 없으면 중립', () => {
    expect(freshState({ expiry_date: null, purchase_date: null, category: 'veggie', storage_location: '냉장' }))
      .toEqual(expect.objectContaining({ border: '#4d7c0f', labelKind: null, labelN: 0, isDanger: false }));
  });
  it("보관위치 불명(기타)이면 추정 안 하고 '묵힌 기간' fallback", () => {
    const s = freshState({ expiry_date: null, purchase_date: addDaysISO(-5), category: 'veggie', storage_location: '기타' });
    expect(s).toEqual({ border: '#4d7c0f', labelKind: 'daysAged', labelN: 5, isDanger: false, isEstimate: false });
  });
});
