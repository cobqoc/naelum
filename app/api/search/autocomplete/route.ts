import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { levenshteinSimilarity } from '@/lib/utils/levenshtein'

// GET /api/search/autocomplete - 검색 자동완성
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const rawQuery = searchParams.get('q') || ''
  const query = rawQuery.replace(/[%_\\]/g, '').trim()
  const rawLimit = parseInt(searchParams.get('limit') || '10')
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 10 : rawLimit), 20)

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const [recipeTitles, ingredientNames, usernames] = await Promise.all([
    supabase
      .from('recipes')
      .select('title, average_rating')
      .eq('status', 'published')
      .ilike('title', `%${query}%`)
      .order('average_rating', { ascending: false })
      .limit(8),

    supabase
      .from('ingredients_master')
      .select('name, name_ko')
      .or(`name.ilike.%${query}%,name_ko.ilike.%${query}%`)
      .limit(5),

    supabase
      .from('profiles')
      .select('username')
      .ilike('username', `%${query}%`)
      .limit(3)
  ])

  // 관련도 정렬: 유사도 높은 순
  const recipeSuggestions = (recipeTitles.data || [])
    .map(r => ({
      type: 'recipe' as const,
      value: r.title,
      relevance: levenshteinSimilarity(query, r.title)
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5)

  const suggestions = [
    ...recipeSuggestions.map(r => ({ type: r.type, value: r.value })),
    ...(ingredientNames.data || []).map(i => ({ type: 'ingredient' as const, value: i.name_ko || i.name })),
    ...(usernames.data || []).map(u => ({ type: 'user' as const, value: `@${u.username}` }))
  ].slice(0, limit)

  return NextResponse.json({ suggestions })
}
