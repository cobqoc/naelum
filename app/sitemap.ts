import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/supabase/fetchAll';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/locales';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://naelum.app';

// path-based i18n: 실제 URL은 항상 lang prefix 가 붙음(/ko/recipes/123). prefix 없는
// bare URL 은 proxy.ts 가 브라우저 언어 감지 후 redirect → hreflang x-default 에 적합.
// canonical(<loc>)은 기본 로케일(ko)로 통일하고, 8개 언어 전부를 alternate 로 노출.
const DEFAULT_LANG: (typeof SUPPORTED_LANGUAGES)[number] = 'ko';

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

/**
 * prefix 없는 경로 suffix('' | '/recipes/123' …)에 대해
 * 8개 언어 hreflang 맵 + x-default(언어 감지 bare URL) 생성.
 */
function languageAlternates(suffix: string): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const lang of SUPPORTED_LANGUAGES) {
    langs[lang] = `${BASE_URL}/${lang}${suffix}`;
  }
  langs['x-default'] = `${BASE_URL}${suffix || '/'}`;
  return langs;
}

function entry(
  suffix: string,
  opts: { lastModified?: Date; changeFrequency?: ChangeFreq; priority?: number },
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}/${DEFAULT_LANG}${suffix}`,
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages: languageAlternates(suffix) },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // 전체 행이 진짜 필요(SEO) — 1000행 silent 절단 시 색인 누락. fetchAllRows 로 끝까지.
  const recipes = await fetchAllRows<{ id: string; updated_at: string }>(
    () => supabase
      .from('recipes')
      .select('id, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false }),
  );

  const profiles = await fetchAllRows<{ username: string | null; created_at: string }>(
    () => supabase
      .from('profiles')
      .select('username, created_at')
      .order('created_at', { ascending: false }),
  );

  const staticPages: MetadataRoute.Sitemap = [
    entry('', { changeFrequency: 'daily', priority: 1 }),
    entry('/about', { changeFrequency: 'monthly', priority: 0.8 }),
    entry('/recipes', { changeFrequency: 'daily', priority: 0.9 }),
    entry('/tip', { changeFrequency: 'weekly', priority: 0.7 }),
    entry('/search', { changeFrequency: 'weekly', priority: 0.8 }),
    entry('/signin', { changeFrequency: 'monthly', priority: 0.3 }),
    entry('/signup', { changeFrequency: 'monthly', priority: 0.3 }),
    entry('/terms', { changeFrequency: 'yearly', priority: 0.1 }),
    entry('/privacy', { changeFrequency: 'yearly', priority: 0.1 }),
  ];

  const recipePages: MetadataRoute.Sitemap = recipes.map((recipe) =>
    entry(`/recipes/${recipe.id}`, {
      lastModified: new Date(recipe.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }),
  );

  const profilePages: MetadataRoute.Sitemap = profiles
    .filter((profile) => profile.username)
    .map((profile) =>
      entry(`/@${profile.username}`, {
        lastModified: new Date(profile.created_at),
        changeFrequency: 'weekly',
        priority: 0.5,
      }),
    );

  return [...staticPages, ...recipePages, ...profilePages];
}
