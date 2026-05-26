'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useI18n } from '@/lib/i18n/context';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

interface ImageCropModalProps {
  /** 자를 원본 파일 — null/undefined 면 모달 안 뜸 */
  file: File | null;
  /** 자른 결과 비율 — 기본 16:9 (썸네일/OG 일관성). 자유 비율은 지원 안 함 */
  aspect?: number;
  /** 확인 — 자른 결과 File. 호출자가 storage 업로드 책임 */
  onCropComplete: (cropped: File) => void;
  /** 취소 — 사용자가 ESC/취소 버튼/backdrop 클릭 */
  onCancel: () => void;
}

/**
 * 이미지 자르기 모달 — 썸네일 업로드 흐름의 중간 단계.
 *
 * 사용 패턴:
 *   const [pendingFile, setPendingFile] = useState<File | null>(null);
 *   <input onChange={e => setPendingFile(e.target.files?.[0] ?? null)} />
 *   <ImageCropModal
 *     file={pendingFile}
 *     onCropComplete={cropped => { setPendingFile(null); uploadCropped(cropped); }}
 *     onCancel={() => setPendingFile(null)}
 *   />
 *
 * 왜 16:9 고정:
 *  - 카드·banner·OG 그래프 디스플레이 일관성 (자유 비율 = 카드마다 다른 잘림)
 *  - 사용자가 비율 고민 X — 16:9 영역만 잡으면 됨
 *  - 옵션 3 결정 ([[project-thumbnail-crop-next-session]])
 *
 * canvas blob 변환:
 *  - 원본 mime 유지 시도 (jpeg → image/jpeg, png → image/png, webp → image/webp).
 *    그 외 image/jpeg fallback (조리 사진은 보통 사진 = jpeg 가 적합).
 *  - 출력 파일명 = 원본 이름 + `-cropped` 접미사 + 원본 확장자.
 *  - 큰 사진(휴대폰 12MP+) 대응: 자른 영역의 *natural* 픽셀 그대로 출력 (resize 안 함).
 *    압축은 호출자/Supabase 측 책임.
 *
 * a11y:
 *  - role="dialog" + aria-modal=true + aria-labelledby
 *  - ESC → cancel · Tab focus trap · 모달 닫힐 때 trigger 로 focus 복원 (자동)
 *  - backdrop 클릭 → cancel (loading 중엔 차단)
 *  - 모달 열림 ↔ 다음 frame 에서 확인 버튼 focus (Enter 즉시 확정 가능)
 */
export default function ImageCropModal({
  file,
  aspect = 16 / 9,
  onCropComplete,
  onCancel,
}: ImageCropModalProps) {
  const { t } = useI18n();
  const isOpen = !!file;

  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>(undefined);
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  // file → blob URL (모달 열릴 때만 생성, 닫힐 때 revoke). useMemo 로 file 변경 시
  // 정확히 한 번 생성하고, cleanup 이 이전 URL 을 revoke.
  const imageSrc = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    if (!imageSrc) return;
    return () => URL.revokeObjectURL(imageSrc);
  }, [imageSrc]);

  // 새 파일이 들어오면 crop state 초기화. (이전 모달의 잔여 crop 이 새 이미지에 적용되는 걸 차단)
  useEffect(() => {
    if (!file) return;
    setCrop(undefined);
    setCompletedCrop(undefined);
    setProcessing(false);
  }, [file]);

  // 모달 열리면 확인 버튼 focus.
  useEffect(() => {
    if (!isOpen) return;
    // raf — ReactCrop 렌더 완료 후 focus (DOM 순서 보장)
    const id = requestAnimationFrame(() => confirmBtnRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEscapeKey(onCancel, isOpen && !processing);
  useFocusTrap(isOpen, panelRef, undefined, { autoRestorePreviousFocus: true });

  /** 이미지 로드 시 — 중앙 정렬 + 비율 맞춤 초기 crop. */
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
      // makeAspectCrop 는 %-unit 으로 안전 (이미지 displayed 크기 변화 무관).
      const initial = makeAspectCrop({ unit: '%', width: 90 }, aspect, w, h);
      const centered = centerCrop(initial, w, h);
      setCrop(centered);
    },
    [aspect],
  );

  /** canvas 로 픽셀 영역 잘라 Blob 반환. natural 픽셀 그대로 (resize X). */
  const cropToFile = useCallback(async (): Promise<File | null> => {
    if (!file || !imgRef.current || !completedCrop) return null;
    const img = imgRef.current;
    // ReactCrop 이 *displayed* 좌표를 주므로 natural/displayed 비율 변환 필요.
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const sx = completedCrop.x * scaleX;
    const sy = completedCrop.y * scaleY;
    const sw = completedCrop.width * scaleX;
    const sh = completedCrop.height * scaleY;
    if (sw < 1 || sh < 1) return null;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // 원본 mime 유지 시도. file.type 가 비어있거나 비-이미지면 jpeg fallback.
    const mime = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
    const quality = mime === 'image/jpeg' || mime === 'image/webp' ? 0.92 : undefined;

    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), mime, quality);
    });
    if (!blob) return null;

    // 원본 확장자 보존. 못 찾으면 mime 에서 추출.
    const dot = file.name.lastIndexOf('.');
    const base = dot > 0 ? file.name.slice(0, dot) : file.name;
    const extFromName = dot > 0 ? file.name.slice(dot) : '';
    const ext = extFromName || `.${mime.split('/')[1] ?? 'jpg'}`;
    return new File([blob], `${base}-cropped${ext}`, { type: mime, lastModified: Date.now() });
  }, [file, completedCrop]);

  const handleConfirm = useCallback(async () => {
    if (processing || !completedCrop) return;
    setProcessing(true);
    try {
      const cropped = await cropToFile();
      if (!cropped) {
        // 캔버스/blob 변환 실패 — 모달 닫지 않고 사용자가 다시 시도 가능.
        setProcessing(false);
        return;
      }
      onCropComplete(cropped);
      // 호출자가 file=null 로 설정 → 모달 닫힘 → processing 자동 reset.
    } catch {
      setProcessing(false);
    }
  }, [processing, completedCrop, cropToFile, onCropComplete]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label={t.common.cancel}
        onClick={() => { if (!processing) onCancel(); }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        className="relative w-full max-w-3xl rounded-2xl bg-background-secondary border border-white/10 shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col"
      >
        <div className="space-y-1">
          <h2 id="image-crop-modal-title" className="text-lg font-bold text-text-primary">
            {t.common.cropTitle}
          </h2>
          <p className="text-xs text-text-muted">{t.common.cropHint}</p>
        </div>

        <div className="flex-1 min-h-0 overflow-auto rounded-xl bg-black/40 flex items-center justify-center p-2">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              aspect={aspect}
              keepSelection
              minWidth={40}
              minHeight={40}
              ruleOfThirds
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt=""
                onLoad={handleImageLoad}
                style={{ maxHeight: '70vh', maxWidth: '100%', display: 'block' }}
              />
            </ReactCrop>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl bg-background-tertiary text-text-secondary text-sm font-medium hover:text-text-primary transition-colors disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            disabled={processing || !completedCrop}
            className="flex-1 py-2.5 rounded-xl bg-accent-warm text-background-primary text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {processing ? t.common.loading : t.common.cropConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
