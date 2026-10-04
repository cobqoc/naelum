'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import Link from '@/components/Common/LocalizedLink';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import { useAutosave, loadAutosave, clearAutosave } from '@/lib/hooks/useAutosave';
// 2026-10-04 [PHR-D1] new/edit 공용 폼 블록은 recipes/_components 로 통합(차이는 prop 으로 보존).
// StepsSection(단계 제목·팁 위치·드롭존 스타일이 진짜 다름)·RecipeFormFooter(new 전용)만 이 라우트 전용.
import TagsField from '../_components/TagsField';
import NutritionFields from '../_components/NutritionFields';
import StepsSection from './_components/StepsSection';
import IngredientsSection from '../_components/IngredientsSection';
import BasicInfoSection from '../_components/BasicInfoSection';
import RecipeFormFooter from './_components/RecipeFormFooter';
import ThumbnailUploadField from '../_components/ThumbnailUploadField';
import DietaryOptionsField from '../_components/DietaryOptionsField';
import ImageCropModal from '@/components/Common/ImageCropModal';
import { useFileUpload, runImageUpload } from '@/lib/hooks/useFileUpload';
import { useImageDropZone } from '@/lib/hooks/useImageDropZone';
import { computeAutoTags, mergeAutoTags } from '@/lib/recipes/autoTags';
import { buildRecipePayload } from '@/lib/recipes/buildRecipePayload';
import { normalizeSubstitutes } from '@/lib/recipes/substituteChips';
import {
  updateIngredientAt, selectIngredientAt, updateStepAt, removeRowAt, getIngredientPlaceholder,
  type IngredientValue,
} from '@/lib/recipes/formRows';
import { NEW_RECIPE_NUTRITION_LIMITS } from '@/lib/recipes/nutritionInput';
import {
  type RecipeIngredient as Ingredient, type RecipeStep as Step,
} from '@/lib/constants/recipe';
import type { IngredientItem } from '@/components/Ingredients/IngredientAutocompleteTypes';

