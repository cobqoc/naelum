/**
 * 재료 매칭 서비스
 *
 * 영수증에서 파싱된 상품명을 ingredients_master 테이블의
 * 재료와 매칭. 카탈로그를 1회 조회 후 메모리에서 매칭.
 */

import { levenshteinSimilarity } from '@/lib/utils/levenshtein';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MatchedIngredient {
  id: string;
  name: string;
  name_en: string | null;
  category: string;
}

export interface MatchResult {
  itemName: string;
  ingredient: MatchedIngredient | null;
  confidence: number;
}

interface CatalogItem {
  id: string;
  name: string;
  name_en: string | null;
  name_ko: string | null;
  category: string;
}

const SIMILARITY_THRESHOLD = 0.6;

function matchSingleInMemory(itemName: string, catalog: CatalogItem[]): MatchResult {
  if (!itemName || itemName.length < 1) {
    return { itemName, ingredient: null, confidence: 0 };
  }

  const lower = itemName.toLowerCase();

  // 1. 정확 매칭
  const exact = catalog.find(
    c => c.name === itemName || c.name_ko === itemName
  );
  if (exact) {
    return {
      itemName,
      ingredient: {
        id: exact.id,
        name: exact.name_ko || exact.name,
        name_en: exact.name_en,
        category: exact.category,
      },
      confidence: 1.0,
    };
  }

  // 2. 포함 매칭
  const likeMatches = catalog.filter(c => {
    const n = (c.name_ko || c.name).toLowerCase();
    return n.includes(lower) || lower.includes(n);
  });

  if (likeMatches.length > 0) {
    const bestMatch = likeMatches.reduce((best, current) => {
      const bestLen = (best.name_ko || best.name).length;
      const currentLen = (current.name_ko || current.name).length;
      return currentLen < bestLen ? current : best;
    });

    const matchedName = bestMatch.name_ko || bestMatch.name;
    const similarity = levenshteinSimilarity(itemName, matchedName);

    return {
      itemName,
      ingredient: {
        id: bestMatch.id,
        name: matchedName,
        name_en: bestMatch.name_en,
        category: bestMatch.category,
      },
      confidence: Math.max(0.7, similarity),
    };
  }

  // 3. 유사도 매칭
  const prefix = itemName.slice(0, 2).toLowerCase();
  const candidates = catalog.filter(c => {
    const n = (c.name_ko || c.name).toLowerCase();
    return n.startsWith(prefix);
  });

  let bestCandidate: CatalogItem | null = null;
  let bestSimilarity = 0;

  for (const candidate of candidates) {
    const candidateName = candidate.name_ko || candidate.name;
    const similarity = levenshteinSimilarity(itemName, candidateName);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestCandidate = candidate;
    }
  }

  if (bestCandidate && bestSimilarity >= SIMILARITY_THRESHOLD) {
    return {
      itemName,
      ingredient: {
        id: bestCandidate.id,
        name: bestCandidate.name_ko || bestCandidate.name,
        name_en: bestCandidate.name_en,
        category: bestCandidate.category,
      },
      confidence: bestSimilarity,
    };
  }

  return { itemName, ingredient: null, confidence: 0 };
}

/**
 * 여러 상품명을 일괄 매칭 (카탈로그 1회 조회)
 */
export async function matchIngredients(
  supabase: SupabaseClient,
  itemNames: string[]
): Promise<MatchResult[]> {
  // 카탈로그 전체를 1회 조회
  const { data: catalog } = await supabase
    .from('ingredients_master')
    .select('id, name, name_en, name_ko, category')
    .eq('status', 'approved');

  const items = catalog || [];

  return itemNames.map(name => matchSingleInMemory(name, items));
}
