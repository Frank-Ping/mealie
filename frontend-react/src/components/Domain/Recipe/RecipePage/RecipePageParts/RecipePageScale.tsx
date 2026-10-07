import { useMemo } from "react";
import RecipeScaleEditButton from "@/components/Domain/Recipe/RecipeScaleEditButton";
import RecipeUnitSystemButton from "@/components/Domain/Recipe/RecipeUnitSystemButton";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { Recipe } from "@/lib/api/types/recipe";
import { usePageState } from "@/composables/recipe-page/shared-state";

export default function RecipePageScale() {
  const props = defineProps<{ recipe: NoUndefinedField<Recipe> }>();

  const scale = defineModel<number>({ default: 1 });

  const { isEditMode } = usePageState(props.recipe.slug);

  const recipeServings = useMemo(() => {
    return props.recipe.recipeServings || props.recipe.recipeYieldQuantity || 1;
  }, []); // WF4-REVIEW: dependency array

  const hasFoodOrUnit = useMemo(() => {
    if (props.recipe.recipeIngredient) {
      for (const ingredient of props.recipe.recipeIngredient) {
        if (ingredient.food || ingredient.unit) {
          return true;
        }
      }
    }
    return false;
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  <div className="d-flex align-center ga-2 pt-2 pb-3">
    {(!isEditMode) ? (
      <RecipeUnitSystemButton recipe={recipe} />
    ) : null}
    {(!isEditMode) ? (
      <RecipeScaleEditButton value={scale} onChange={/* WF4-REVIEW: setter */ setScale} recipe-servings={recipeServings} edit-scale={hasFoodOrUnit && !isEditMode} />
    ) : null}
  </div>
    </>
  );
}
