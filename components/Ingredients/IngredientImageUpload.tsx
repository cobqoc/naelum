'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserLabel {
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
}

interface IngredientImageUploadProps {
  onAddIngredients: (labels: UserLabel[]) => void;
}

export default function IngredientImageUpload({
  onAddIngredients
}: IngredientImageUploadProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [userLabels, setUserLabels] = useState<UserLabel[]>([]);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; name_en?: string; category?: string }[]>([]);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 파일 검증
  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return 'JPG 또는 PNG 이미지만 업로드할 수 있습니다.';
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return '이미지 크기는 5MB 이하여야 합니다.';
    }

    return null;
  };

  // 파일 선택 처리
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag & Drop 처리
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 파일 처리
  const processFile = (file: File) => {
    setError('');

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setImage(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 자동완성 검색
  const handleInputChange = async (value: string) => {
    setCurrentInput(value);

    if (value.length >= 2) {
      try {
        const response = await fetch(`/api/ingredients/autocomplete?q=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.error('자동완성 실패:', err);
      }
    } else {
      setSuggestions([]);
    }
  };

  // 재료 선택
  const handleSelectIngredient = (ingredient: { id: string; name: string; category?: string }) => {
    const newLabel: UserLabel = {
      name: ingredient.name,
      ingredientId: ingredient.id,
      category: ingredient.category || 'other',
      quantity: null,
      unit: '선택',
      purchase_date: '',
      expiry_date: '',
      storage_location: '냉장',
      notes: '',
      expiry_alert: true
    };

    setUserLabels([...userLabels, newLabel]);
    setCurrentInput('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // 재료 직접 추가 (Enter 키)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      const newLabel: UserLabel = {
        name: currentInput.trim(),
        category: 'other',
        quantity: null,
        unit: '선택',
        purchase_date: '',
        expiry_date: '',
        storage_location: '냉장',
        notes: '',
        expiry_alert: true
      };
      setUserLabels([...userLabels, newLabel]);
      setCurrentInput('');
      setSuggestions([]);
    }
  };

  // 재료 상세 정보 수정
  const updateLabel = (index: number, field: keyof UserLabel, value: string | number | boolean | null) => {
    const updated = [...userLabels];
    updated[index] = { ...updated[index], [field]: value };
    setUserLabels(updated);
  };

  // 라벨 제거
  const removeLabel = (index: number) => {
    setUserLabels(userLabels.filter((_, i) => i !== index));
  };

  // 이미지 해시 생성
  const generateImageHash = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        let hash = 0;
        for (let i = 0; i < result.length; i++) {
          const char = result.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        resolve(Math.abs(hash).toString(36));
      };
      reader.readAsDataURL(file);
    });
  };

  // 이미지 크기 가져오기
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // 저장 및 학습 데이터 제출
  const handleSubmit = async () => {
    if (!image || userLabels.length === 0) {
      setError('사진과 최소 1개 이상의 재료를 입력해주세요.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const supabase = createClient();

      // 1. 사용자 인증 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('로그인이 필요합니다.');
        setUploading(false);
        return;
      }

      // 2. 이미지 해시 및 크기 가져오기
      const imageHash = await generateImageHash(image);
      const dimensions = await getImageDimensions(image);

      // 3. Supabase Storage에 이미지 업로드
      const fileName = `${user.id}/${imageHash}-${Date.now()}.${image.type.split('/')[1]}`;
      const { error: uploadError } = await supabase.storage
        .from('ingredient-photos')
        .upload(fileName, image, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('이미지 업로드 실패:', uploadError);
        setError('이미지 업로드에 실패했습니다. Storage 버킷을 확인해주세요.');
        setUploading(false);
        return;
      }

      // 4. Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('ingredient-photos')
        .getPublicUrl(fileName);

      // 5. 학습 데이터 저장
      const { error: insertError } = await supabase
        .from('ingredient_training_data')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          image_hash: imageHash,
          image_width: dimensions.width,
          image_height: dimensions.height,
          user_labels: userLabels,
          consent_given: true,
          training_status: 'pending',
          photo_context: 'user_upload'
        });

      if (insertError) {
        console.error('학습 데이터 저장 실패:', insertError);
        setError('데이터 저장에 실패했습니다.');
        setUploading(false);
        return;
      }

      // 6. 사용자 재료 목록에 추가
      onAddIngredients(userLabels);

      // 7. UI 초기화
      handleReset();
    } catch (err) {
      console.error('제출 오류:', err);
      setError('처리 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 초기화
  const handleReset = () => {
    setImage(null);
    setPreview('');
    setUserLabels([]);
    setCurrentInput('');
    setSuggestions([]);
    setError('');
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-3xl bg-background-secondary p-6 space-y-4">
      {/* 1. 업로드 영역 */}
      {!image && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-accent-warm/30 rounded-2xl p-12 text-center cursor-pointer hover:border-accent-warm/60 hover:bg-white/5 transition-all"
        >
          <span className="text-6xl mb-4 block">📷</span>
          <p className="text-text-primary font-medium mb-2">
            재료 사진을 드래그하거나 클릭하세요
          </p>
          <p className="text-sm text-text-muted mb-2">
            JPG, PNG (최대 5MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* 2. 이미지 미리보기 + 라벨링 */}
      {image && preview && (
        <div className="space-y-4">
          {/* 이미지 */}
          <div className="relative rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="업로드된 이미지"
              className="w-full h-auto max-h-96 object-contain bg-background-tertiary"
            />
          </div>

          {/* 재료 입력 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              이 사진에 있는 재료를 입력하세요
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="재료 이름 (예: 양파, 토마토)"
                className="w-full px-4 py-3 rounded-xl bg-background-tertiary text-text-primary border border-white/10 focus:border-accent-warm focus:outline-none"
              />

              {/* 자동완성 드롭다운 */}
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-background-tertiary rounded-xl border border-white/10 shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectIngredient(item)}
                      className="w-full px-4 py-2 text-left hover:bg-white/5 transition-colors flex items-center gap-2"
                    >
                      <span className="text-text-primary">{item.name}</span>
                      <span className="text-sm text-text-muted">
                        {item.name_en || item.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-text-muted mt-2">
              재료를 입력하고 Enter를 누르거나 자동완성에서 선택하세요
            </p>
          </div>

          {/* 추가된 라벨 목록 - 상세 정보 입력 */}
          {userLabels.length > 0 && (
            <div>
              <p className="text-sm font-medium text-text-primary mb-3">
                추가된 재료 ({userLabels.length}개)
              </p>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {userLabels.map((label, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-background-tertiary p-4 border border-white/10 space-y-3"
                  >
                    {/* 재료명과 삭제 버튼 */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-text-primary">{label.name}</h4>
                      <button
                        onClick={() => removeLabel(idx)}
                        className="text-error hover:text-error/80 transition-colors"
                        aria-label="재료 삭제"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 양 및 단위 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">양</label>
                        <input
                          type="number"
                          step="0.01"
                          value={label.quantity === null ? '' : label.quantity}
                          onChange={(e) => updateLabel(idx, 'quantity', e.target.value === '' ? null : parseFloat(e.target.value))}
                          placeholder="선택사항"
                          className="w-full px-3 py-2 rounded-lg bg-background-secondary text-text-primary text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">단위</label>
                        <select
                          value={label.unit || '선택'}
                          onChange={(e) => updateLabel(idx, 'unit', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-background-secondary text-text-primary text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm"
                        >
                          <option value="선택">선택</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="L">L</option>
                          <option value="개">개</option>
                          <option value="큰술">큰술</option>
                          <option value="작은술">작은술</option>
                          <option value="컵">컵</option>
                          <option value="줌">줌</option>
                          <option value="꼬집">꼬집</option>
                          <option value="조각">조각</option>
                          <option value="장">장</option>
                          <option value="포기">포기</option>
                          <option value="대">대</option>
                          <option value="모">모</option>
                          <option value="마리">마리</option>
                        </select>
                      </div>
                    </div>

                    {/* 구매일 및 만료일 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">구매일</label>
                        <input
                          type="date"
                          value={label.purchase_date || ''}
                          onChange={(e) => updateLabel(idx, 'purchase_date', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-background-secondary text-text-primary text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">만료일</label>
                        <input
                          type="date"
                          value={label.expiry_date || ''}
                          onChange={(e) => updateLabel(idx, 'expiry_date', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-background-secondary text-text-primary text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm"
                        />
                      </div>
                    </div>

                    {/* 보관 위치 */}
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">보관 위치</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['냉장', '냉동', '상온', '기타'].map((location) => (
                          <button
                            key={location}
                            type="button"
                            onClick={() => updateLabel(idx, 'storage_location', location)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              label.storage_location === location
                                ? 'bg-accent-warm text-background-primary'
                                : 'bg-background-secondary text-text-secondary hover:bg-white/5'
                            }`}
                          >
                            {location}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 메모 */}
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">메모</label>
                      <input
                        type="text"
                        value={label.notes || ''}
                        onChange={(e) => updateLabel(idx, 'notes', e.target.value)}
                        placeholder="선택사항 (예: 사진에서 추가)"
                        className="w-full px-3 py-2 rounded-lg bg-background-secondary text-text-primary text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent-warm"
                      />
                    </div>

                    {/* 만료 알림 */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={label.expiry_alert !== false}
                        onChange={(e) => updateLabel(idx, 'expiry_alert', e.target.checked)}
                        className="h-4 w-4 rounded bg-background-secondary border-white/10 text-accent-warm focus:ring-2 focus:ring-2 focus:ring-accent-warm"
                      />
                      <span className="text-xs text-text-secondary">만료일이 가까워지면 알림 받기</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={uploading || userLabels.length === 0}
              className="flex-1 rounded-xl bg-accent-warm py-3 font-bold text-background-primary hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '저장 중...' : `재료 추가하기 (${userLabels.length}개)`}
            </button>
            <button
              onClick={handleReset}
              disabled={uploading}
              className="px-6 rounded-xl bg-white/5 text-text-secondary hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-xl bg-error/10 border border-error/30 p-4">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* 도움말 */}
      {!image && !error && (
        <div className="mt-4 p-4 rounded-xl bg-background-tertiary/50">
          <p className="text-sm text-text-muted mb-2">
            <strong>📸 촬영 팁:</strong>
          </p>
          <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
            <li>재료가 잘 보이도록 밝은 곳에서 촬영하세요</li>
            <li>재료가 화면 중앙에 오도록 배치하세요</li>
            <li>흐릿하지 않게 초점을 맞춰 촬영하세요</li>
          </ul>
        </div>
      )}
    </div>
  );
}
