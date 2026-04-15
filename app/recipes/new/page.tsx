'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/toast/context';
import AddIngredientDialog from '@/components/Ingredients/AddIngredientDialog';
import {
  CUISINE_TYPES, DISH_TYPES, DIFFICULTY_LEVELS, UNITS,
  CUISINE_TYPE_TAGS, DISH_TYPE_TAGS, DIETARY_TAGS, DIETARY_DESCRIPTIONS,
  type RecipeIngredient as Ingredient, type RecipeStep as Step,
} from '@/lib/constants/recipe';

// 한국어 감지 및 영어 변환 유틸리티 함수
const detectKoreanAndTranslate = (text: string): { korean: string; english: string } => {
  const trimmed = text.trim();
  const hasKorean = /[가-힣]/.test(trimmed);

  if (!hasKorean) {
    // 영어만 있으면 그대로 반환
    return { korean: trimmed, english: trimmed };
  }

  // 한국어가 있으면 로마자화
  // 간단한 변환: 공백 제거 후 첫 글자 대문자
  const romanized = trimmed
    .replace(/\s+/g, '') // 공백 제거
    .split('')
    .map((char, idx) => idx === 0 ? char.toUpperCase() : char)
    .join('');

  return { korean: trimmed, english: romanized };
};

export default function NewRecipePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const remixId = searchParams.get('remix');
  const supabase = createClient();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
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
    const autoTags: string[] = [];

    // 1. 요리 종류 태그 (한국어 + 영어)
    if (cuisineType && cuisineType !== 'other' && CUISINE_TYPE_TAGS[cuisineType]) {
      autoTags.push(...CUISINE_TYPE_TAGS[cuisineType]);
    }

    // 1-1. 커스텀 요리 종류 태그 (한국어 + 영어 변환)
    if (cuisineType === 'other' && customCuisineType.trim()) {
      const { korean, english } = detectKoreanAndTranslate(customCuisineType);
      autoTags.push(korean);
      if (korean !== english) {
        autoTags.push(english);
      }
    }

    // 2. 요리 유형 태그 (선택된 경우만)
    if (dishType && dishType !== 'other' && DISH_TYPE_TAGS[dishType]) {
      autoTags.push(...DISH_TYPE_TAGS[dishType]);
    }

    // 2-1. 커스텀 요리 유형 태그 (한국어 + 영어 변환)
    if (dishType === 'other' && customDishType.trim()) {
      const { korean, english } = detectKoreanAndTranslate(customDishType);
      autoTags.push(korean);
      if (korean !== english) {
        autoTags.push(english);
      }
    }

    // 3. 식단 옵션 태그
    if (isVegetarian) {
      autoTags.push(...DIETARY_TAGS.vegetarian);
    }
    if (isVegan) {
      autoTags.push(...DIETARY_TAGS.vegan);
    }
    if (isGlutenFree) {
      autoTags.push(...DIETARY_TAGS.glutenFree);
    }

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

  // 영양 정보 검증 함수
  const validateNutritionInput = (value: string, type: 'int' | 'decimal'): boolean => {
    if (value === '') return true; // 빈 값 허용 (선택사항)

    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return false;

    if (type === 'int') {
      return Number.isInteger(num) && num < 5000; // 칼로리 최대 5000
    } else {
      return num < 500; // 영양소 최대 500g
    }
  };

  // 이미지 업로드 함수
  const handleImageUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setUploadingImage(index);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      // 파일명 생성 (타임스탬프 + 랜덤 문자열)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(data.path);

      // Step 업데이트
      updateStep(index, 'image_url', publicUrl);

    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('이미지 업로드에 실패했습니다.');
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
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setUploadingIngredientsImage(true);
    // thumbnailImage는 변경하지 않도록 명시적으로 보호
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      // 파일명 생성 (ingredients- 접두사 추가로 명확히 구분)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/ingredients-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(data.path);

      setIngredientsImage(publicUrl);

    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('이미지 업로드에 실패했습니다.');
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
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setUploadingThumbnail(true);
    // ingredientsImage는 변경하지 않도록 명시적으로 보호
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      // 파일명 생성 (thumbnail- 접두사 추가로 명확히 구분)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/thumbnail-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(data.path);

      setThumbnailImage(publicUrl);

    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('이미지 업로드에 실패했습니다.');
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
      0: { name: '예: 돼지고기', quantity: '예: 200', notes: '예: 찌개용, 한입 크기로 준비' },
      2: { name: '예: 양파', quantity: '예: 1', notes: '예: 채썰어서 준비' },
      4: { name: '재료명', quantity: '양', notes: '메모' }
    };

    const example = examples[index as keyof typeof examples];
    if (example) {
      return example[field];
    }

    return field === 'name' ? '재료명' : field === 'quantity' ? '양' : '메모';
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!title.trim()) {
      toast.warning('레시피 제목을 입력해주세요.');
      return;
    }

    if (cuisineType === 'other' && !customCuisineType.trim()) {
      toast.warning('기타 요리 종류를 입력해주세요.');
      return;
    }

    if (dishType === 'other' && !customDishType.trim()) {
      toast.warning('기타 요리 유형을 입력해주세요.');
      return;
    }

    // 재료 검증
    const validIngredients = ingredients.filter(i => i.ingredient_name.trim());

    if (validIngredients.length === 0) {
      toast.warning('최소 1개의 재료를 입력해주세요.');
      return;
    }

    const validSteps = steps.filter(s => s.instruction.trim());
    if (validSteps.length === 0) {
      toast.warning('최소 1개의 조리 단계를 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
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
        throw new Error(data.error || '레시피 생성에 실패했습니다.');
      }

      toast.success('레시피가 성공적으로 등록되었습니다!');
      router.push(`/recipes/${data.recipe.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDraft = async () => {
    if (!title.trim()) {
      toast.warning('제목을 입력해주세요.');
      return;
    }
    setDraftLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('로그인이 필요합니다.'); router.push('/login'); return; }

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
      if (!response.ok) throw new Error(data.error || '임시저장에 실패했습니다.');

      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
      toast.success('임시저장됐습니다!');
      router.push(profile?.username ? `/@${profile.username}?tab=drafts` : '/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다.');
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
            ← 취소
          </Link>
          <h1 className="text-lg font-bold">{remixSource ? '🔄 리믹스' : '새 레시피'}</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-6 py-6 space-y-10">
        {/* 리믹스 원본 표시 */}
        {remixSource && (
          <div className="rounded-xl bg-accent-warm/10 border border-accent-warm/20 p-4 flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-accent-warm">리믹스</p>
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
            기본 정보
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">레시피 제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-background-secondary px-5 py-4 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
              placeholder="예: 만드는건 간단하지만 맛은 간단하지 않은 떡볶이"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-background-secondary px-5 py-4 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm min-h-[100px] resize-none"
              placeholder="레시피에 대한 간단한 설명을 작성해주세요.(선택)"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">인분 <span className="text-text-muted text-xs">선택</span></label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value ? parseInt(e.target.value) : '')}
                min="1"
                placeholder="선택사항"
                className="w-full rounded-xl bg-background-secondary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">준비(분) <span className="text-text-muted text-xs">선택</span></label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : '')}
                min="0"
                placeholder="선택사항"
                className="w-full rounded-xl bg-background-secondary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">조리(분) <span className="text-text-muted text-xs">선택</span></label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value ? parseInt(e.target.value) : '')}
                min="0"
                placeholder="선택사항"
                className="w-full rounded-xl bg-background-secondary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">난이도 <span className="text-text-muted text-xs">선택</span></label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-xl bg-background-secondary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
              >
                <option value="">선택안함</option>
                {DIFFICULTY_LEVELS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">요리 종류</label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_TYPES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCuisineType(c.value)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    cuisineType === c.value
                      ? 'bg-accent-warm text-background-primary'
                      : 'bg-background-secondary text-text-muted hover:bg-white/10'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {/* 기타 선택 시 커스텀 입력 */}
            {cuisineType === 'other' && (
              <input
                type="text"
                value={customCuisineType}
                onChange={(e) => setCustomCuisineType(e.target.value)}
                placeholder="요리 종류를 입력하세요 (예: 퓨전, 분식)"
                className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
              />
            )}
          </div>

          {/* 요리 유형 (2단계) - 조건부 표시 */}
          {cuisineType && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-sm font-medium text-text-secondary">
                요리 유형 <span className="text-text-muted text-xs">(선택)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DISH_TYPES.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDishType(d.value)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      dishType === d.value
                        ? 'bg-accent-warm text-background-primary'
                        : 'bg-background-secondary text-text-muted hover:bg-white/10'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {/* 기타 선택 시 커스텀 입력 */}
              {dishType === 'other' && (
                <input
                  type="text"
                  value={customDishType}
                  onChange={(e) => setCustomDishType(e.target.value)}
                  placeholder="요리 유형을 입력하세요 (예: 퓨전요리, 분식)"
                  className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
                />
              )}
            </div>
          )}
        </section>

        {/* Section 2: 재료 준비 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center text-sm font-bold">2</span>
            재료 준비
          </h2>
          <p className="text-sm text-text-muted">식재료 &gt; 조미료&양념 &gt; 소스 순서로 작성해 주세요.</p>

          {/* 통합된 재료 준비 영역 */}
          <div className="rounded-xl bg-background-secondary p-4 md:p-6 space-y-6">
            {/* 재료 준비 이미지 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-secondary">재료 준비 사진 (선택)</label>
              {ingredientsImage ? (
                <div className="relative w-full h-64">
                  <Image
                    src={ingredientsImage}
                    alt="재료 준비"
                    fill
                    className="object-cover rounded-xl"
                  />
                  <button
                    onClick={handleIngredientsImageRemove}
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
                        handleIngredientsImageUpload(file);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                    disabled={uploadingIngredientsImage}
                  />
                  <div
                    className={`w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                      isDraggingIngredients
                        ? 'border-accent-warm bg-accent-warm/10'
                        : 'border-white/20 hover:border-accent-warm hover:bg-white/5'
                    }`}
                    onDragOver={handleIngredientsDrag}
                    onDragEnter={handleIngredientsDragIn}
                    onDragLeave={handleIngredientsDragOut}
                    onDrop={handleIngredientsDrop}
                  >
                    {uploadingIngredientsImage ? (
                      <>
                        <div className="w-8 h-8 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-text-muted">업로드 중...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="text-center">
                          <p className="text-sm font-medium text-text-primary">준비된 재료 사진 추가</p>
                          <p className="text-xs text-text-muted mt-1">최대 5MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>

            {/* 구분선 */}
            <div className="border-t border-white/10"></div>

            {/* 재료 입력 테이블 */}
            <div className="space-y-2">
              {/* Header */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_100px_70px_1fr_32px] gap-2 text-xs text-text-muted pb-2 border-b border-white/10">
              <span>재료명 *</span>
              <span>양</span>
              <span>단위</span>
              <span>메모</span>
              <span></span>
            </div>

            {/* Ingredient Rows */}
            {ingredients.map((ing, index) => {
              const standardUnits = ['선택', 'g', 'kg', 'ml', 'L', '개', '큰술', '작은술', '컵', '줌', '꼬집', '조각', '장', '포기', '대', '모', '마리'];
              const isCustomUnit = ing.unit === '' || !standardUnits.includes(ing.unit);

              return (
                <div key={index} className="space-y-2">
                  {/* Row 1: Main ingredient info (always visible) */}
                  <div className="grid grid-cols-[1fr_80px_60px_32px] sm:grid-cols-[1fr_100px_70px_1fr_32px] gap-2 items-center">
                    {/* 재료명 입력 */}
                    <input
                      type="text"
                      value={ing.ingredient_name}
                      onChange={(e) => updateIngredient(index, 'ingredient_name', e.target.value)}
                      className="w-full rounded-lg bg-background-tertiary px-3 py-2 text-sm text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                      placeholder={getPlaceholder(index, 'name')}
                    />
                    <input
                      type="text"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      className="w-full rounded-lg bg-background-tertiary px-2 py-2 text-sm text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                      placeholder={getPlaceholder(index, 'quantity')}
                    />
                    {isCustomUnit ? (
                      <input
                        ref={(el) => { unitInputRefs.current[index] = el; }}
                        type="text"
                        value={ing.unit}
                        onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            updateIngredient(index, 'unit', '선택');
                          }
                        }}
                        className="w-full rounded-lg bg-background-tertiary px-2 py-2 text-sm text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                        placeholder="단위"
                      />
                    ) : (
                      <select
                        value={ing.unit}
                        onChange={(e) => {
                          if (e.target.value === '기타') {
                            updateIngredient(index, 'unit', '');
                            // 다음 렌더링 후 input에 자동 포커스
                            setTimeout(() => {
                              unitInputRefs.current[index]?.focus();
                            }, 0);
                          } else {
                            updateIngredient(index, 'unit', e.target.value);
                          }
                        }}
                        className="w-full rounded-lg bg-background-tertiary px-1 py-2 text-sm text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                      >
                        {UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    )}
                    {/* Notes - Desktop only (in grid) */}
                    <input
                      type="text"
                      value={ing.notes}
                      onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                      className="hidden sm:block w-full rounded-lg bg-background-tertiary px-3 py-2 text-sm text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                      placeholder={getPlaceholder(index, 'notes')}
                    />
                    <button
                      onClick={() => removeIngredient(index)}
                      disabled={ingredients.length <= 5}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                        ingredients.length <= 5
                          ? 'text-text-muted opacity-30'
                          : 'text-error hover:bg-error/10'
                      }`}
                    >
                      ×
                    </button>
                  </div>

                  {/* Row 2: Notes on mobile (full width below) */}
                  <div className="sm:hidden">
                    <input
                      type="text"
                      value={ing.notes}
                      onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                      className="w-full rounded-lg bg-background-tertiary px-3 py-2 text-sm text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm"
                      placeholder="메모 (예: 잘게 썬, 굵게 다진)"
                    />
                  </div>
                </div>
              );
            })}
            </div>

            {/* 재료 추가 버튼 */}
            <button
              onClick={addIngredients}
              className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-text-muted hover:border-accent-warm hover:text-accent-warm transition-all"
            >
              + 재료 5개 추가
            </button>
          </div>
        </section>

        {/* Section 3: 조리 순서 */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center text-sm font-bold">3</span>
            조리 순서
          </h2>
          <p className="text-sm text-text-muted">조리 순서를 단계별로 입력해주세요.</p>

          {steps.map((step, index) => (
            <div key={index} className="p-4 rounded-xl bg-background-secondary space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-warm text-background-primary flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">단계</span>
                </div>
                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(index)}
                    className="text-error text-sm hover:underline"
                  >
                    삭제
                  </button>
                )}
              </div>

              <textarea
                value={step.instruction}
                onChange={(e) => updateStep(index, 'instruction', e.target.value)}
                className="w-full rounded-lg bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm min-h-[120px] resize-none"
                placeholder="조리 방법을 단계별로 작성해주세요."
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={step.tip}
                    onChange={(e) => updateStep(index, 'tip', e.target.value)}
                    className="w-full rounded-lg bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm text-sm"
                    placeholder="팁 (선택)"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    value={step.timer_minutes || ''}
                    onChange={(e) => updateStep(index, 'timer_minutes', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full rounded-lg bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/5 focus:ring-2 focus:ring-accent-warm text-sm"
                    placeholder="타이머(분)"
                    min="0"
                  />
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div className="space-y-2">
                <label className="text-xs text-text-muted">단계 이미지 (선택)</label>
                {step.image_url ? (
                  <div className="relative w-full h-48">
                    <Image
                      src={step.image_url}
                      alt={`단계 ${index + 1} 이미지`}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-error transition-all"
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
                          handleImageUpload(index, file);
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                      disabled={uploadingImage === index}
                    />
                    <div
                      className={`w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                        draggingStepIndex === index
                          ? 'border-accent-warm bg-accent-warm/10'
                          : 'border-white/20 hover:border-accent-warm hover:bg-white/5'
                      }`}
                      onDragOver={handleStepDrag}
                      onDragEnter={(e) => handleStepDragIn(e, index)}
                      onDragLeave={handleStepDragOut}
                      onDrop={(e) => handleStepDrop(e, index)}
                    >
                      {uploadingImage === index ? (
                        <>
                          <div className="w-6 h-6 border-2 border-accent-warm border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-text-muted">업로드 중...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-sm text-text-muted">이미지 추가 (최대 5MB)</span>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={addStep}
            className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-text-muted hover:border-accent-warm hover:text-accent-warm transition-all"
          >
            + 단계 추가
          </button>

          {/* 완성된 요리 이미지 */}
          <div className="space-y-3 pt-4">
            <label className="text-sm font-medium text-text-secondary">완성된 요리 사진 (선택)</label>
            <p className="text-xs text-text-muted">레시피 대표 이미지로 사용됩니다. 추가하지 않으면 마지막 조리 단계 이미지가 사용됩니다.</p>
            {thumbnailImage ? (
              <div className="relative w-full h-64">
                <Image
                  src={thumbnailImage}
                  alt="완성된 요리"
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
                      <span className="text-sm text-text-muted">업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-center">
                        <p className="text-sm font-medium text-text-primary">완성된 요리 사진 추가</p>
                        <p className="text-xs text-text-muted mt-1">최대 5MB</p>
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
            추가 정보
          </h2>

          <div className="space-y-4">
            <label className="text-sm font-medium text-text-secondary">식단 옵션</label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: isVegetarian, setter: setIsVegetarian, label: '채식', key: 'vegetarian' },
                { value: isVegan, setter: setIsVegan, label: '비건', key: 'vegan' },
                { value: isGlutenFree, setter: setIsGlutenFree, label: '글루텐 프리', key: 'glutenFree' },
              ].map(opt => (
                <div
                  key={opt.label}
                  className="relative"
                  onMouseEnter={() => setHoveredDietaryOption(opt.key)}
                  onMouseLeave={() => setHoveredDietaryOption(null)}
                  onTouchStart={() => setHoveredDietaryOption(opt.key)}
                  onTouchEnd={() => setTimeout(() => setHoveredDietaryOption(null), 2000)}
                >
                  <button
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

                  {/* 툴팁 */}
                  {hoveredDietaryOption === opt.key && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-background-tertiary text-text-primary text-xs rounded-lg shadow-lg whitespace-nowrap z-10 animate-fadeIn">
                      {DIETARY_DESCRIPTIONS[opt.key as keyof typeof DIETARY_DESCRIPTIONS]}
                      {/* 툴팁 화살표 */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-background-tertiary"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 영양 정보 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-secondary">
                영양 정보 <span className="text-text-muted text-xs">(1인분 기준, 선택)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowNutrition(!showNutrition)}
                className="text-sm text-accent-warm hover:text-accent-hover transition-colors flex items-center gap-2"
              >
                {showNutrition ? '숨기기' : '추가하기'}
                <svg className={`w-4 h-4 transition-transform ${showNutrition ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {showNutrition && (
              <div className="rounded-xl bg-background-secondary p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 칼로리 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">
                      칼로리 <span className="text-text-muted text-xs">(kcal)</span>
                    </label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => {
                        if (validateNutritionInput(e.target.value, 'int')) {
                          setCalories(e.target.value);
                        }
                      }}
                      min="0"
                      step="1"
                      className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
                      placeholder="예: 350"
                    />
                  </div>

                  {/* 단백질 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">
                      단백질 <span className="text-text-muted text-xs">(g)</span>
                    </label>
                    <input
                      type="number"
                      value={protein}
                      onChange={(e) => {
                        if (validateNutritionInput(e.target.value, 'decimal')) {
                          setProtein(e.target.value);
                        }
                      }}
                      min="0"
                      step="0.1"
                      className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
                      placeholder="예: 25.5"
                    />
                  </div>

                  {/* 탄수화물 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">
                      탄수화물 <span className="text-text-muted text-xs">(g)</span>
                    </label>
                    <input
                      type="number"
                      value={carbs}
                      onChange={(e) => {
                        if (validateNutritionInput(e.target.value, 'decimal')) {
                          setCarbs(e.target.value);
                        }
                      }}
                      min="0"
                      step="0.1"
                      className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
                      placeholder="예: 45.0"
                    />
                  </div>

                  {/* 지방 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">
                      지방 <span className="text-text-muted text-xs">(g)</span>
                    </label>
                    <input
                      type="number"
                      value={fat}
                      onChange={(e) => {
                        if (validateNutritionInput(e.target.value, 'decimal')) {
                          setFat(e.target.value);
                        }
                      }}
                      min="0"
                      step="0.1"
                      className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
                      placeholder="예: 12.5"
                    />
                  </div>

                  {/* 식이섬유 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">
                      식이섬유 <span className="text-text-muted text-xs">(g)</span>
                    </label>
                    <input
                      type="number"
                      value={fiber}
                      onChange={(e) => {
                        if (validateNutritionInput(e.target.value, 'decimal')) {
                          setFiber(e.target.value);
                        }
                      }}
                      min="0"
                      step="0.1"
                      className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
                      placeholder="예: 3.5"
                    />
                  </div>

                  {/* 나트륨 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">
                      나트륨 <span className="text-text-muted text-xs">(mg)</span>
                    </label>
                    <input
                      type="number"
                      value={sodium}
                      onChange={(e) => {
                        if (validateNutritionInput(e.target.value, 'int')) {
                          setSodium(e.target.value);
                        }
                      }}
                      min="0"
                      step="1"
                      className="w-full rounded-xl bg-background-tertiary px-4 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
                      placeholder="예: 800"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-text-secondary">태그 (최대 10개)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 rounded-xl bg-background-secondary px-5 py-3 text-text-primary outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-2 focus:ring-accent-warm"
                placeholder="태그 입력 후 추가 버튼 클릭"
              />
              <button
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 10}
                className="px-6 py-3 rounded-xl bg-accent-warm text-background-primary font-bold disabled:opacity-50"
              >
                추가
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-background-secondary text-sm flex items-center gap-2"
                  >
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="text-text-muted hover:text-error">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Submit Button */}
        <div className="pt-4 flex gap-3">
          <button
            onClick={handleDraft}
            disabled={draftLoading || loading}
            className="flex-1 py-4 rounded-xl bg-background-secondary border border-white/10 text-text-secondary font-bold hover:bg-background-tertiary transition-all disabled:opacity-50"
          >
            {draftLoading ? '저장 중...' : '임시저장'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || draftLoading}
            className="flex-[2] py-4 rounded-xl bg-accent-warm text-background-primary text-lg font-bold hover:bg-accent-hover transition-all disabled:opacity-50"
          >
            {loading ? '등록 중...' : '레시피 등록하기'}
          </button>
        </div>
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
          toast.success('재료가 추가되었습니다. 이제 모든 사용자가 사용할 수 있습니다!');
        }}
        initialName={addIngredientSearchQuery}
      />
    </div>
  );
}
