'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { getCategoryIcon } from './IngredientAutocompleteTypes';

interface ScannedItem {
  rawText: string;
  itemName: string;
  quantity: number | null;
  unit: string | null;
  price: number | null;
  ingredient: {
    id: string;
    name: string;
    name_en: string | null;
    category: string;
  } | null;
  confidence: number;
  checked: boolean;
  editedName: string;
  editedCategory: string;
}

interface ReceiptScannerProps {
  onAddIngredients: (labels: {
    name: string;
    ingredientId?: string;
    category: string;
    quantity?: number | null;
    unit?: string;
    purchase_date?: string;
    expiry_date?: string;
    storage_location?: string;
    notes?: string;
    expiry_alert?: boolean;
  }[]) => void;
}

type ScanStep = 'upload' | 'scanning' | 'results';


export default function ReceiptScanner({ onAddIngredients }: ReceiptScannerProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<ScanStep>('upload');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [store, setStore] = useState<string | null>(null);
  const [receiptDate, setReceiptDate] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return t.receipt.invalidFileType;
    }
    if (file.size > 5 * 1024 * 1024) {
      return t.receipt.fileTooLarge;
    }
    return null;
  };

  const processFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleScan = async () => {
    if (!image) return;

    setStep('scanning');
    setError('');

    try {
      const formData = new FormData();
      formData.append('receipt', image);

      const response = await fetch('/api/receipts/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.receipt.scanFailed);
        setStep('upload');
        return;
      }

      const items: ScannedItem[] = data.items.map((item: {
        rawText: string;
        itemName: string;
        quantity: number | null;
        unit: string | null;
        price: number | null;
        ingredient: { id: string; name: string; name_en: string | null; category: string } | null;
        confidence: number;
      }) => ({
        ...item,
        checked: item.confidence > 0,
        editedName: item.ingredient?.name || item.itemName,
        editedCategory: item.ingredient?.category || 'other',
      }));

      setScannedItems(items);
      setStore(data.store);
      setReceiptDate(data.date);
      setStep('results');
    } catch {
      setError(t.receipt.scanFailed);
      setStep('upload');
    }
  };

  const handleToggleItem = (index: number) => {
    setScannedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleToggleAll = () => {
    const allChecked = scannedItems.every((item) => item.checked);
    setScannedItems((prev) =>
      prev.map((item) => ({ ...item, checked: !allChecked }))
    );
  };

  const handleEditName = (index: number, name: string) => {
    setScannedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, editedName: name } : item
      )
    );
  };

  const handleEditCategory = (index: number, category: string) => {
    setScannedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, editedCategory: category } : item
      )
    );
  };

  const handleAddIngredients = () => {
    const selectedItems = scannedItems.filter((item) => item.checked && item.editedName.trim());

    const ingredients = selectedItems.map((item) => ({
      name: item.editedName,
      ingredientId: item.ingredient?.id,
      category: item.editedCategory,
      quantity: item.quantity,
      unit: item.unit || undefined,
      purchase_date: receiptDate || undefined,
      storage_location: '냉장',
      expiry_alert: true,
    }));

    onAddIngredients(ingredients);
    handleReset();
  };

  const handleReset = () => {
    setStep('upload');
    setImage(null);
    setPreview('');
    setScannedItems([]);
    setStore(null);
    setReceiptDate(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const checkedCount = scannedItems.filter((item) => item.checked).length;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return t.receipt.matchHigh;
    if (confidence >= 0.5) return t.receipt.matchMedium;
    if (confidence > 0) return t.receipt.matchLow;
    return t.receipt.matchNone;
  };

  return (
    <div className="space-y-4">
      {/* 업로드 단계 */}
      {step === 'upload' && (
        <>
          {/* 가이드 */}
          <div className="rounded-xl bg-accent-warm/10 p-3 text-sm text-accent-warm">
            <p className="font-medium mb-1">{t.receipt.guideTitle}</p>
            <ul className="space-y-0.5 text-accent-warm/80 text-xs">
              <li>{t.receipt.guide1}</li>
              <li>{t.receipt.guide2}</li>
              <li>{t.receipt.guide3}</li>
            </ul>
          </div>

          {/* 업로드 영역 */}
          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragOver
                  ? 'border-accent-warm bg-accent-warm/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="text-4xl mb-3">🧾</div>
              <p className="text-text-secondary text-sm">{t.receipt.uploadPrompt}</p>
              <p className="text-text-muted text-xs mt-1">{t.receipt.uploadHint}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* 이미지 미리보기 */}
              <div className="relative rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-full max-h-64 object-contain bg-background-tertiary"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                >
                  <span className="text-sm">✕</span>
                </button>
              </div>

              {/* 스캔 버튼 */}
              <button
                onClick={handleScan}
                className="w-full rounded-xl bg-accent-warm px-6 py-3 font-bold text-background-primary hover:bg-accent-hover transition-colors"
              >
                {t.receipt.scanButton}
              </button>
            </div>
          )}
        </>
      )}

      {/* 스캔 중 */}
      {step === 'scanning' && (
        <div className="py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-accent-warm border-t-transparent mb-4" />
          <p className="text-text-secondary">{t.receipt.scanning}</p>
          <p className="text-text-muted text-xs mt-1">{t.receipt.scanningHint}</p>
        </div>
      )}

      {/* 결과 단계 */}
      {step === 'results' && (
        <div className="space-y-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-text-primary">{t.receipt.scanResult}</h3>
              {store && (
                <p className="text-xs text-text-muted mt-0.5">
                  {store} {receiptDate && `| ${receiptDate}`}
                </p>
              )}
            </div>
            <button
              onClick={handleToggleAll}
              className="text-xs text-accent-warm hover:text-accent-hover transition-colors"
            >
              {scannedItems.every((i) => i.checked) ? t.receipt.deselectAll : t.receipt.selectAll}
            </button>
          </div>

          {/* 스캔된 항목 리스트 */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scannedItems.map((item, index) => (
              <div
                key={index}
                className={`rounded-xl border p-3 transition-all ${
                  item.checked
                    ? 'border-accent-warm/30 bg-accent-warm/5'
                    : 'border-white/5 bg-background-tertiary/50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 체크박스 */}
                  <button
                    onClick={() => handleToggleItem(index)}
                    className={`mt-0.5 h-5 w-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                      item.checked
                        ? 'bg-accent-warm border-accent-warm text-background-primary'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {item.checked && <span className="text-xs">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* 재료명 (편집 가능) */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.editedName}
                        onChange={(e) => handleEditName(index, e.target.value)}
                        className="flex-1 bg-transparent text-sm font-medium text-text-primary outline-none border-b border-transparent focus:border-accent-warm/50 transition-colors"
                      />
                      <span className={`text-xs ${getConfidenceColor(item.confidence)}`}>
                        {getConfidenceLabel(item.confidence)}
                      </span>
                    </div>

                    {/* 원본 텍스트 */}
                    <p className="text-xs text-text-muted mt-0.5 truncate">{item.rawText}</p>

                    {/* 카테고리 + 수량 */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <select
                        value={item.editedCategory}
                        onChange={(e) => handleEditCategory(index, e.target.value)}
                        className="text-xs bg-background-secondary rounded-lg px-2 py-1 text-text-secondary outline-none border border-white/5 focus:border-accent-warm/30"
                      >
                        {['veggie','meat','seafood','grain','dairy','seasoning','condiment','fruit','other'].map(key => (
                          <option key={key} value={key}>
                            {getCategoryIcon(key)} {key}
                          </option>
                        ))}
                      </select>

                      {item.quantity && (
                        <span className="text-xs text-text-muted">
                          {item.quantity}{item.unit || ''}
                        </span>
                      )}

                      {item.price && (
                        <span className="text-xs text-text-muted ml-auto">
                          {item.price.toLocaleString()}{t.receipt.currencyWon}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 하단 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 rounded-xl bg-background-tertiary px-4 py-3 text-sm font-medium text-text-secondary hover:bg-white/10 transition-colors"
            >
              {t.receipt.rescan}
            </button>
            <button
              onClick={handleAddIngredients}
              disabled={checkedCount === 0}
              className="flex-[2] rounded-xl bg-accent-warm px-4 py-3 text-sm font-bold text-background-primary hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.receipt.addSelected} ({checkedCount})
            </button>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-xl bg-error/10 border border-error/20 p-3 text-sm text-error">
          {error}
        </div>
      )}
    </div>
  );
}
