import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchAllRows } from '@/lib/supabase/fetchAll';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://naelum.app';

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
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/recipes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/tip`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/signin`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
  ];

  const recipePages: MetadataRoute.Sitemap = recipes.map((recipe) => ({
    url: `${BASE_URL}/recipes/${recipe.id}`,
    lastModified: new Date(recipe.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const profilePages: MetadataRoute.Sitemap = profiles
    .filter((profile) => profile.username)
    .map((profile) => ({
      url: `${BASE_URL}/@${profile.username}`,
      lastModified: new Date(profile.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

  return [...staticPages, ...recipePages, ...profilePages];
}
