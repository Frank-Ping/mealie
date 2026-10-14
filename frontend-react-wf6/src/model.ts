import type { RecipeIngredient } from '../../frontend/app/lib/api/types/recipe.ts';

export function ingredientText(ingredient: RecipeIngredient): string {
  if (ingredient.display?.trim()) return ingredient.display;
  if (ingredient.originalText?.trim()) return ingredient.originalText;
  return [ingredient.quantity == null || ingredient.quantity === 0 ? '' : String(ingredient.quantity), ingredient.unit?.name, ingredient.food?.name, ingredient.note].filter(Boolean).join(' ');
}

export function recipeLink(group: string, slug: string): string {
  return `/g/${encodeURIComponent(group)}/r/${encodeURIComponent(slug)}`;
}
