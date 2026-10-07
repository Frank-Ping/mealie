import { useMemo } from "react";
import { Card, CardContent, CardHeader, Container, Divider, Grid } from "@mui/material";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import RecipeRating from "@/components/Domain/Recipe/RecipeRating";
import RecipeLastMade from "@/components/Domain/Recipe/RecipeLastMade";
import RecipeTimeCard from "@/components/Domain/Recipe/RecipeTimeCard";
import RecipeYield from "@/components/Domain/Recipe/RecipeYield";
import RecipePageInfoCardImage from "@/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageInfoCardImage";
import type { Recipe } from "@/lib/api/types/recipe";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";

interface Props {
  recipe: NoUndefinedField<Recipe>;
  recipeScale?: number;
  landscape: boolean;
}

export default function RecipePageInfoCard({ recipeScale = 1 }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const { isOwnGroup } = useLoggedInState();

  const hasTime = useMemo(() => {
    const { prepTime, totalTime, performTime, prepTimeSeconds, totalTimeSeconds, performTimeSeconds } = recipe;
    return [prepTime, totalTime, performTime, prepTimeSeconds, totalTimeSeconds, performTimeSeconds].some(x => !!x);
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  <div>
    <div className="d-flex justify-end flex-wrap align-stretch">
      {(landscape && recipe.image) ? (
        <RecipePageInfoCardImage recipe={recipe} />
      ) : null}
      <Card width={landscape || !recipe.image ? '100%' : '50%'} flat className="d-flex flex-column justify-center align-center">
        <CardContent>
          <div className="d-flex flex-column align-center">
            {/* WF4-REVIEW: title text moves to the title prop */}
            <CardHeader className="text-h5 font-weight-regular pa-0 text-wrap text-center opacity-80">
              {recipe.name}
            </CardHeader>
            <RecipeRating key={recipe.slug} model-value={recipe.rating} recipe-id={recipe.id} slug={recipe.slug} />
          </div>
          <Divider className="my-2" />
          <SafeMarkdown source={recipe.description} className="my-3" />
          {(recipe.description) ? (
            <Divider />
          ) : null}
          <Container className="d-flex flex-row flex-wrap justify-center">
            <div className="mx-6">
              <Grid container no-gutters>
                {(recipe.recipeYieldQuantity || recipe.recipeYield) ? (
                  /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
                  <Grid cols="12" className="d-flex flex-wrap justify-center">
                    <RecipeYield yield-quantity={recipe.recipeYieldQuantity} yield-text={recipe.recipeYield} scale={recipeScale} className="mb-4" />
                  </Grid>
                ) : null}
              </Grid>
              <Grid container no-gutters>
                {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                <Grid cols="12" className="d-flex flex-wrap justify-center">
                  {(isOwnGroup) ? (
                    <RecipeLastMade recipe={recipe} className="mb-4" />
                  ) : null}
                </Grid>
              </Grid>
            </div>
            {(hasTime) ? (
              <div className="mx-6">
                <RecipeTimeCard container-class="d-flex flex-wrap justify-center" prep-time={recipe.prepTime} total-time={recipe.totalTime} perform-time={recipe.performTime} prep-time-seconds={recipe.prepTimeSeconds} total-time-seconds={recipe.totalTimeSeconds} perform-time-seconds={recipe.performTimeSeconds} className="mb-4" />
              </div>
            ) : null}
          </Container>
        </CardContent>
      </Card>
      {(!landscape && recipe.image) ? (
        <RecipePageInfoCardImage recipe={recipe} max-width="50%" className="my-auto" />
      ) : null}
    </div>
  </div>
    </>
  );
}
