import { useMemo, useState } from "react";
import { Divider } from "@mui/material";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { useRecipePermissions } from "@/composables/recipes";
import RecipePageInfoCard from "@/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageInfoCard";
import RecipeActionMenu from "@/components/Domain/Recipe/RecipeActionMenu";
import { useStaticRoutes, useUserApi } from "@/composables/api";
import type { HouseholdSummary } from "@/lib/api/types/household";
import type { Recipe } from "@/lib/api/types/recipe";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import { usePageState, usePageUser, PageMode } from "@/composables/recipe-page/shared-state";

interface Props {
  recipe: NoUndefinedField<Recipe>;
  recipeScale?: number;
  landscape?: boolean;
  onSave?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onDelete?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onPrint?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onClose?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
}

export default function RecipePageHeader({ recipeScale = 1, landscape = false, onSave, onDelete, onPrint, onClose }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  /* emits → props: onSave, onDelete, onPrint, onClose */

  const { recipeImage } = useStaticRoutes();
  const { imageKey, setMode, toggleEditMode, isEditMode } = usePageState(recipe.slug);
  const { user } = usePageUser();
  const { isOwnGroup } = useLoggedInState();

  const [recipeHousehold, setRecipeHousehold] = useState(undefined);
  if (user) {
    const userApi = useUserApi();
    userApi.households.getOne(recipe.householdId).then(({ data }) => {
      setRecipeHousehold(data || undefined);
    });
  }
  const { canEditRecipe } = useRecipePermissions(recipe, recipeHousehold, user);

  function printRecipe() {
    window.print();
  }

  const [hideImage, setHideImage] = useState(false);

  const recipeImageUrl = useMemo(() =>  {
    return recipeImage(recipe.id, recipe.image, imageKey, []); // WF4-REVIEW: dependency array
  });

  /* WF4-REVIEW [J] */ watch(
    () => recipeImageUrl,
    () => {
      setHideImage(false);
    },
  );

  return (
    <>
  <div>
    <RecipePageInfoCard recipe={recipe} recipe-scale={recipeScale} landscape={landscape} />
    <Divider />
    <RecipeActionMenu recipe={recipe} slug={recipe.slug} recipe-scale={recipeScale} can-edit={canEditRecipe} name={recipe.name} logged-in={isOwnGroup} open={isEditMode} recipe-id={recipe.id} className="ml-auto mt-n7 pb-4" onClose={onClose?.()} onJson={toggleEditMode()} onEdit={setMode(PageMode.EDIT)} onSave={onSave?.()} onDelete={onDelete?.()} onPrint={printRecipe} />
  </div>
    </>
  );
}
