'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocalizedRouter as useRouter } from '@/lib/i18n/useLocalizedRouter';
import Link from '@/components/Common/LocalizedLink';
import { createClient } from '@/lib/supabase/client';
import { uploadToBucket, getPublicUrl } from '@/lib/storage';
import { useToast } from '@/lib/toast/context';
import { useI18n } from '@/lib/i18n/context';
import AddIngredientDialog from '@/components/Ingredients/AddIngredientDialog';
import TagsField from './_components/TagsField';
import NutritionFields from './_components/NutritionFields';
import StepsSection from './_components/StepsSection';
import IngredientsSection from './_components/IngredientsSection';
import BasicInfoSection from './_components/BasicInfoSection';
import RecipeFormFooter from './_components/RecipeFormFooter';
import ThumbnailUploadField from './_components/ThumbnailUploadField';
import DietaryOptionsField from './_components/DietaryOptionsField';
import { computeAutoTags } from '@/lib/recipes/autoTags';
import {
  type RecipeIngredient as Ingredient, type RecipeStep as Step,
} from '@/lib/constants/recipe';
import type { IngredientItem } from '@/components/Ingredients/IngredientAutocompleteTypes';

export default function NewRecipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const remixId = searchParams.get('remix');
  const supabase = createClient();
  const toast = useToast();
  const { t } = useI18n();
  const tf = t.recipeForm;
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [copyrightAgreed, setCopyrightAgreed] = useState(false);
  const [remixSource, setRemixSource] = useState<{ id: string; title: string; author: string } | null>(null);

  // 기본 정보
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState<number | ''>('');
  const [prepTime, setPrepTime] = useState<number | ''>('');
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

  // 재료 (기본 5개)
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    Array(5).fill(null).map(() => ({ ingredient_name: '', quantity: '', unit: '선택', notes: '', is_optional: false }))
  );

  // 완성된 요리 이미지 (썸네일)
  const [thumbnailImage, setThumbnailImage] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);

  // 재료 준비 이미지
  const [ingredientsImage, setIngredientsImage] = useState<string | null>(null);
  const [uploadingIngredientsImage, setUploadingIngredientsImage] = useState(false);
  const [isDraggingIngredients, setIsDraggingIngredients] = useState(false);

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

  const [showAddIngredientDialog, setShowAddIngredientDialog] = useState(false);
  const [addIngredientSearchQuery, setAddIngredientSearchQuery] = useState('');

  // 리믹스: 원본 레시피 데이터 로드
  useEffect(() => {
    if (!remixId) return;

    const loadRemixData = async () => {
      const { data: recipe } = await supabase
        .from('recipes')
        .select('id, title, description, prep_time_minutes, cook_time_minutes, difficulty_level, servings, cuisine_type, dish_type, author_id, profiles:author_id(username)')
        .eq('id', remixId)
        .single();

      if (!recipe) return;

      const { data: recipeIngredients } = await supabase
        .from('recipe_ingredients')
        .select('ingredient_name, quantity, unit, notes, is_optional')
        .eq('recipe_id', remixId)
        .order('order_index');

      const { data: recipeSteps } = await supabase
        .from('recipe_steps')
        .select('instruction, timer_minutes, tip')
        .eq('recipe_id', remixId)
        .order('step_number');

      // 폼에 데이터 채우기
      setTitle(`리믹스: ${recipe.title}`);
      setDescription(recipe.description || '');
      setServings(recipe.servings || '');
      setPrepTime(recipe.prep_time_minutes || '');
      setCookTime(recipe.cook_time_minutes || '');
      setDifficulty(recipe.difficulty_level || '');
      setCuisineType(recipe.cuisine_type || '');
      setDishType(recipe.dish_type || '');

      if (recipeIngredients && recipeIngredients.length > 0) {
        setIngredients(recipeIngredients.map(i => ({
          ingredient_name: i.ingredient_name,
          quantity: i.quantity || '',
          unit: i.unit || '선택',
          notes: i.notes || '',
          is_optional: i.is_optional || false,
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

      const authorData = recipe.profiles as unknown as { username: string } | null;
      setRemixSource({
        id: recipe.id,
        title: recipe.title,
        author: authorData?.username || '',
      });
    };

    loadRemixData();
  }, [remixId, supabase]);

  // 자동 태그 생성
  useEffect(() => {
    const autoTags = computeAutoTags({
      cuisineType, customCuisineType, dishType, customDishType,
      isVegetarian, isVegan, isGlutenFree,
    });

    // 기존 태그와 중복되지 않는 자동 태그만 추가 (함수형 업데이트로 최신 상태 사용)
    setTags(prevTags => {
      const newTags = autoTags.filter(tag => !prevTags.includes(tag));

      if (newTags.length > 0) {
        // 최대 10개 제한
        const remainingSlots = 10 - prevTags.length;
        const tagsToAdd = newTags.slice(0, remainingSlots);
        return [...prevTags, ...tagsToAdd];
      }

      return prevTags;
    });
  }, [cuisineType, dishType, customCuisineType, customDishType, isVegetarian, isVegan, isGlutenFree]);

  const addIngredients = () => {
    const newIngredients = Array(5).fill(null).map(() => ({
      ingredient_name: '', quantity: '', unit: '선택', notes: '', is_optional: false
    }));
    setIngredients([...ingredients, ...newIngredients]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 5) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | boolean) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const selectIngredient = (index: number, item: IngredientItem) => {
    const updated = [...ingredients];
    const current = updated[index];
    updated[index] = {
      ...current,
      ingredient_name: item.name,
      ingredient_id: item.id,
      ...(item.common_units?.[0] && current.unit === '선택' ? { unit: item.common_units[0] } : {}),
    };
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, { instruction: '', timer_minutes: null, tip: '', image_url: null }]);
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

  // (영양 정보 검증 validateNutritionInput → _components/NutritionFields.tsx 로 이동.
  //  이 블록에서만 쓰이는 순수 함수라 응집상 컴포넌트와 함께 둠)

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

      // 파일명 생성 (타임스탬프 + 랜덤 문자열)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Supabase Storage에 업로드
      const { path, error } = await uploadToBucket(supabase, 'recipe-images', fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (error) {
        throw error;
      }

      // Public URL 가져오기
      const publicUrl = getPublicUrl(supabase, 'recipe-images', path ?? fileName);

      // Step 업데이트
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
    // thumbnailImage는 변경하지 않도록 명시적으로 보호
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(tf.errorLoginRequired);
        return;
      }

      // 파일명 생성 (ingredients- 접두사 추가로 명확히 구분)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/ingredients-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Supabase Storage에 업로드
      const { path, error } = await uploadToBucket(supabase, 'recipe-images', fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (error) {
        throw error;
      }

      // Public URL 가져오기
      const publicUrl = getPublicUrl(supabase, 'recipe-images', path ?? fileName);

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
    // ingredientsImage는 변경하지 않도록 명시적으로 보호
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(tf.errorLoginRequired);
        return;
      }

      // 파일명 생성 (thumbnail- 접두사 추가로 명확히 구분)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/thumbnail-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Supabase Storage에 업로드
      const { path, error } = await uploadToBucket(supabase, 'recipe-images', fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (error) {
        throw error;
      }

      // Public URL 가져오기
      const publicUrl = getPublicUrl(supabase, 'recipe-images', path ?? fileName);

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

  // Get placeholder text based on index
  const getPlaceholder = (index: number, field: 'name' | 'quantity' | 'notes') => {
    const examples = {
      0: { name: tf.getPlaceholderName1, quantity: tf.getPlaceholderQty1, notes: tf.getPlaceholderNotes1 },
      2: { name: tf.getPlaceholderName2, quantity: tf.getPlaceholderQty2, notes: tf.getPlaceholderNotes2 },
      4: { name: tf.ingName, quantity: tf.ingQuantity, notes: tf.ingNotes }
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
        router.push('/login');
        return;
      }

      const response = await fetch('/api/recipes', {
        method: 'POST',
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
          cuisine_type: cuisineType === 'other' && customCuisineType.trim() ? customCuisineType.trim() : cuisineType,
          dish_type: dishType === 'other' && customDishType.trim() ? customDishType.trim() : dishType,
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
            is_optional: i.is_optional
          })),
          steps: validSteps.map(s => ({
            instruction: s.instruction.trim(),
            timer_minutes: s.timer_minutes,
            tip: s.tip.trim() || null,
            image_url: s.image_url
          })),
          tags,
          // Remix tracking
          original_recipe_id: remixSource?.id || null,
          is_remix: !!remixSource,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || tf.errorCreate);
      }

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
    setDraftLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error(tf.errorLoginRequired); router.push('/login'); return; }

      const validIngredients = ingredients.filter(i => i.ingredient_name.trim());
      const validSteps = steps.filter(s => s.instruction.trim());

      const response = await fetch('/api/recipes', {
        method: 'POST',
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
          cuisine_type: cuisineType === 'other' && customCuisineType.trim() ? customCuisineType.trim() : cuisineType,
          dish_type: dishType === 'other' && customDishType.trim() ? customDishType.trim() : dishType,
          meal_type: 'lunch',
          is_vegetarian: isVegetarian,
          is_vegan: isVegan,
          is_gluten_free: isGlutenFree,
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
          })),
          steps: validSteps.map(s => ({
            instruction: s.instruction.trim(),
            timer_minutes: s.timer_minutes,
            tip: s.tip.trim() || null,
            image_url: s.image_url,
          })),
          tags,
          original_recipe_id: remixSource?.id || null,
          is_remix: !!remixSource,
          status: 'draft' as const,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tf.errorDraft);

      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
      toast.success(tf.successDraft);
      router.push(profile?.username ? `/@${profile.username}?tab=drafts` : '/');
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
        {/* 리믹스 원본 표시 */}
        {remixSource && (
          <div className="rounded-xl bg-accent-warm/10 border border-accent-warm/20 p-4 flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-accent-warm">{tf.remixLabel}</p>
              <p className="text-xs text-text-secondary">
                원본: <Link href={`/recipes/${remixSource.id}`} className="text-accent-warm hover:underline">{remixSource.title}</Link>
                {remixSource.author && <span> by @{remixSource.author}</span>}
              </p>
            </div>
          </div>
        )}

        {/* Section 1: 기본 정보 */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center text-sm font-bold">1</span>
            {tf.section1Basic}
          </h2>

          <BasicInfoSection
            t={t}
            tf={tf}
            title={title} setTitle={setTitle}
            description={description} setDescription={setDescription}
            servings={servings} setServings={setServings}
            prepTime={prepTime} setPrepTime={setPrepTime}
            cookTime={cookTime} setCookTime={setCookTime}
            difficulty={difficulty} setDifficulty={setDifficulty}
            cuisineType={cuisineType} setCuisineType={setCuisineType}
            customCuisineType={customCuisineType} setCustomCuisineType={setCustomCuisineType}
            dishType={dishType} setDishType={setDishType}
            customDishType={customDishType} setCustomDishType={setCustomDishType}
          />
        </section>

        {/* Section 2: 재료 준비 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center text-sm font-bold">2</span>
            {tf.section2Ingredients}
          </h2>
          <p className="text-sm text-text-muted">{tf.ingredientsHint}</p>

          {/* 통합된 재료 준비 영역 — _components/IngredientsSection.tsx 로 추출
              (Strangler Fig). 상태·로직·ref·getPlaceholder 는 page 소유, 컴포넌트는
              값+콜백만 받는 순수 표현. 부모는 <section>·h2·hint 유지. */}
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
            onSelectIngredient={selectIngredient}
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
            uploadingThumbnail={uploadingThumbnail}
            isDraggingThumbnail={isDraggingThumbnail}
            onUpload={handleThumbnailUpload}
            onRemove={handleThumbnailRemove}
            onDrag={handleThumbnailDrag}
            onDragIn={handleThumbnailDragIn}
            onDragOut={handleThumbnailDragOut}
            onDrop={handleThumbnailDrop}
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
            hoveredDietaryOption={hoveredDietaryOption}
            setHoveredDietaryOption={setHoveredDietaryOption}
          />

          {/* 영양 정보 — _components/NutritionFields.tsx 로 추출 (Strangler Fig down-payment).
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
          copyrightAgreed={copyrightAgreed}
          setCopyrightAgreed={setCopyrightAgreed}
          loading={loading}
          draftLoading={draftLoading}
          onDraft={handleDraft}
          onSubmit={handleSubmit}
        />
      </div>

      {/* 재료 선택 모달 */}
      {/* 새 재료 추가 다이얼로그 */}
      <AddIngredientDialog
        isOpen={showAddIngredientDialog}
        onClose={() => {
          setShowAddIngredientDialog(false);
          setAddIngredientSearchQuery('');
        }}
        onSuccess={() => {
          setShowAddIngredientDialog(false);
          setAddIngredientSearchQuery('');
          toast.success(tf.successIngredientAdded);
        }}
        initialName={addIngredientSearchQuery}
      />
    </div>
  );
}
