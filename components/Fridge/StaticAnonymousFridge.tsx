'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import {
  FridgeIngredient,
  FridgeShell,
  FridgeHeader,
  FridgeFooter as _FridgeFooter,
  ShelfSection,
} from '@/components/Fridge/FridgeShelf'

// 비로그인 유저용 정적 냉장고 UI.
// InteractiveFridge는 동적 import(ssr:false)라 JS 로드 + hydration + supabase.auth.getUser()를
// 기다려야 표시됐었다. 비로그인 유저는 결과가 항상 AnonymousFridge로 고정이라 서버 렌더링으로
// 즉시 HTML에 포함시키는 게 맞다.
// 이 컴포넌트는 'use client'지만 dynamic이 아니므로 SSR에 참여해 첫 HTML에 바로 포함됨.

const SAMPLE_INGREDIENTS: FridgeIngredient[] = [
  { id: 's1', ingredient_name: '양파', category: 'veggie', storage_location: '냉장' },
  { id: 's2', ingredient_name: '소고기', category: 'meat', storage_location: '냉장' },
  { id: 's3', ingredient_name: '두부', category: 'other', storage_location: '냉장' },
  { id: 's4', ingredient_name: '계란', category: 'dairy', storage_location: '냉장' },
  { id: 's5', ingredient_name: '새우', category: 'seafood', storage_location: '냉동' },
  { id: 's6', ingredient_name: '삼겹살', category: 'meat', storage_location: '냉동' },
  { id: 's7', ingredient_name: '소금', category: 'seasoning', storage_location: '상온' },
  { id: 's8', ingredient_name: '쌀', category: 'grain', storage_location: '상온' },
]

function groupByStorage(ingredients: FridgeIngredient[]) {
  return {
    refrigerator: ingredients.filter((i) => i.storage_location === '냉장' || !i.storage_location),
    freezer: ingredients.filter((i) => i.storage_location === '냉동'),
    roomTemp: ingredients.filter((i) => i.storage_location === '상온' || i.storage_location === '기타'),
  }
}

export default function StaticAnonymousFridge() {
  const { t } = useI18n()
  const grouped = groupByStorage(SAMPLE_INGREDIENTS)

  return (
    <div className="w-full max-w-xs mx-auto md:max-w-sm">
      <FridgeShell>
        <div className="blur-[3px] select-none pointer-events-none">
          <FridgeHeader title="❄️ 나의 냉장고" />
          <ShelfSection sectionKey="냉장" label="냉장" icon="❄️" items={grouped.refrigerator} />
          <ShelfSection sectionKey="냉동" label="냉동" icon="🧊" items={grouped.freezer} />
          <ShelfSection sectionKey="상온" label="상온" icon="🌡️" items={grouped.roomTemp} isLast />
          <div className="px-3 py-3 bg-[#1c2a3a]">
            <div className="py-2.5 rounded-xl bg-accent-warm/40 text-center text-xs text-background-primary/60 font-bold">
              🔍 이 재료로 레시피 찾기
            </div>
          </div>
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <p className="mx-5 px-4 py-3 rounded-xl bg-background-primary/80 backdrop-blur-sm text-sm text-text-secondary text-center leading-relaxed border border-white/10">
            {t.fridge?.authMessage || '회원가입하면 나만의 냉장고에 재료를 관리하고 맞춤 레시피를 추천받을 수 있어요'}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3">
          <div className="flex gap-2">
            <Link
              href="/signup"
              className="flex-1 py-2.5 rounded-xl bg-accent-warm text-background-primary font-bold text-xs text-center hover:bg-accent-hover transition-colors"
            >
              {t.fridge?.signup || '회원가입'}
            </Link>
            <Link
              href="/login"
              className="flex-1 py-2.5 rounded-xl bg-background-tertiary text-text-primary font-bold text-xs text-center hover:bg-white/10 transition-colors border border-white/15"
            >
              {t.fridge?.login || '로그인'}
            </Link>
          </div>
        </div>
      </FridgeShell>
    </div>
  )
}