// 자동저장 상수 — 모듈 레벨 (매 렌더마다 새 reference 회피 → useEffect deps 안정)
const AUTOSAVE_KEY = 'naelum_recipe_new_autosave_v1';
const AUTOSAVE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export default function NewRecipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const remixId = searchParams.get('remix');
  const supabase = createClient();
  const toast = useToast();
  const { t } = useI18n();
  const tf = t.recipeForm;
  // remix prefill effect 가 deps=[remixId] 라 t 를 dep 에 넣으면 언어변경 시 폼이 리셋됨 → ref 로 최신값만 읽음
  const remixPrefixRef = useRef(tf.remixTitlePrefix);
  remixPrefixRef.current = tf.remixTitlePrefix;
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [remixSource, setRemixSource] = useState<{ id: string; title: string; author: string } | null>(null);

  // 기본 정보
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState<number | ''>('');
  const [cookTime, setCookTime] = useState<number | ''>('');
  const [difficulty, setDifficulty] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [customCuisineType, setCustomCuisineType] = useState('');
  const [dishType, setDishType] = useState('');
  const [customDishType, setCustomDishType] = useState('');

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

  // 재료 (기본 2개 — 빈 5행 압도감 줄임. + 버튼으로 1개씩 추가)
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    Array(2).fill(null).map(() => ({ ingredient_name: '', quantity: '', unit: '선택', notes: '', is_optional: false, substitutes: [] }))
  );

  // 완성된 요리 이미지 (썸네일)
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  // 자르기 모달 — 파일 선택/드롭 후 16:9 영역 잡을 때까지 보류.
  // [[project-thumbnail-crop-next-session]] — 카드·미리보기 일관성 위해 모든 파일이 crop 거침.
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);
  // 썸네일 업로드 공용 hook — boilerplate ~50줄 → ~7줄 ([[feedback-check-line-count-before-adding]])
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

  // 재료 unit input refs
  const unitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 조리 단계
  const [steps, setSteps] = useState<Step[]>([
    { instruction: '', timer_minutes: null, tip: '', image_url: null }
  ]);

  // 이미지 업로드 상태
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [draggingStepIndex, setDraggingStepIndex] = useState<number | null>(null);

  // 태그
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // 툴팁 표시 상태
  const [hoveredDietaryOption, setHoveredDietaryOption] = useState<string | null>(null);

  // 자동저장 — localStorage 백업 (게시·임시저장 시 clear). 상수는 모듈 레벨.
  const [autosaveRestoreVisible, setAutosaveRestoreVisible] = useState(false);
  type AutosaveSnapshot = {
    title: string; description: string;
    servings: number | ''; cookTime: number | '';
    difficulty: string; cuisineType: string; customCuisineType: string;
    dishType: string; customDishType: string;
    isVegetarian: boolean; isVegan: boolean; isGlutenFree: boolean;
    showNutrition: boolean;
    calories: string; protein: string; carbs: string; fat: string; fiber: string; sodium: string;
    ingredients: Ingredient[]; steps: Step[]; tags: string[];
    thumbnailImage: string | null; ingredientsImage: string | null;
  };
  const autosaveSnapshotRef = useRef<AutosaveSnapshot | null>(null);

  const autosaveData = useMemo<AutosaveSnapshot>(() => ({
    title, description, servings, cookTime, difficulty,
    cuisineType, customCuisineType, dishType, customDishType,
    isVegetarian, isVegan, isGlutenFree,
    showNutrition, calories, protein, carbs, fat, fiber, sodium,
    ingredients, steps, tags,
    thumbnailImage, ingredientsImage,
  }), [
    title, description, servings, cookTime, difficulty,
    cuisineType, customCuisineType, dishType, customDishType,
    isVegetarian, isVegan, isGlutenFree,
    showNutrition, calories, protein, carbs, fat, fiber, sodium,
    ingredients, steps, tags,
    thumbnailImage, ingredientsImage,
  ]);

  // remix 모드에선 자동저장 비활성 (원본 데이터 덮어쓸 위험).
  // title 빈 폼은 자동저장 skip — banner 표시 조건(`title?.trim()`)과 일관 + "버리기" 후
  // useAutosave 가 빈 폼을 다시 저장하던 race 차단 (localStorage 깔끔).
  useAutosave(AUTOSAVE_KEY, autosaveData, {
    enabled: !remixId && !autosaveRestoreVisible && title.trim().length > 0,
  });

  // mount 시 이전 스냅샷 발견하면 banner 표시
  useEffect(() => {
    if (remixId) return;
    const saved = loadAutosave<AutosaveSnapshot>(AUTOSAVE_KEY, AUTOSAVE_MAX_AGE);
    if (saved && saved.data.title?.trim()) {
      autosaveSnapshotRef.current = saved.data;
      setAutosaveRestoreVisible(true);
    }
  }, [remixId]);

  const handleRestoreAutosave = () => {
    const s = autosaveSnapshotRef.current;
    if (!s) return;
    setTitle(s.title || '');
    setDescription(s.description || '');
    setServings(s.servings ?? '');
    setCookTime(s.cookTime ?? '');
    setDifficulty(s.difficulty || '');
    setCuisineType(s.cuisineType || '');
    setCustomCuisineType(s.customCuisineType || '');
    setDishType(s.dishType || '');
    setCustomDishType(s.customDishType || '');
    setIsVegetarian(!!s.isVegetarian);
    setIsVegan(!!s.isVegan);
    setIsGlutenFree(!!s.isGlutenFree);
    setShowNutrition(!!s.showNutrition);
    setCalories(s.calories || '');
    setProtein(s.protein || '');
    setCarbs(s.carbs || '');
    setFat(s.fat || '');
    setFiber(s.fiber || '');
    setSodium(s.sodium || '');
    if (Array.isArray(s.ingredients) && s.ingredients.length > 0) setIngredients(s.ingredients);
    if (Array.isArray(s.steps) && s.steps.length > 0) setSteps(s.steps);
    if (Array.isArray(s.tags)) setTags(s.tags);
    if (s.thumbnailImage) setThumbnailImage(s.thumbnailImage);
    if (s.ingredientsImage) setIngredientsImage(s.ingredientsImage);
    setAutosaveRestoreVisible(false);
  };

  const handleDiscardAutosave = () => {
    clearAutosave(AUTOSAVE_KEY);
    autosaveSnapshotRef.current = null;
    setAutosaveRestoreVisible(false);
  };

  // 리믹스: 원본 레시피 데이터 로드
  useEffect(() => {
    if (!remixId) return;

    // 데이터 계층 이전(docs/DATA_LAYER.md): 직접 read 3개(recipes·ingredients·steps)를
    // 기존 GET /api/recipes/[id] 재사용으로 교체. 부수로 선존 버그 수정 — 옛 remix 는
    // ingredients 를 존재하지 않는 `order_index` 로 정렬해 쿼리가 조용히 에러→재료 미prefill.
    // 엔드포인트는 display_order 로 정렬하므로 재료가 정상 prefill 된다.
    const loadRemixData = async () => {
      const res = await fetch(`/api/recipes/${remixId}`);
      if (!res.ok) return;
      const { recipe } = await res.json();
      if (!recipe) return;

      const recipeIngredients = recipe.ingredients as {
        ingredient_name: string; quantity: number | null; unit: string | null;
        notes: string | null; is_optional: boolean | null; substitutes: unknown;
      }[] | null;
      const recipeSteps = recipe.steps as {
        instruction: string; timer_minutes: number | null; tip: string | null;
      }[] | null;

      // 폼에 데이터 채우기
      setTitle(remixPrefixRef.current.replace('{title}', recipe.title));
      setDescription(recipe.description || '');
      setServings(recipe.servings || '');
      setCookTime(recipe.cook_time_minutes || '');
      setDifficulty(recipe.difficulty_level || '');
      setCuisineType(recipe.cuisine_type || '');
      setDishType(recipe.dish_type || '');

      if (recipeIngredients && recipeIngredients.length > 0) {
        setIngredients(recipeIngredients.map(i => ({
          ingredient_name: i.ingredient_name,
          quantity: i.quantity?.toString() || '',
          unit: i.unit || '선택',
          notes: i.notes || '',
          is_optional: i.is_optional || false,
          // legacy string[] / 신규 {name,note?}[] — read boundary 에서 정규화 후 state 진입.
          substitutes: normalizeSubstitutes(i.substitutes),
        })));
      }

      if (recipeSteps && recipeSteps.length > 0) {
        setSteps(recipeSteps.map(s => ({
          instruction: s.instruction,
          timer_minutes: s.timer_minutes,
          tip: s.tip || '',
          image_url: null,
        })));
      }

      const authorData = recipe.author as { username: string } | null;
      setRemixSource({
        id: recipe.id,
        title: recipe.title,
        author: authorData?.username || '',
      });
    };

    loadRemixData();
  }, [remixId]);

  // 자동 태그 생성
  // 2026-10-04 [PHR-43] 직전 실행의 자동태그를 기억해 더 이상 해당하지 않는 자동태그는 제거(옛 코드는 추가만 해서
  // IME 조합 중간값 `#ㅍ #퓨 …`·한식→일식 전 태그·채식 해제 후 태그가 남아 저장됐음). 사용자 태그 보존·10개 상한은 mergeAutoTags.
  const prevAutoTagsRef = useRef<string[]>([]);
  useEffect(() => {
    const autoTags = computeAutoTags({
      cuisineType, customCuisineType, dishType, customDishType,
      isVegetarian, isVegan, isGlutenFree,
    });
    const prevAutoTags = prevAutoTagsRef.current;
    prevAutoTagsRef.current = autoTags;

    // 함수형 업데이트로 최신 상태 사용
    setTags(prevTags => mergeAutoTags(prevTags, prevAutoTags, autoTags));
  }, [cuisineType, dishType, customCuisineType, customDishType, isVegetarian, isVegan, isGlutenFree]);

  // 2026-10-04 [PHR-01] 재료·단계 핸들러는 전부 함수형 업데이트(prev => …) — 비동기 단계 이미지 업로드 완료 콜백이
  // 업로드 시작 시점 배열로 덮어써 그 사이 입력이 되돌아가던 stale closure 차단. 본문은 lib/recipes/formRows 한 벌(edit 와 공용).
  // [PHR-03] 자동완성으로 고른 뒤 재료명을 손으로 바꾸면 옛 ingredient_id 해제(updateIngredientAt).
  const addIngredients = () => {
    setIngredients(prev => [
      ...prev,
      { ingredient_name: '', quantity: '', unit: '선택', notes: '', is_optional: false, substitutes: [] },
    ]);
  };

  const removeIngredient = (index: number) => {
    // 최소 1행 유지 (5→1로 완화: 빈 행 초기 2개 + 1개씩 추가 UX와 일관)
    setIngredients(prev => removeRowAt(prev, index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: IngredientValue) => {
    setIngredients(prev => updateIngredientAt(prev, index, field, value));
  };

  const selectIngredient = (index: number, item: IngredientItem) => {
    setIngredients(prev => selectIngredientAt(prev, index, item));
  };

  const addStep = () => {
    setSteps(prev => [...prev, { instruction: '', timer_minutes: null, tip: '', image_url: null }]);
  };

  const removeStep = (index: number) => {
    setSteps(prev => removeRowAt(prev, index));
  };

  const updateStep = (index: number, field: keyof Step, value: string | number | null) => {
    setSteps(prev => updateStepAt(prev, index, field, value));
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

  // (영양 정보 검증 validateNutritionInput → lib/recipes/nutritionInput.ts (edit 와 공용, new 는 상한 limits 전달).)

  // 단계 이미지 업로드 — per-index 상태라 useFileUpload(bool) 안 맞음 → runImageUpload
  // (lifecycle hooks 으로 setUploadingImage(index) 매핑). boilerplate 동일.
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

  // 재료 준비 이미지 업로드 — useFileUpload 가 boilerplate(검증·인증·경로·업로드·에러) 일임.
  // 동작 보존: 호출 시그니처 `(file: File) => void` 그대로.
  const handleIngredientsImageUpload = useCallback((file: File) => {
    ingredientsUpload.upload(file);
  }, [ingredientsUpload]);

  // 재료 준비 이미지 제거 함수
  const handleIngredientsImageRemove = () => {
    setIngredientsImage(null);
  };

  // 썸네일(완성 요리) — 파일 선택/드롭 → 검증 → 자르기 모달 띄움 → cropped File 업로드.
  // 모든 진입(input change·drag drop) 이 picker 거치고, 자르기는 16:9 고정
  // ([[project-thumbnail-crop-next-session]] 옵션 3 — 카드·OG 일관성).
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

  // 자르기 모달 onCropComplete — modal 닫기 + 공용 hook 으로 업로드 위임.
  // boilerplate(검증·인증·경로·업로드·에러·uploading state) 는 useFileUpload 내부.
  const handleCroppedThumbnailUpload = (cropped: File) => {
    setPendingThumbnailFile(null);
    thumbUpload.upload(cropped);
  };

  // 썸네일 이미지 제거 함수
  const handleThumbnailRemove = () => {
    setThumbnailImage(null);
  };

  // 드래그 앤 드롭 — 8 핸들러(thumb × 4 + ingredients × 4)를 hook 2 줄로 압축.
  // 썸네일은 drop → handleThumbnailPick (검증 후 crop 모달), 재료는 직접 업로드.
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

  // Get placeholder text based on index — 1·3번째 행 예시, 5번째 행은 일반 문구(edit 와 다른 점, [PHR-D1 (b)-5])
  const getPlaceholder = (index: number, field: 'name' | 'quantity' | 'notes') =>
    getIngredientPlaceholder(tf, index, field, { fifthRowExample: false });

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

    if (cuisineType === 'other' && !customCuisineType.trim()) {
      toast.warning(tf.warnCustomCuisine);
      return;
    }

    if (dishType === 'other' && !customDishType.trim()) {
      toast.warning(tf.warnCustomDish);
      return;
    }

    // 재료 검증
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

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRecipePayload({
          title, description, thumbnailImage, ingredientsImage,
          servings, cookTime, difficulty,
          cuisineType, customCuisineType, dishType, customDishType,
          isVegetarian, isVegan, isGlutenFree,
          calories, protein, carbs, fat, fiber, sodium,
          ingredients, steps, tags,
          remixSourceId: remixSource?.id ?? null,
        })),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || tf.errorCreate);
      }

      clearAutosave(AUTOSAVE_KEY);
      toast.success(tf.successCreate);
      router.push(`/recipes/${data.recipe.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tf.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleDraft = async () => {
    if (!title.trim()) {
      toast.warning(tf.warnDraftTitle);
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
    setDraftLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error(tf.errorLoginRequired); router.push('/signin'); return; }

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRecipePayload({
          title, description, thumbnailImage, ingredientsImage,
          servings, cookTime, difficulty,
          cuisineType, customCuisineType, dishType, customDishType,
          isVegetarian, isVegan, isGlutenFree,
          calories, protein, carbs, fat, fiber, sodium,
          ingredients, steps, tags,
          remixSourceId: remixSource?.id ?? null,
        }, { status: 'draft' })),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tf.errorDraft);

      // 데이터 계층 이전(docs/DATA_LAYER.md): username 직접 read 제거 → POST 응답 동봉값 사용.
      clearAutosave(AUTOSAVE_KEY);
      toast.success(tf.successDraft);
      router.push(data.username ? `/@${data.username}?tab=drafts` : '/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tf.errorGeneric);
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-secondary/90 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-text-muted hover:text-text-primary">
            ← {t.common.cancel}
          </Link>
          <h1 className="text-lg font-bold">{remixSource ? tf.titleRemix : tf.titleNew}</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-6 py-6 space-y-10">
        {/* 자동저장 복원 배너 */}
        {autosaveRestoreVisible && (
          <div className="rounded-xl bg-accent-warm/10 border border-accent-warm/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-2xl">💾</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{tf.autosaveRestoreBanner}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRestoreAutosave}
                className="px-4 py-2 rounded-lg bg-accent-warm text-background-primary text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {tf.autosaveRestore}
              </button>
              <button
                type="button"
                onClick={handleDiscardAutosave}
                className="px-4 py-2 rounded-lg bg-background-tertiary text-text-secondary text-sm font-medium hover:text-text-primary transition-colors"
              >
                {tf.autosaveDiscard}
              </button>
            </div>
          </div>
        )}

        {/* 리믹스 원본 표시 */}
        {remixSource && (
          <div className="rounded-xl bg-accent-warm/10 border border-accent-warm/20 p-4 flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-accent-warm">{tf.remixLabel}</p>
              <p className="text-xs text-text-secondary">
                {/* 2026-10-04 i18n — 단일 텍스트 노드 `원본: ` 유지(ko 출력 바이트 동일) */}
                {`${tf.remixOriginalPrefix} `}<Link href={`/recipes/${remixSource.id}`} className="text-accent-warm hover:underline">{remixSource.title}</Link>
                {remixSource.author && <span> by @{remixSource.author}</span>}
              </p>
            </div>
          </div>
        )}

        {/* Section 1: 기본 정보 — 공용 BasicInfoSection 이 <section>+번호 h2 래퍼 소유(같은 마크업),
            new 전용 커스텀 요리종류·요리 유형 블록은 customCuisine/dish prop 으로 */}
        <BasicInfoSection
          t={t}
          tf={tf}
          title={title} setTitle={setTitle}
          description={description} setDescription={setDescription}
          servings={servings} setServings={setServings}
          cookTime={cookTime} setCookTime={setCookTime}
          difficulty={difficulty} setDifficulty={setDifficulty}
          cuisineType={cuisineType} setCuisineType={setCuisineType}
          customCuisine={{ value: customCuisineType, set: setCustomCuisineType }}
          dish={{ type: dishType, setType: setDishType, custom: customDishType, setCustom: setCustomDishType }}
        />

        {/* Section 2: 재료 준비 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center text-sm font-bold">2</span>
            {tf.section2Ingredients}
          </h2>

          {/* 통합된 재료 준비 영역 — 공용 recipes/_components/IngredientsSection (new: 삭제 임계 <=5 · "재료 추가" 라벨).
              상태·로직·ref·getPlaceholder 는 page 소유, 컴포넌트는 값+콜백만 받는 순수 표현. 부모는 <section>·h2 유지. */}
          <IngredientsSection
            t={t}
            tf={tf}
            ingredients={ingredients}
            ingredientsImage={ingredientsImage}
            uploadingIngredientsImage={ingredientsUpload.uploading}
            isDraggingIngredients={ingredientsDropZone.isDragging}
            unitInputRefs={unitInputRefs}
            getPlaceholder={getPlaceholder}
            removeDisabledAtOrBelow={5}
            addLabel={tf.addIngredient}
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

          {/* 조리 단계 — _components/StepsSection.tsx 로 추출 (Strangler Fig down-payment).
              상태·로직(add/remove/update/이미지/DnD)은 page 가 소유, 컴포넌트는 값+콜백만. */}
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

          {/* 완성된 요리 이미지 */}
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

          <DietaryOptionsField
            tf={tf}
            isVegetarian={isVegetarian} setIsVegetarian={setIsVegetarian}
            isVegan={isVegan} setIsVegan={setIsVegan}
            isGlutenFree={isGlutenFree} setIsGlutenFree={setIsGlutenFree}
            tooltip={{ hovered: hoveredDietaryOption, setHovered: setHoveredDietaryOption }}
          />

          {/* 영양 정보 — 공용 recipes/_components/NutritionFields (new 는 검증 상한 limits 전달).
              상태는 page 가 소유, 컴포넌트는 값+setter 만 받는 순수 표현. */}
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
            limits={NEW_RECIPE_NUTRITION_LIMITS}
          />

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

        <RecipeFormFooter
          tf={tf}
          loading={loading}
          draftLoading={draftLoading}
          onDraft={handleDraft}
          onSubmit={handleSubmit}
        />
      </div>

      <ImageCropModal
        file={pendingThumbnailFile}
        onCropComplete={handleCroppedThumbnailUpload}
        onCancel={() => setPendingThumbnailFile(null)}
      />
    </div>
  );
}
