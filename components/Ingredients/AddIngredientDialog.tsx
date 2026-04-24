'use client';

import { useState, useEffect } from 'react';
import { INGREDIENT_CATEGORIES } from './IngredientAutocompleteTypes';
import { useI18n } from '@/lib/i18n/context';

interface AddIngredientDialogProps {
  /** 다이얼로그 열림 상태 */
  isOpen: boolean;

  /** 다이얼로그 닫기 핸들러 */
  onClose: () => void;

  /**
   * 재료 추가 성공 핸들러
   * @param ingredient - 생성된 재료 정보 (API 응답)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (ingredient: any) => void;

  /** 초기 재료명 (검색어에서 전달) */
  initialName?: string;
}

const COMMON_UNITS = [
  'g', 'kg', 'ml', 'L', 'T', 't', '개', '조각', '컵', '큰술', '작은술', '꼬집'
];

/**
 * 새 재료 추가 다이얼로그
 * 사용자가 DB에 없는 재료를 추가할 수 있음 (크라우드소싱)
 *
 * @example
 * ```tsx
 * <AddIngredientDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   onSuccess={() => {
 *     setShowDialog(false);
 *     refetchIngredients();
 *   }}
 *   initialName={searchQuery}
 * />
 * ```
 */
export default function AddIngredientDialog({
  isOpen,
  onClose,
  onSuccess,
  initialName = '',
}: AddIngredientDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('other');
  const [commonUnits, setCommonUnits] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duplicateError, setDuplicateError] = useState('');
  const [similarIngredient, setSimilarIngredient] = useState<string | null>(null);

  /**
   * 초기값 설정
   */
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setNameEn('');
      setCategory('other');
      setCommonUnits([]);
      setError('');
      setDuplicateError('');
      setSimilarIngredient(null);
      setSubmitting(false);
    }
  }, [isOpen, initialName]);

  /**
   * 중복 체크 (디바운싱)
   */
  useEffect(() => {
    if (!name || name.length < 2) {
      setDuplicateError('');
      setSimilarIngredient(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/ingredients/check-duplicate?name=${encodeURIComponent(name)}`
        );
        const data = await response.json();

        if (data.duplicate) {
          setDuplicateError('비슷한 재료가 이미 있습니다');
          setSimilarIngredient(data.similar.name);
        } else {
          setDuplicateError('');
          setSimilarIngredient(null);
        }
      } catch (err) {
        console.error('Duplicate check failed:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [name]);

  /**
   * 유효성 검사
   */
  const isValid = (): boolean => {
    if (!name || name.length < 2 || name.length > 50) {
      setError(t.ingredient.errorNameLength);
      return false;
    }

    if (duplicateError) {
      return false;
    }

    if (!category) {
      setError(t.ingredient.errorCategoryRequired);
      return false;
    }

    setError('');
    return true;
  };

  /**
   * 단위 토글
   */
  const toggleUnit = (unit: string) => {
    if (commonUnits.includes(unit)) {
      setCommonUnits(commonUnits.filter((u) => u !== unit));
    } else {
      setCommonUnits([...commonUnits, unit]);
    }
  };

  /**
   * 제출 핸들러
   */
  const handleSubmit = async () => {
    if (!isValid()) return;

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch('/api/ingredients/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          name_en: nameEn || null,
          category,
          common_units: commonUnits,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.ingredient.errorCreateFailed);
      }

      // 성공 - 생성된 재료 정보를 콜백으로 전달
      if (onSuccess) {
        onSuccess(data.ingredient);
      }
    } catch (err) {
      console.error('Error creating ingredient:', err);
      setError(err instanceof Error ? err.message : t.ingredient.errorCreateGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 다이얼로그 */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-background-primary border border-white/10 shadow-2xl">
        {/* 헤더 */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-text-primary">{t.ingredient.dialogTitle}</h2>
          <p className="text-sm text-text-muted mt-1">
            {t.ingredient.dialogSubtitle}
          </p>
        </div>

        {/* 폼 */}
        <div className="p-6 space-y-4">
          {/* 재료명 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t.ingredient.nameKorLabel} <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 새송이버섯"
              maxLength={50}
              className="w-full px-4 py-2 rounded-xl bg-background-secondary border border-white/10 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm/50 focus:ring-2 focus:ring-2 focus:ring-accent-warm/20 transition-all"
              required
            />
            {duplicateError && similarIngredient && (
              <p className="text-error text-sm mt-1">
                {t.ingredient.duplicateWarning.replace('{name}', similarIngredient)}
              </p>
            )}
          </div>

          {/* 재료명 영문 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t.ingredient.nameEnLabel}
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="예: King Oyster Mushroom"
              className="w-full px-4 py-2 rounded-xl bg-background-secondary border border-white/10 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-warm/50 focus:ring-2 focus:ring-2 focus:ring-accent-warm/20 transition-all"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t.quickAdd.category} <span className="text-error">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-background-secondary border border-white/10 text-text-primary focus:outline-none focus:border-accent-warm/50 focus:ring-2 focus:ring-2 focus:ring-accent-warm/20 transition-all"
              required
            >
              {INGREDIENT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 일반 단위 */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t.ingredient.unitsLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_UNITS.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => toggleUnit(unit)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    commonUnits.includes(unit)
                      ? 'bg-accent-warm text-background-primary'
                      : 'bg-background-secondary text-text-secondary hover:bg-white/10'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="rounded-xl bg-error/10 border border-error/20 p-3">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl bg-background-secondary text-text-secondary hover:bg-white/10 transition-colors"
              disabled={submitting}
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!name || submitting || !!duplicateError}
              className="flex-1 px-4 py-2 rounded-xl bg-accent-warm text-background-primary font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t.ingredient.addingButton : t.ingredient.addButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
