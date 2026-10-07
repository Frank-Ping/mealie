import { useTranslation } from "react-i18next";
import { Box, CardActions, CardContent, FormControlLabel } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import type { useParseIngredientsDialog } from "@/composables/recipes/use-parse-ingredients-dialog";

export default function ParseDialogParse() {
  const { t } = useTranslation();

  const props = defineProps<{
    dialogState: ReturnType<typeof useParseIngredientsDialog>;
  }>();

  const {
    state,
    currentIng,
    showNlpLanguageHint,
    availableParsers,
    currentIngShouldDelete,
    parser,
    confidenceThreshold,
    currentIngHasError,
    currentMissingFood,
    currentMissingUnit,
    parseIngredients,
    createMissingFood,
    createMissingUnit,
    addMissingFoodAsAlias,
    addMissingUnitAsAlias,
  } = props.dialogState;

  function asPercentage(num: number | undefined): string {
    if (!num) {
      return "0%";
    }

    return Math.round(num * 100).toFixed(2) + "%";
  }

  return (
    <>
  <ParseDialogChangeParser value={parser} onChange={/* WF4-REVIEW: setter */ setParser} available-parsers={availableParsers} show-nlp-language-hint={showNlpLanguageHint} onUpdateModelValue={(newParser) => parser = newParser} onParse={parseIngredients} />
  {(currentIng) ? (
    <CardContent className="pb-0 mb-0 d-flex flex-column ga-2">
      <div className="text-center px-8 py-4 mb-6 bg-background-darken-1 rounded-pill">
        <p className="text-h5 font-italic">
          {currentIng.input}
        </p>
      </div>
      <div className="d-flex align-center pa-0 ma-0">
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={(currentIng.confidence?.average || 0) < confidenceThreshold ? $globals.icons.alert : $globals.icons.check} color={(currentIng.confidence?.average || 0) < confidenceThreshold ? 'error' : 'success'} />
        <span className="ml-2" color={currentIngHasError ? 'error-text' : 'success-text'}>
          {t("recipe.parser.confidence-score")}
          :
          {currentIng.confidence ? asPercentage(currentIng.confidence?.average!) : ""}
        </span>
      </div>
      {/* WF4-REVIEW: v-model on complex expression "currentIng.ingredient" [J] */}
      <RecipeIngredientEditor {/* WF4-REVIEW: v-model currentIng.ingredient */} unit-error={!!currentMissingUnit} unit-error-tooltip={t('recipe.parser.this-unit-could-not-be-parsed-automatically')} food-error={!!currentMissingFood} food-error-tooltip={t('recipe.parser.this-food-could-not-be-parsed-automatically')} />
      <CardActions className="flex-wrap">
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={currentIngShouldDelete} onChange={/* WF4-REVIEW: setter */ setCurrentIngShouldDelete} color="error" hide-details density="compact" className="mt-8" label={t('recipe.parser.delete-item')} />
        <Box sx={ flexGrow: 1 } />
        {(currentMissingUnit && !currentIng.ingredient.unit?.id) ? (
          <BaseButton icon={$globals.icons.units} color="warning" size="small" loading={state.loading.unit} onClick={createMissingUnit}>
            {t("recipe.parser.missing-unit", { unit: currentMissingUnit })}
          </BaseButton>
        ) : null}
        {(currentMissingUnit
            && currentIng.ingredient.unit?.id
            && currentMissingUnit.toLowerCase() != currentIng.ingredient.unit?.name.toLowerCase()) ? (
          <BaseButton icon={$globals.icons.units} color="warning" size="small" loading={state.loading.unit} onClick={addMissingUnitAsAlias}>
            {t("recipe.parser.add-text-as-alias-for-item", { text: currentMissingUnit, item: currentIng.ingredient.unit.name })}
          </BaseButton>
        ) : null}
        {(currentMissingFood && !currentIng.ingredient.food?.id) ? (
          <BaseButton icon={$globals.icons.foods} color="warning" size="small" loading={state.loading.food} onClick={createMissingFood}>
            {t("recipe.parser.missing-food", { food: currentMissingFood })}
          </BaseButton>
        ) : null}
        {(currentMissingFood
            && currentIng.ingredient.food?.id
            && currentMissingFood.toLowerCase() != currentIng.ingredient.food?.name.toLowerCase()) ? (
          <BaseButton icon={$globals.icons.foods} color="warning" size="small" loading={state.loading.food} onClick={addMissingFoodAsAlias}>
            {t("recipe.parser.add-text-as-alias-for-item", { text: currentMissingFood, item: currentIng.ingredient.food.name })}
          </BaseButton>
        ) : null}
      </CardActions>
    </CardContent>
  ) : null}
    </>
  );
}
