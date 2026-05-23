'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { uploadToBucket, getPublicUrl } from '@/lib/storage';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import {
  type RecipeIngredient as Ingredient, type RecipeStep as Step,
} from '@/lib/constants/recipe';
import TagsField from '../../new/_components/TagsField';
import BasicInfoSection from './_components/BasicInfoSection';
import NutritionFields from './_components/NutritionFields';
import IngredientsSection from './_components/IngredientsSection';
import StepsSection from './_components/StepsSection';

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
  const [prepTime, setPrepTime] = useState<number | ''>('');
  const [cookTime, setCookTime] = useState<number | ''>('');
  const [difficulty, setDifficulty] = useState('');
  const [cuisineType, setCuisineType] = useState('korean');

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
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);

  // 재료 준비 이미지
  const [ingredientsImage, setIngredientsImage] = useState<string | null>(null);
  const [uploadingIngredientsImage, setUploadingIngredientsImage] = useState(false);
  const [isDraggingIngredients, setIsDraggingIngredients] = useState(false);

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
          router.push('/login');
          return;
        }

        // 레시피 기본 정보 조회
        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', id)
          .single();

        if (recipeError || !recipeData) {
          if (isMounted) {
            toast.error(tf.errorRecipeNotFound);
            router.push('/');
          }
          return;
        }

        // 권한 확인
        if (recipeData.author_id !== user.id) {
          if (isMounted) {
            toast.error(tf.errorNoEditPermission);
            router.push('/');
          }
          return;
        }

        // 재료 조회
        const { data: ingredientsData } = await supabase
          .from('recipe_ingredients')
          .select('*')
          .eq('recipe_id', id)
          .order('display_order', { ascending: true });

        // 조리 단계 조회
        const { data: stepsData } = await supabase
          .from('recipe_steps')
          .select('*')
          .eq('recipe_id', id)
          .order('step_number', { ascending: true });

        // 태그 조회
        const { data: tagsData } = await supabase
          .from('recipe_tags')
          .select('tag_name')
          .eq('recipe_id', id);

        if (!isMounted) return;

        // 데이터로 state 초기화
        setTitle(recipeData.title || '');
        setDescription(recipeData.description || '');
        setServings(recipeData.servings ?? '');
        setPrepTime(recipeData.prep_time_minutes ?? '');
        setCookTime(recipeData.cook_time_minutes ?? '');
        setDifficulty(recipeData.difficulty_level || '');
        setCuisineType(recipeData.cuisine_type || 'korean');
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
            substitutes: Array.isArray(ing.substitutes) ? (ing.substitutes as string[]) : [],
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

        // 태그 설정
        if (tagsData && tagsData.length > 0) {
          setTags(tagsData.map((t: { tag_name: string }) => t.tag_name));
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

  const addIngredients = () => {
    const newIngredients = Array(5).fill(null).map(() => ({
      ingredient_name: '', quantity: '', unit: '선택', notes: '', is_optional: false, substitutes: []
    }));
    setIngredients([...ingredients, ...newIngredients]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | boolean | string[]) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, { title: '', instruction: '', timer_minutes: null, tip: '', image_url: null }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: keyof Step, value: string | number | null) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  // 이미지 업로드 함수
  const handleImageUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(tf.errorImageType);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(tf.errorImageSize);
      return;
    }

    setUploadingImage(index);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(tf.errorLoginRequired);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await uploadToBucket(supabase, 'recipe-images', filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (uploadError) throw uploadError;

      const publicUrl = getPublicUrl(supabase, 'recipe-images', filePath);

      updateStep(index, 'image_url', publicUrl);

    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(tf.errorImageUpload);
    } finally {
      setUploadingImage(null);
    }
  };

  // 이미지 제거 함수
  const handleImageRemove = (index: number) => {
    updateStep(index, 'image_url', null);
  };

  // 재료 준비 이미지 업로드 함수
  const handleIngredientsImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(tf.errorImageType);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(tf.errorImageSize);
      return;
    }

    setUploadingIngredientsImage(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(tf.errorLoginRequired);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `ingredients-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await uploadToBucket(supabase, 'recipe-images', filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (uploadError) throw uploadError;

      const publicUrl = getPublicUrl(supabase, 'recipe-images', filePath);

      setIngredientsImage(publicUrl);

    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(tf.errorImageUpload);
    } finally {
      setUploadingIngredientsImage(false);
    }
  };

  // 재료 준비 이미지 제거 함수
  const handleIngredientsImageRemove = () => {
    setIngredientsImage(null);
  };

  // 썸네일(완성 요리) 이미지 업로드 함수
  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(tf.errorImageType);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(tf.errorImageSize);
      return;
    }

    setUploadingThumbnail(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(tf.errorLoginRequired);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `thumbnail-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await uploadToBucket(supabase, 'recipe-images', filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (uploadError) throw uploadError;

      const publicUrl = getPublicUrl(supabase, 'recipe-images', filePath);

      setThumbnailImage(publicUrl);

    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(tf.errorImageUpload);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // 썸네일 이미지 제거 함수
  const handleThumbnailRemove = () => {
    setThumbnailImage(null);
  };

  // 드래그 앤 드롭 핸들러 - 썸네일
  const handleThumbnailDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleThumbnailDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingThumbnail(true);
  };

  const handleThumbnailDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingThumbnail(false);
  };

  const handleThumbnailDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingThumbnail(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleThumbnailUpload(files[0]);
    }
  };

  // 드래그 앤 드롭 핸들러 - 재료 준비 이미지
  const handleIngredientsDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleIngredientsDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingIngredients(true);
  };

  const handleIngredientsDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingIngredients(false);
  };

  const handleIngredientsDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingIngredients(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleIngredientsImageUpload(files[0]);
    }
  };

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

  const getPlaceholder = (index: number, field: 'name' | 'quantity' | 'notes') => {
    const examples = {
      0: { name: tf.getPlaceholderName1, quantity: tf.getPlaceholderQty1, notes: tf.getPlaceholderNotes1 },
      2: { name: tf.getPlaceholderName2, quantity: tf.getPlaceholderQty2, notes: tf.getPlaceholderNotes2 },
      4: { name: tf.getPlaceholderName3, quantity: tf.getPlaceholderQty3, notes: tf.getPlaceholderNotes3 }
    };

    const example = examples[index as keyof typeof examples];
    if (example) {
      return example[field];
    }

    return field === 'name' ? tf.ingName : field === 'quantity' ? tf.ingQuantity : tf.ingNotes;
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!title.trim()) {
      toast.warning(tf.warnTitle);
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
        router.push('/login');
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
          prep_time_minutes: prepTime !== '' ? prepTime : null,
          cook_time_minutes: cookTime !== '' ? cookTime : null,
          difficulty_level: difficulty || null,
          cuisine_type: cuisineType,
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
            unit: i.unit,
            notes: i.notes.trim() || null,
            is_optional: i.is_optional,
            substitutes: (i.substitutes ?? []).map(s => s.trim()).filter(Boolean),
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
        {/* Section 1: 기본 정보 — _components/BasicInfoSection.tsx 로 추출
            (god-file 분해 Phase 2, 순수 표현·상태는 page 소유·JSX byte-identical) */}
        <BasicInfoSection
          t={t}
          tf={tf}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          servings={servings}
          setServings={setServings}
          prepTime={prepTime}
          setPrepTime={setPrepTime}
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
          <p className="text-sm text-text-muted">{tf.ingredientsHint}</p>

          {/* 통합된 재료 준비 영역 — _components/IngredientsSection.tsx 로 추출
              (edit 전용: 삭제 임계 <=1·focus ring 보존, JSX byte-identical) */}
          <IngredientsSection
            t={t}
            tf={tf}
            ingredients={ingredients}
            ingredientsImage={ingredientsImage}
            uploadingIngredientsImage={uploadingIngredientsImage}
            isDraggingIngredients={isDraggingIngredients}
            unitInputRefs={unitInputRefs}
            getPlaceholder={getPlaceholder}
            onAddIngredients={addIngredients}
            onRemoveIngredient={removeIngredient}
            onUpdateIngredient={updateIngredient}
            onImageUpload={handleIngredientsImageUpload}
            onImageRemove={handleIngredientsImageRemove}
            onDrag={handleIngredientsDrag}
            onDragIn={handleIngredientsDragIn}
            onDragOut={handleIngredientsDragOut}
            onDrop={handleIngredientsDrop}
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

          {/* 완성된 요리 이미지 */}
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
                  onClick={handleThumbnailRemove}
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
                      handleThumbnailUpload(file);
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
                  onDragOver={handleThumbnailDrag}
                  onDragEnter={handleThumbnailDragIn}
                  onDragLeave={handleThumbnailDragOut}
                  onDrop={handleThumbnailDrop}
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
        </section>

        {/* Section 4: 추가 정보 */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center text-sm font-bold">4</span>
            {t.nutrition.section4Additional}
          </h2>

          <div className="space-y-4">
            <label className="text-sm font-medium text-text-secondary">{tf.dietaryLabel}</label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: isVegetarian, setter: setIsVegetarian, label: tf.dietaryVegetarian },
                { value: isVegan, setter: setIsVegan, label: tf.dietaryVegan },
                { value: isGlutenFree, setter: setIsGlutenFree, label: tf.dietaryGlutenFree },
              ].map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => opt.setter(!opt.value)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    opt.value
                      ? 'bg-accent-warm text-background-primary'
                      : 'bg-background-secondary text-text-muted hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 영양 정보 — _components/NutritionFields.tsx 로 추출 (edit 전용:
              edit 의 무상한 validateNutritionInput 보존, JSX byte-identical) */}
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

          {/* 태그 — recipes/new/_components/TagsField 공유 재사용 (new/edit
              동일 블록 — focus:ring-2 중복뿐, Tailwind 멱등 → 시각·행위 동일) */}
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
    </div>
  );
}
