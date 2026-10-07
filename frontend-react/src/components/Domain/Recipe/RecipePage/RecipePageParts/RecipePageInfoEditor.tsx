import { useTranslation } from "react-i18next";
import { Container, Grid, TextField } from "@mui/material";
import RecipeTimeInput from "@/components/Domain/Recipe/RecipeTimeInput";
import { validators } from "@/composables/use-validators";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { Recipe } from "@/lib/api/types/recipe";

export default function RecipePageInfoEditor() {
  const { t } = useTranslation();

  const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });

  return (
    <>
  <div>
    {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "recipe.name" [J] */}
    <TextField className="my-3" label={t('recipe.recipe-name')} rules={[validators.required]} density="compact" variant="underlined" />
    <Container className="ma-0 pa-0">
      <Grid container>
        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
        <Grid cols="3">
          {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */}
          <VNumberInput model-value={recipe.recipeServings} min={0} precision={null} density="compact" label={t('recipe.servings')} variant="underlined" control-variant="hidden" onUpdateModelValue={recipe.recipeServings = $event} />
        </Grid>
        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
        <Grid cols="3">
          {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */}
          <VNumberInput model-value={recipe.recipeYieldQuantity} min={0} precision={null} density="compact" label={t('recipe.yield')} variant="underlined" control-variant="hidden" onUpdateModelValue={recipe.recipeYieldQuantity = $event} />
        </Grid>
        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
        <Grid cols="6">
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "recipe.recipeYield" [J] */}
          <TextField density="compact" label={t('recipe.yield-text')} variant="underlined" />
        </Grid>
      </Grid>
    </Container>
    {/* WF4-REVIEW: v-model on complex expression "recipe.totalTimeSeconds" [J]; v-model on complex expression "recipe.totalTime" [J] */}
    <RecipeTimeInput label={t('recipe.total-time')} />
    {/* WF4-REVIEW: v-model on complex expression "recipe.prepTimeSeconds" [J]; v-model on complex expression "recipe.prepTime" [J] */}
    <RecipeTimeInput label={t('recipe.prep-time')} />
    {/* WF4-REVIEW: v-model on complex expression "recipe.performTimeSeconds" [J]; v-model on complex expression "recipe.performTime" [J] */}
    <RecipeTimeInput label={t('recipe.perform-time')} />
    {/* WF4-REVIEW: v-model on complex expression "recipe.description" [J] */}
    <TextField multiline auto-grow min-height="100" label={t('recipe.description')} density="compact" variant="underlined" />
  </div>
    </>
  );
}
