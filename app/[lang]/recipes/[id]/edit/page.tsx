'use client';

import { useState, useRef, useEffect, useCallback, use } from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import {
  type RecipeIngredient as Ingredient, type RecipeStep as Step,
} from '@/lib/constants/recipe';
import type { IngredientItem } from '@/components/Ingredients/IngredientAutocompleteTypes';
// 2026-10-04 [PHR-D1] new/edit 공용 폼 블록은 recipes/_components 로 통합 — edit 고유 분기(재료 삭제 임계 <=1·
// "재료 5개 추가" 라벨·영양 검증 상한 없음·커스텀 요리종류/요리유형 없음·툴팁 없음)는 prop 으로 그대로 보존.
// StepsSection(단계 제목 input·팁 위치·드롭존 스타일이 new 와 진짜 다름)만 edit 전용 유지.
import TagsField from '../../_components/TagsField';
import BasicInfoSection from '../../_components/BasicInfoSection';
import NutritionFields from '../../_components/NutritionFields';
import IngredientsSection from '../../_components/IngredientsSection';
import ThumbnailUploadField from '../../_components/ThumbnailUploadField';
import DietaryOptionsField from '../../_components/DietaryOptionsField';
import StepsSection from './_components/StepsSection';
import { normalizeSubstitutes } from '@/lib/recipes/substituteChips';
import {
  updateIngredientAt, selectIngredientAt, updateStepAt, removeRowAt, getIngredientPlaceholder,
  type IngredientValue,
} from '@/lib/recipes/formRows';
import ImageCropModal from '@/components/Common/ImageCropModal';
import { useFileUpload, runImageUpload } from '@/lib/hooks/useFileUpload';
import { useImageDropZone } from '@/lib/hooks/useImageDropZone';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditRecipePage(props: PageProps) {
  const resolvedParams = use(props.params);
  const { id } = resolvedParams;
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();
  const { t } = useI18n();
  const tf = t.recipeForm;
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // 기본 정보
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState<number | ''>('');
  const [cookTime, setCookTime] = useState<number | ''>('');
  const [difficulty, setDifficulty] = useState('');
  // 2026-10-04 [PHR-04] 미선택 기본값 '' — 옛 'korean' 기본·폴백이 요리 종류 미선택(null/'') 레시피를 한식 칩 선택 상태로
  // 보여주고 저장 시 'korean' 으로 덮어썼음. 미선택이면 PUT 에서 cuisine_type 키를 빼 DB 원래 값(null·'')을 그대로 둔다.
  const [cuisineType, setCuisineType] = useState('');

  // 식단 옵션
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);

  // 영양 정보 (선택사항)
  const [showNutrition, setShowNutrition] = useState(false);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');

  // 재료
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    Array(5).fill(null).map(() => ({ ingredient_name: '', quantity: '', unit: '선택', notes: '', is_optional: false, substitutes: [] }))
  );

  const unitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 완성된 요리 이미지 (썸네일)
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  // 자르기 모달 — 파일 선택/드롭 후 16:9 영역 잡을 때까지 보류.
  // recipes/new 와 동일 패턴 ([[project-thumbnail-crop-next-session]] 옵션 3).
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);
  // 썸네일 업로드 공용 hook — recipes/new 와 일관 패턴.
  const thumbUpload = useFileUpload(supabase, router, toast, {
    bucket: 'recipe-images',
    prefix: 'thumbnail',
    onSuccess: setThumbnailImage,
    errors: {
      imageType: tf.errorImageType, imageSize: tf.errorImageSize,
      upload: tf.errorImageUpload, loginRequired: tf.errorLoginRequired,
    },
  });

  // 재료 준비 이미지
  const [ingredientsImage, setIngredientsImage] = useState<string | null>(null);
  // 재료 준비 이미지 업로드 공용 hook — 썸네일과 동일 패턴.
  const ingredientsUpload = useFileUpload(supabase, router, toast, {
    bucket: 'recipe-images',
    prefix: 'ingredients',
    onSuccess: setIngredientsImage,
    errors: {
      imageType: tf.errorImageType, imageSize: tf.errorImageSize,
      upload: tf.errorImageUpload, loginRequired: tf.errorLoginRequired,
    },
  });

  // 조리 단계
  const [steps, setSteps] = useState<Step[]>([
    { title: '', instruction: '', timer_minutes: null, tip: '', image_url: null }
  ]);

  // 이미지 업로드 상태
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [draggingStepIndex, setDraggingStepIndex] = useState<number | null>(null);

  // 태그
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);


  // 레시피 데이터 불러오기
  useEffect(() => {
    let isMounted = true;

    const fetchRecipe = async () => {
      setDataLoading(true);
      try {
        // 사용자 인증 확인
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error(tf.errorLoginRequired);
          router.push('/signin');
          return;
        }

        // 데이터 계층 이전(docs/DATA_LAYER.md): 폼 로드 read 4개(recipes·ingredients·steps·tags)를
        // 기존 GET /api/recipes/[id] 재사용(recipe 전 필드 + ingredients/steps 정렬 + tags string[]).
        const res = await fetch(`/api/recipes/${id}`);
        if (!res.ok) {
          if (isMounted) {
            toast.error(tf.errorRecipeNotFound);
            router.push('/');
          }
          return;
        }
        const { recipe: recipeData } = await res.json();

        // 권한 확인
        if (recipeData.author_id !== user.id) {
          if (isMounted) {
            toast.error(tf.errorNoEditPermission);
            router.push('/');
          }
          return;
        }

        // 응답에 동봉된 자식 컬렉션 (엔드포인트가 display_order·step_number 로 정렬, tags 는 string[]).
        const ingredientsData = recipeData.ingredients;
        const stepsData = recipeData.steps;
        const tagsData: string[] = recipeData.tags;

        if (!isMounted) return;

        // 데이터로 state 초기화
        setTitle(recipeData.title || '');
        setDescription(recipeData.description || '');
        setServings(recipeData.servings ?? '');
        setCookTime(recipeData.cook_time_minutes ?? '');
        setDifficulty(recipeData.difficulty_level || '');
        setCuisineType(recipeData.cuisine_type || '');
        setIsVegetarian(recipeData.is_vegetarian || false);
        setIsVegan(recipeData.is_vegan || false);
        setIsGlutenFree(recipeData.is_gluten_free || false);
        setThumbnailImage(recipeData.thumbnail_url || null);
        setIngredientsImage(recipeData.ingredients_image_url || null);

        // 영양 정보 설정
        if (recipeData.calories || recipeData.protein_grams || recipeData.carbs_grams ||
            recipeData.fat_grams || recipeData.fiber_grams || recipeData.sodium_mg) {
          setShowNutrition(true);
        }
        setCalories(recipeData.calories?.toString() || '');
        setProtein(recipeData.protein_grams?.toString() || '');
        setCarbs(recipeData.carbs_grams?.toString() || '');
        setFat(recipeData.fat_grams?.toString() || '');
        setFiber(recipeData.fiber_grams?.toString() || '');
        setSodium(recipeData.sodium_mg?.toString() || '');

        // 재료 설정
        if (ingredientsData && ingredientsData.length > 0) {
          const loadedIngredients = ingredientsData.map((ing: { ingredient_name?: string; ingredient_id?: string | null; quantity?: number; unit?: string; notes?: string; is_optional?: boolean; substitutes?: unknown }) => ({
            ingredient_name: ing.ingredient_name || '',
            ingredient_id: ing.ingredient_id ?? undefined,
            quantity: ing.quantity?.toString() || '',
            unit: ing.unit || '선택',
            notes: ing.notes || '',
            is_optional: ing.is_optional || false,
            substitutes: normalizeSubstitutes(ing.substitutes),
          }));
          setIngredients(loadedIngredients);
        }

        // 조리 단계 설정
        if (stepsData && stepsData.length > 0) {
          const loadedSteps = stepsData.map((step: { title?: string; instruction?: string; timer_minutes?: number | null; tip?: string; image_url?: string | null }) => ({
            title: step.title || '',
            instruction: step.instruction || '',
            timer_minutes: step.timer_minutes || null,
            tip: step.tip || '',
            image_url: step.image_url || null
          }));
          setSteps(loadedSteps);
        }

        // 태그 설정 (엔드포인트가 이미 string[] 로 반환)
        if (tagsData && tagsData.length > 0) {
          setTags(tagsData);
        }
      } catch (error) {
        console.error('Error fetching recipe:', error);
        if (isMounted) {
          toast.error(tf.errorLoadRecipe);
          router.push('/');
        }
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    };

    fetchRecipe();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router, supabase]);

  // 2026-10-04 [PHR-01] 재료·단계 핸들러는 전부 함수형 업데이트(prev => …) — 비동기 단계 이미지 업로드 완료 콜백이
  // 업로드 시작 시점 배열로 덮어써 그 사이 수정한 단계 내용이 되돌아가던 stale closure 차단. 본문은 lib/recipes/formRows(new 와 공용).
  // [PHR-03] 자동완성으로 고른(또는 로드된) 재료의 이름을 손으로 바꾸면 옛 ingredient_id 해제(updateIngredientAt).
  const addIngredients = () => {
    const newIngredients = Array(5).fill(null).map(() => ({
      ingredient_name: '', quantity: '', unit: '선택', notes: '', is_optional: false, substitutes: []
    }));
    setIngredients(prev => [...prev, ...newIngredients]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => removeRowAt(prev, index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: IngredientValue) => {
    setIngredients(prev => updateIngredientAt(prev, index, field, value));
  };

  // 자동완성에서 재료 선택 — ingredient_id FK 설정 + common_units 자동 단위 추천 (new page와 동일)
  const selectIngredient = (index: number, item: IngredientItem) => {
    setIngredients(prev => selectIngredientAt(prev, index, item));
  };

  const addStep = () => {
    setSteps(prev => [...prev, { title: '', instruction: '', timer_minutes: null, tip: '', image_url: null }]);
  };

  const removeStep = (index: number) => {
    setSteps(prev => removeRowAt(prev, index));
  };

  const updateStep = (index: number, field: keyof Step, value: string | number | null) => {
    setSteps(prev => updateStepAt(prev, index, field, value));
  };

  // 이미지 업로드 함수
  // 단계 이미지 업로드 — recipes/new 와 동일 패턴 (per-index 상태 → runImageUpload).
  const handleImageUpload = async (index: number, file: File) => {
    await runImageUpload(supabase, router, toast, file, {
      bucket: 'recipe-images',
      prefix: 'step',
      onStart: () => setUploadingImage(index),
      onFinally: () => setUploadingImage(null),
      onSuccess: (url) => updateStep(index, 'image_url', url),
      errors: {
        imageType: tf.errorImageType, imageSize: tf.errorImageSize,
        upload: tf.errorImageUpload, loginRequired: tf.errorLoginRequired,
      },
    });
  };

  // 이미지 제거 함수
  const handleImageRemove = (index: number) => {
    updateStep(index, 'image_url', null);
  };

  // 재료 준비 이미지 업로드 함수
  // 재료 준비 이미지 업로드 — useFileUpload 가 boilerplate 일임.
  const handleIngredientsImageUpload = useCallback((file: File) => {
    ingredientsUpload.upload(file);
  }, [ingredientsUpload]);

  // 재료 준비 이미지 제거 함수
  const handleIngredientsImageRemove = () => {
    setIngredientsImage(null);
  };

  // 썸네일 — 파일 선택/드롭 → 검증 → 자르기 모달 띄움 → cropped File 업로드.
  // recipes/new 와 일관 ([[project-thumbnail-crop-next-session]] 옵션 3 — 16:9 고정).
  const handleThumbnailPick = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(tf.errorImageType);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(tf.errorImageSize);
      return;
    }
    setPendingThumbnailFile(file);
  }, [toast, tf.errorImageType, tf.errorImageSize]);

  // 자르기 모달 onCropComplete — modal 닫기 + 공용 hook 으로 업로드.
  // boilerplate(검증·인증·경로·업로드·에러·uploading state) 는 useFileUpload 내부.
  const handleCroppedThumbnailUpload = (cropped: File) => {
    setPendingThumbnailFile(null);
    thumbUpload.upload(cropped);
  };

  // 썸네일 이미지 제거 함수
  const handleThumbnailRemove = () => {
    setThumbnailImage(null);
  };

  // 드래그 앤 드롭 — 8 핸들러를 useImageDropZone 2 줄로 압축. recipes/new 와 일관.
  const thumbnailDropZone = useImageDropZone(handleThumbnailPick);
  const ingredientsDropZone = useImageDropZone(handleIngredientsImageUpload);

  // 드래그 앤 드롭 핸들러 - 조리 단계 이미지
  const handleStepDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleStepDragIn = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingStepIndex(index);
  };

  const handleStepDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingStepIndex(null);
  };

  const handleStepDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingStepIndex(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageUpload(index, files[0]);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // 1·3·5번째 행 예시 문구 — 5번째 행 예시("예: 소금")는 edit 만([PHR-D1 (b)-5])
  const getPlaceholder = (index: number, field: 'name' | 'quantity' | 'notes') =>
    getIngredientPlaceholder(tf, index, field, { fifthRowExample: true });

  const handleSubmit = async () => {
    // 유효성 검사
    if (!title.trim()) {
      toast.warning(tf.warnTitle);
      return;
    }
    if (title.length > 200) {
      toast.warning(t.common.errorTitleTooLong);
      return;
    }
    if (description.length > 500) {
      toast.warning(t.common.errorDescriptionTooLong);
      return;
    }

    const validIngredients = ingredients.filter(i => i.ingredient_name.trim());
    if (validIngredients.length === 0) {
      toast.warning(tf.warnIngredients);
      return;
    }

    const validSteps = steps.filter(s => s.instruction.trim());
    if (validSteps.length === 0) {
      toast.warning(tf.warnSteps);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(tf.errorLoginRequired);
        router.push('/signin');
        return;
      }

      const response = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          thumbnail_url: thumbnailImage,
          ingredients_image_url: ingredientsImage,
          servings: servings !== '' ? servings : null,
          cook_time_minutes: cookTime !== '' ? cookTime : null,
          difficulty_level: difficulty || null,
          ...(cuisineType ? { cuisine_type: cuisineType } : {}),
          meal_type: 'lunch',
          is_vegetarian: isVegetarian,
          is_vegan: isVegan,
          is_gluten_free: isGlutenFree,
          // 영양 정보 (선택사항)
          calories: calories ? parseInt(calories) : null,
          protein_grams: protein ? parseFloat(protein) : null,
          carbs_grams: carbs ? parseFloat(carbs) : null,
          fat_grams: fat ? parseFloat(fat) : null,
          fiber_grams: fiber ? parseFloat(fiber) : null,
          sodium_mg: sodium ? parseInt(sodium) : null,
          ingredients: validIngredients.map(i => ({
            ingredient_name: i.ingredient_name.trim(),
            ingredient_id: i.ingredient_id ?? null,
            quantity: parseFloat(i.quantity) || null,
            unit: (i.unit && i.unit !== '선택') ? i.unit : null,
            notes: i.notes.trim() || null,
            is_optional: i.is_optional,
            substitutes: i.substitutes ?? [],
          })),
          steps: validSteps.map(s => ({
            title: s.title?.trim() || null,
            instruction: s.instruction.trim(),
            timer_minutes: s.timer_minutes,
            tip: s.tip.trim() || null,
            image_url: s.image_url
          })),
          tags
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || tf.errorUpdate);
      }

      toast.success(tf.successUpdate);
      router.push(`/recipes/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tf.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="animate-bounce text-2xl text-accent-warm">{tf.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-primary/80 backdrop-blur-lg border-b border-white/5">
        <div className="container mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-text-muted hover:text-text-primary">
            ← {t.common.cancel}
          </button>
          <h1 className="text-lg font-bold">{tf.editTitle}</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-6 py-6 space-y-10">
        {/* Section 1: 기본 정보 — 공용 BasicInfoSection(<section>+번호 h2 래퍼 포함). edit 는 커스텀 요리종류·
            요리 유형 블록 없음(customCuisine/dish prop 생략) */}
        <BasicInfoSection
          t={t}
          tf={tf}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          servings={servings}
          setServings={setServings}
          cookTime={cookTime}
          setCookTime={setCookTime}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          cuisineType={cuisineType}
          setCuisineType={setCuisineType}
        />

        {/* Section 2: 재료 준비 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center text-sm font-bold">2</span>
            {tf.section2Ingredients}
          </h2>

          {/* 통합된 재료 준비 영역 — 공용 IngredientsSection (edit: 삭제 임계 <=1 · "재료 5개 추가" 라벨) */}
          <IngredientsSection
            t={t}
            tf={tf}
            ingredients={ingredients}
            ingredientsImage={ingredientsImage}
            uploadingIngredientsImage={ingredientsUpload.uploading}
            isDraggingIngredients={ingredientsDropZone.isDragging}
            unitInputRefs={unitInputRefs}
            getPlaceholder={getPlaceholder}
            removeDisabledAtOrBelow={1}
            addLabel={tf.addFiveIngredients}
            onAddIngredients={addIngredients}
            onRemoveIngredient={removeIngredient}
            onUpdateIngredient={updateIngredient}
            onSelectIngredient={selectIngredient}
            onImageUpload={handleIngredientsImageUpload}
            onImageRemove={handleIngredientsImageRemove}
            onDrag={ingredientsDropZone.dropZoneProps.onDragOver}
            onDragIn={ingredientsDropZone.dropZoneProps.onDragEnter}
            onDragOut={ingredientsDropZone.dropZoneProps.onDragLeave}
            onDrop={ingredientsDropZone.dropZoneProps.onDrop}
          />
        </section>

        {/* Section 3: 조리 순서 */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center text-sm font-bold">3</span>
            {tf.section3Steps}
          </h2>
          <p className="text-sm text-text-muted">{tf.stepsHint}</p>

          {/* 조리 단계 + 추가 버튼 — _components/StepsSection.tsx 로 추출
              (edit 전용: 단계 제목 input·레이아웃 순서 보존, JSX byte-identical) */}
          <StepsSection
            t={t}
            tf={tf}
            steps={steps}
            uploadingImage={uploadingImage}
            draggingStepIndex={draggingStepIndex}
            onAddStep={addStep}
            onRemoveStep={removeStep}
            onUpdateStep={updateStep}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            onStepDrag={handleStepDrag}
            onStepDragIn={handleStepDragIn}
            onStepDragOut={handleStepDragOut}
            onStepDrop={handleStepDrop}
          />

          {/* 완성된 요리 이미지 — 공용 ThumbnailUploadField (옛 인라인 블록과 마크업 동일, [PHR-D1 (a)-1]) */}
          <ThumbnailUploadField
            tf={tf}
            thumbnailImage={thumbnailImage}
            uploadingThumbnail={thumbUpload.uploading}
            isDraggingThumbnail={thumbnailDropZone.isDragging}
            onUpload={handleThumbnailPick}
            onRemove={handleThumbnailRemove}
            onDrag={thumbnailDropZone.dropZoneProps.onDragOver}
            onDragIn={thumbnailDropZone.dropZoneProps.onDragEnter}
            onDragOut={thumbnailDropZone.dropZoneProps.onDragLeave}
            onDrop={thumbnailDropZone.dropZoneProps.onDrop}
          />
        </section>

        {/* Section 4: 추가 정보 */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center text-sm font-bold">4</span>
            {t.nutrition.section4Additional}
          </h2>

          {/* 식단 옵션 — 공용 DietaryOptionsField (edit 는 툴팁 없음 = 옛 인라인 마크업, [PHR-D1 (b)-4]) */}
          <DietaryOptionsField
            tf={tf}
            isVegetarian={isVegetarian} setIsVegetarian={setIsVegetarian}
            isVegan={isVegan} setIsVegan={setIsVegan}
            isGlutenFree={isGlutenFree} setIsGlutenFree={setIsGlutenFree}
          />

          {/* 영양 정보 — 공용 NutritionFields. edit 는 limits 생략 = 검증 상한 없음(옛 edit 동작 보존) */}
          <NutritionFields
            t={t}
            tf={tf}
            show={showNutrition}
            onToggleShow={() => setShowNutrition(!showNutrition)}
            calories={calories}
            setCalories={setCalories}
            protein={protein}
            setProtein={setProtein}
            carbs={carbs}
            setCarbs={setCarbs}
            fat={fat}
            setFat={setFat}
            fiber={fiber}
            setFiber={setFiber}
            sodium={sodium}
            setSodium={setSodium}
          />

          {/* 태그 — 공용 TagsField (recipes/_components) */}
          <TagsField
            label={tf.tagsLabel}
            placeholder={tf.tagInputPlaceholder}
            addButtonLabel={t.quickAdd.addButton}
            tagInput={tagInput}
            onTagInputChange={setTagInput}
            tags={tags}
            onAdd={addTag}
            onRemove={removeTag}
          />
        </section>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-accent-warm text-background-primary text-lg font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
          >
            {loading ? tf.submittingEdit : tf.submitEdit}
          </button>
        </div>
      </div>
      <ImageCropModal
        file={pendingThumbnailFile}
        onCropComplete={handleCroppedThumbnailUpload}
        onCancel={() => setPendingThumbnailFile(null)}
      />
    </div>
  );
}
