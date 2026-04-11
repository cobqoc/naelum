import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://naelum.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Fetch all public recipe IDs
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, updated_at')
    .eq('is_public', true)
    .eq('is_published', true)
    .order('updated_at', { ascending: false });

  // Fetch all public user profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1000);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/recipes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
  ];

  const recipePages: MetadataRoute.Sitemap = (recipes || []).map((recipe) => ({
    url: `${BASE_URL}/recipes/${recipe.id}`,
    lastModified: new Date(recipe.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const profilePages: MetadataRoute.Sitemap = (profiles || []).map((profile) => ({
    url: `${BASE_URL}/@${profile.username}`,
    lastModified: new Date(profile.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...recipePages, ...profilePages];
}
