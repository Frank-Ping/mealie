import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useStaticRoutes, useUserApi } from "@/composables/api";
import type { HouseholdSummary } from "@/lib/api/types/household";
import { usePageState, usePageUser } from "@/composables/recipe-page/shared-state";
import type { Recipe } from "@/lib/api/types/recipe";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";

interface Props {
  recipe: NoUndefinedField<Recipe>;
  maxWidth?: string;
}

export default function RecipePageInfoCardImage({ maxWidth = undefined }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const display = useDisplay();
  const { recipeImage, recipeSmallImage } = useStaticRoutes();
  const { imageKey } = usePageState(recipe.slug);
  const { user } = usePageUser();

  const [recipeHousehold, setRecipeHousehold] = useState(undefined);
  if (user) {
    const userApi = useUserApi();
    userApi.households.getOne(recipe.householdId).then(({ data }) => {
      setRecipeHousehold(data || undefined);
    });
  }

  const [hideImage, setHideImage] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  function openLightbox() {
    if (hideImage) {
      return;
    }
    setLightboxOpen(true);
  }

  const imageHeight = computed(() => {
    return display.xs ? "200" : "400";
  });

  const recipeFullImageUrl = useMemo(() =>  {
    return recipeImage(recipe.id, recipe.image, imageKey, []); // WF4-REVIEW: dependency array
  });

  const recipeImageUrl = useMemo(() =>  {
    return display.smAndDown
      ? recipeSmallImage(recipe.id, recipe.image, imageKey, []); // WF4-REVIEW: dependency array
      : recipeFullImageUrl;
  });

  /* WF4-REVIEW [J] */ watch(
    () => recipeImageUrl,
    () => {
      setHideImage(false);
    },
  );

  return (
    <>
  {/* WF4-REVIEW: cover → objectFit */}
  <Box component="img" key={imageKey} max-width={maxWidth} min-height="50" cover width="100%" height={hideImage ? undefined : imageHeight} src={recipeImageUrl} className="d-print-none" style={hideImage ? undefined : 'cursor: zoom-in'} {...($attrs)} onError={hideImage = true} onClick={openLightbox} />
  {(lightboxOpen) ? (
    <RecipeImageLightbox value={lightboxOpen} onChange={setLightboxOpen} image-url={recipeFullImageUrl} image-alt={recipe.name} />
  ) : null}
    </>
  );
}
