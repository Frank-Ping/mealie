import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import { usePageState } from "@/composables/recipe-page/shared-state";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { Recipe } from "@/lib/api/types/recipe";
import RecipeOrganizerSelector from "@/components/Domain/Recipe/RecipeOrganizerSelector";
import RecipeNutrition from "@/components/Domain/Recipe/RecipeNutrition";
import RecipeChips from "@/components/Domain/Recipe/RecipeChips";
import RecipeAssets from "@/components/Domain/Recipe/RecipeAssets";

export default function RecipePageOrganizers() {
  const { t } = useTranslation();

  const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
  const { isEditForm } = usePageState(recipe.slug);

  return (
    <>
  <div>
    {(recipe.recipeCategory.length > 0 || isEditForm) ? (
      <Card className={{ 'mt-10': !isEditForm }}>
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="py-2">
          {t("recipe.categories")}
        </CardHeader>
        <Divider className="mx-2" />
        <CardContent>
          {(isEditForm) ? (
            /* WF4-REVIEW: v-model on complex expression "recipe.recipeCategory" [J] */
            <RecipeOrganizerSelector {/* WF4-REVIEW: v-model recipe.recipeCategory */} return-object={true} show-add={true} selector-type="categories" />
          ) : (
            <RecipeChips items={recipe.recipeCategory} {...($attrs)} />
          )}
        </CardContent>
      </Card>
    ) : null}
    {(recipe.tags.length > 0 || isEditForm) ? (
      <Card className="mt-4">
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="py-2">
          {t("tag.tags")}
        </CardHeader>
        <Divider className="mx-2" />
        <CardContent>
          {(isEditForm) ? (
            /* WF4-REVIEW: v-model on complex expression "recipe.tags" [J] */
            <RecipeOrganizerSelector {/* WF4-REVIEW: v-model recipe.tags */} return-object={true} show-add={true} selector-type="tags" />
          ) : (
            <RecipeChips items={recipe.tags} url-prefix="tags" {...($attrs)} />
          )}
        </CardContent>
      </Card>
    ) : null}
    {(isEditForm) ? (
      <Card className="mt-4">
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="py-2">
          {t('tool.required-tools')}
        </CardHeader>
        <Divider className="mx-2" />
        <CardContent>
          {/* WF4-REVIEW: v-model on complex expression "recipe.tools" [J] */}
          <RecipeOrganizerSelector {/* WF4-REVIEW: v-model recipe.tools */} selector-type="tools" />
        </CardContent>
      </Card>
    ) : null}
    {(recipe.settings.showNutrition) ? (
      /* WF4-REVIEW: v-model on complex expression "recipe.nutrition" [J] */
      <RecipeNutrition {/* WF4-REVIEW: v-model recipe.nutrition */} className="mt-4" edit={isEditForm} />
    ) : null}
    {(recipe.settings.showAssets) ? (
      /* WF4-REVIEW: v-model on complex expression "recipe.assets" [J] */
      <RecipeAssets {/* WF4-REVIEW: v-model recipe.assets */} edit={isEditForm} slug={recipe.slug} recipe-id={recipe.id} />
    ) : null}
  </div>
    </>
  );
}
