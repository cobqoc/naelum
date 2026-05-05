'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { inferStorageLocation } from '@/lib/ingredients/storageMap';

// tesseract.js는 브라우저 전용 — dynamic import
type TesseractWorker = {
  recognize: (image: File | string) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<void>;
};

const CATEGORY_EMOJI: Record<string, string> = {
  veggie: '🥬', fruit: '🍎', meat: '🥩', seafood: '🐟',
  grain: '🌾', dairy: '🧀', seasoning: '🧂', condiment: '🧂',
  other: '📦',
};

const CATEGORY_LABEL: Record<string, string> = {
  veggie: '채소', fruit: '과일', meat: '육류', seafood: '해산물',
  grain: '곡물', dairy: '유제품', seasoning: '양념', condiment: '조미료',
  other: '기타',
};

interface MatchedIngredient {
  id: string;
  name: string;
  category: string;
  common_units: string[];
  matchedFrom: string;
}

type Step = 'select' | 'scanning' | 'result' | 'adding' | 'done';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (count: number) => void;
}

export default function ReceiptScannerModal({ isOpen, onClose, onAdded }: Props) {
  const [step, setStep] = useState<Step>('select');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [matched, setMatched] = useState<MatchedIngredient[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<TesseractWorker | null>(null);

  useEscapeKey(() => { if (step !== 'scanning' && step !== 'adding') onClose(); }, isOpen);

  // 모달 닫히면 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setImagePreview(null);
      setImageFile(null);
      setProgress(0);
      setProgressLabel('');
      setMatched([]);
      setSelected(new Set());
      setError(null);
      workerRef.current?.terminate();
      workerRef.current = null;
    }
  }, [isOpen]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
    setStep('select'); // 이미지 선택된 상태 유지 (스캔 버튼 누르기 전)
    e.target.value = ''; // 같은 파일 재선택 가능하게
  }, []);

  const startScan = useCallback(async () => {
    if (!imageFile) return;
    setStep('scanning');
    setError(null);
    setProgress(0);
    setProgressLabel('OCR 엔진 로딩 중...');

    try {
      // Tesseract.js 동적 로드 (브라우저 전용)
      const { createWorker } = await import('tesseract.js');

      setProgress(15);
      setProgressLabel('한국어 언어팩 로딩 중... (첫 실행 시 시간이 걸릴 수 있어요)');

      const worker = await createWorker(['kor', 'eng'], 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(50 + Math.round(m.progress * 40));
            setProgressLabel('텍스트 인식 중...');
          } else if (m.status === 'loading language traineddata') {
            setProgress(20 + Math.round(m.progress * 20));
            setProgressLabel('언어 데이터 로딩 중...');
          }
        },
      });

      workerRef.current = worker as unknown as TesseractWorker;

      setProgress(45);
      setProgressLabel('이미지 분석 중...');

      const { data } = await worker.recognize(imageFile);
      await worker.terminate();
      workerRef.current = null;

      setProgress(92);
      setProgressLabel('재료 매칭 중...');

      // API로 텍스트 전달 → 재료 매칭
      const res = await fetch('/api/ingredients/match-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.text }),
      });

      if (!res.ok) throw new Error('재료 매칭 실패');
      const json = await res.json() as { matched: MatchedIngredient[] };

      setProgress(100);
      setMatched(json.matched);
      setSelected(new Set(json.matched.map(m => m.id)));
      setStep('result');
    } catch (err) {
      console.error(err);
      setError('스캔 중 오류가 발생했어요. 다시 시도해주세요.');
      setStep('select');
    }
  }, [imageFile]);

  const handleAdd = useCallback(async () => {
    const toAdd = matched.filter(m => selected.has(m.id));
    if (toAdd.length === 0) return;

    setStep('adding');

    const items = toAdd.map(ing => ({
      ingredient_name: ing.name,
      category: ing.category,
      quantity: null,
      unit: ing.common_units[0] ?? null,
      storage_location: inferStorageLocation(ing.name, ing.category),
    }));

    try {
      const res = await fetch('/api/shopping-list/add-to-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error('추가 실패');

      setStep('done');
      onAdded(toAdd.length);
    } catch {
      setError('재료 추가 중 오류가 발생했어요.');
      setStep('result');
    }
  }, [matched, selected, onAdded]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={() => { if (step !== 'scanning' && step !== 'adding') onClose(); }}
      />

      {/* 모달 */}
      <div className="fixed inset-x-4 bottom-4 top-16 z-50 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] md:top-1/2 md:-translate-y-1/2 md:bottom-auto">
        <div className="bg-background-secondary rounded-3xl border border-white/10 h-full md:h-auto md:max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">

          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧾</span>
              <h2 className="text-base font-bold">영수증 스캔</h2>
            </div>
            {step !== 'scanning' && step !== 'adding' && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* 본문 */}
          <div className="flex-1 overflow-y-auto">

            {/* ── STEP: select / 이미지 선택 ── */}
            {(step === 'select') && (
              <div className="p-5 space-y-4">
                {/* 이미지 프리뷰 or 업로드 안내 */}
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="영수증 미리보기"
                      className="w-full rounded-2xl object-contain max-h-64 bg-black"
                    />
                    <button
                      onClick={() => { setImagePreview(null); setImageFile(null); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-2xl border-2 border-dashed border-white/20 hover:border-accent-warm/50 bg-background-primary/40 hover:bg-accent-warm/5 flex flex-col items-center justify-center gap-3 transition-all group"
                  >
                    <span className="text-5xl group-hover:scale-110 transition-transform">📷</span>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-text-primary">카메라로 영수증 찍기</p>
                      <p className="text-xs text-text-muted mt-1">또는 갤러리에서 선택</p>
                    </div>
                  </button>
                )}

                {/* 안내 */}
                <div className="bg-background-primary/60 rounded-xl p-3.5 space-y-1.5">
                  <p className="text-xs font-semibold text-text-secondary">잘 인식되려면</p>
                  <p className="text-xs text-text-muted">• 영수증이 펼쳐지고 전체가 보이게 찍어주세요</p>
                  <p className="text-xs text-text-muted">• 밝은 곳에서 찍으면 정확도가 높아요</p>
                  <p className="text-xs text-text-muted">• 흔들림 없이 수평으로 찍어주세요</p>
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
                )}
              </div>
            )}

            {/* ── STEP: scanning ── */}
            {step === 'scanning' && (
              <div className="p-5 flex flex-col items-center justify-center gap-6 min-h-48">
                {/* 프로그레스 링 */}
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="white" strokeOpacity="0.08" strokeWidth="8" fill="none" />
                    <circle
                      cx="50" cy="50" r="42"
                      stroke="#ff9966" strokeWidth="8" fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-accent-warm">{progress}%</span>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold">영수증 분석 중...</p>
                  <p className="text-xs text-text-muted">{progressLabel}</p>
                  <p className="text-[10px] text-text-muted mt-2">첫 실행 시 언어팩 다운로드로 1~2분 소요될 수 있어요</p>
                </div>
              </div>
            )}

            {/* ── STEP: result ── */}
            {step === 'result' && (
              <div className="p-5 space-y-4">
                {matched.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <span className="text-5xl">😅</span>
                    <p className="text-sm font-semibold">재료를 찾지 못했어요</p>
                    <p className="text-xs text-text-muted">영수증 사진을 다시 찍거나<br />밝은 곳에서 흔들림 없이 시도해주세요</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        재료 {matched.length}개 발견
                        <span className="text-text-muted font-normal ml-1">— 냉장고에 추가할 항목을 선택하세요</span>
                      </p>
                      <button
                        onClick={() => {
                          if (selected.size === matched.length) setSelected(new Set());
                          else setSelected(new Set(matched.map(m => m.id)));
                        }}
                        className="text-xs text-accent-warm hover:text-accent-hover"
                      >
                        {selected.size === matched.length ? '전체 해제' : '전체 선택'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {matched.map(ing => {
                        const isSelected = selected.has(ing.id);
                        const emoji = CATEGORY_EMOJI[ing.category] ?? '📦';
                        const catLabel = CATEGORY_LABEL[ing.category] ?? '기타';

                        return (
                          <button
                            key={ing.id}
                            onClick={() => toggleSelect(ing.id)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                              isSelected
                                ? 'bg-accent-warm/10 border-accent-warm/40'
                                : 'bg-background-primary/40 border-white/8 opacity-50'
                            }`}
                          >
                            <span className="text-xl shrink-0">{emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{ing.name}</p>
                              <p className="text-xs text-text-muted">{catLabel}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'bg-accent-warm border-accent-warm' : 'border-white/20'
                            }`}>
                              {isSelected && <span className="text-[10px] text-background-primary font-bold">✓</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
                )}
              </div>
            )}

            {/* ── STEP: adding ── */}
            {step === 'adding' && (
              <div className="p-5 flex flex-col items-center justify-center gap-4 min-h-48">
                <div className="w-10 h-10 border-4 border-accent-warm/30 border-t-accent-warm rounded-full animate-spin" />
                <p className="text-sm font-semibold">냉장고에 추가하는 중...</p>
              </div>
            )}

            {/* ── STEP: done ── */}
            {step === 'done' && (
              <div className="p-5 flex flex-col items-center justify-center gap-4 min-h-48 text-center">
                <span className="text-5xl">🎉</span>
                <div className="space-y-1">
                  <p className="text-base font-bold">추가 완료!</p>
                  <p className="text-sm text-text-muted">냉장고에서 확인해보세요</p>
                </div>
              </div>
            )}

          </div>

          {/* 푸터 버튼 */}
          <div className="px-5 py-4 border-t border-white/8 shrink-0">
            {step === 'select' && (
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 rounded-xl bg-background-tertiary hover:bg-white/10 border border-white/10 text-sm font-semibold transition-colors"
                >
                  {imagePreview ? '다시 찍기' : '📷 사진 선택'}
                </button>
                {imageFile && (
                  <button
                    onClick={startScan}
                    className="flex-1 py-3 rounded-xl bg-accent-warm hover:bg-accent-hover text-background-primary text-sm font-bold transition-colors active:scale-95"
                  >
                    스캔 시작 →
                  </button>
                )}
              </div>
            )}

            {step === 'result' && matched.length > 0 && (
              <button
                onClick={handleAdd}
                disabled={selected.size === 0}
                className="w-full py-3.5 rounded-xl bg-accent-warm hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-background-primary text-sm font-bold transition-all active:scale-95"
              >
                냉장고에 추가하기 ({selected.size}개)
              </button>
            )}

            {step === 'result' && matched.length === 0 && (
              <button
                onClick={() => { setStep('select'); setImagePreview(null); setImageFile(null); }}
                className="w-full py-3.5 rounded-xl bg-background-tertiary border border-white/10 text-sm font-semibold transition-colors"
              >
                다시 시도
              </button>
            )}

            {step === 'done' && (
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-accent-warm hover:bg-accent-hover text-background-primary text-sm font-bold transition-colors active:scale-95"
              >
                확인
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 숨겨진 파일 입력 — 모바일에서 카메라 직접 열기 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
