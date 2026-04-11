interface RecipeJsonLdProps {
  title: string;
  description: string;
  imageUrl?: string | null;
  authorName: string;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  rating: number;
  ratingsCount: number;
  ingredients: string[];
  steps: string[];
}

export default function RecipeJsonLd({
  title,
  description,
  imageUrl,
  authorName,
  prepTime,
  cookTime,
  servings,
  rating,
  ratingsCount,
  ingredients,
  steps,
}: RecipeJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: title,
    description,
    ...(imageUrl && { image: imageUrl }),
    author: { '@type': 'Person', name: authorName },
    ...(prepTime != null && { prepTime: `PT${prepTime}M` }),
    ...(cookTime != null && { cookTime: `PT${cookTime}M` }),
    ...((prepTime != null || cookTime != null) && { totalTime: `PT${(prepTime || 0) + (cookTime || 0)}M` }),
    ...(servings && { recipeYield: `${servings}인분` }),
    recipeIngredient: ingredients,
    recipeInstructions: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: step,
    })),
    ...(ratingsCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.toFixed(1),
        ratingCount: ratingsCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
