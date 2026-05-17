import Image from 'next/image';
import type { TranslationKeys } from '@/lib/i18n/translations';

/**
 * 레시피 작성 폼 — 완성 요리 썸네일 업로드 필드 (presentational).
 *
 * god-file(NewRecipePage) 분해 — [[BasicInfoSection]]·[[RecipeFormFooter]]·
 * [[IngredientsSection]] 규약 동일:
 *  1. 상태(thumbnailImage·uploadingThumbnail·isDraggingThumbnail)·로직
 *     (handleThumbnailUpload/Remove/Drag*)은 전부 부모(page.tsx) 소유.
 *     이 컴포넌트는 값+콜백만(순수 표현 — ref/async/local state 0).
 *  2. JSX byte-identical(마크업·className·SVG·핸들러 시그니처 동일,
 *     handler prop명만 onUpload/onRemove/onDrag* — 기존 추출 컴포넌트
 *     관례와 동일, 함수 동일성 보존) → 행위 변경 0.
 *  3. 안전망: e2e/recipe-creation.spec.ts "UI 회귀" 가 드롭존 렌더
 *     (tf.finalPhotoAdd) 를 가드. 파일 업로드/DnD 실제 동작은 부모
 *     핸들러 잔류 + 수동 QA(file picker e2e 비현실적).
 */

interface ThumbnailUploadFieldProps {
  tf: TranslationKeys['recipeForm'];
  thumbnailImage: string | null;
  uploadingThumbnail: boolean;
  isDraggingThumbnail: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onDrag: (e: React.DragEvent) => void;
  onDragIn: (e: React.DragEvent) => void;
  onDragOut: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function ThumbnailUploadField({
  tf,
  thumbnailImage,
  uploadingThumbnail,
  isDraggingThumbnail,
  onUpload,
  onRemove,
  onDrag,
  onDragIn,
  onDragOut,
  onDrop,
}: ThumbnailUploadFieldProps) {
  return (
          <div className="space-y-3 pt-4">
            <label className="text-sm font-medium text-text-secondary">{tf.finalPhotoLabel}</label>
            <p className="text-xs text-text-muted">{tf.finalPhotoDesc}</p>
            {thumbnailImage ? (
              <div className="relative w-full h-64">
                <Image
                  src={thumbnailImage}
                  alt={tf.finalPhotoLabel}
                  fill
                  className="object-cover rounded-xl"
                />
                <button
                  onClick={onRemove}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-error transition-all text-xl"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="block w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUpload(file);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                  disabled={uploadingThumbnail}
                />
                <div
                  className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                    isDraggingThumbnail
                      ? 'border-accent-warm bg-accent-warm/10'
                      : 'border-white/20 hover:border-accent-warm hover:bg-white/5'
                  }`}
                  onDragOver={onDrag}
                  onDragEnter={onDragIn}
                  onDragLeave={onDragOut}
                  onDrop={onDrop}
                >
                  {uploadingThumbnail ? (
                    <>
                      <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-text-muted">{tf.uploading}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-center">
                        <p className="text-sm font-medium text-text-primary">{tf.finalPhotoAdd}</p>
                        <p className="text-xs text-text-muted mt-1">{tf.maxFileSize}</p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            )}
          </div>
  );
}
