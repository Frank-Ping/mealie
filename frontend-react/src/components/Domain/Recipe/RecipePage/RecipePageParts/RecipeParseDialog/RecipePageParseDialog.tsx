import { useTranslation } from "react-i18next";
import { Container } from "@mui/material";
import { ParseStep, useParseIngredientsDialog } from "@/composables/recipes/use-parse-ingredients-dialog";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { RecipeIngredient } from "@/lib/api/types/recipe";

export default function RecipePageParseDialog() {
  const { t } = useTranslation();

  const props = defineProps<{
    modelValue: boolean;
    ingredients: NoUndefinedField<RecipeIngredient[]>;
  }>();

  const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "save", value: NoUndefinedField<RecipeIngredient[]>): void;
  }>();

  const dialogState = useParseIngredientsDialog(props.ingredients, ings => emit("save", ings));

  const {
    availableParsers,
    parser,
    showNlpLanguageHint,
    dontShowInfoPage,
    parsedIngs,
    currentIng,
    currentIngShouldDelete,
    state,
    autoParsedIngredientsCount,
    ingredientsToReviewCount,
    nextStep,
    saveIngs,
    nextIngredient,
    parseIngredients,
  } = dialogState;

  /* WF4-REVIEW [J] */ watch(() => props.modelValue, () => {
    if (!props.modelValue) {
      return;
    }

    parseIngredients();
  });

  return (
    <>
  <BaseDialog model-value={modelValue} title={t('recipe.parse-ingredients')} icon={$globals.icons.fileSign} disable-submit-on-enter onUpdateModelValue={emit('update:modelValue', $event)}>
    <Container fluid className="pa-2 ma-0">
      <SwipeTransition direction="left">
        {(state.step === ParseStep.LOADING) ? (
          <div>
            <AppLoader className="my-6" waiting-text={t('recipe.parser.parsing-ingredients')} />
          </div>
        ) : (state.step === ParseStep.INFO) ? (
          <div>
            <ParseDialogInfo value={dontShowInfoPage} onChange={/* WF4-REVIEW: setter */ setDontShowInfoPage} auto-parsed={autoParsedIngredientsCount} to-review={ingredientsToReviewCount} />
          </div>
        ) : (state.step === ParseStep.PARSE && currentIng) ? (
          <div key={currentIng.ingredient.referenceId}>
            <ParseDialogParse dialog-state={dialogState} />
          </div>
        ) : (
          <div>
            <ParseDialogReview value={parsedIngs} onChange={/* WF4-REVIEW: setter */ setParsedIngs} available-parsers={availableParsers} parser={parser} show-nlp-language-hint={showNlpLanguageHint} onParse={parseIngredients} onChangeParser={(newParser) => parser = newParser} />
          </div>
        )}
      </SwipeTransition>
    </Container>
    {(state.step !== ParseStep.LOADING) ? (
      <template>
        <SwipeTransition direction="left">
          {(state.step === ParseStep.INFO) ? (
            <BaseButton color="info" icon-right icon={$globals.icons.arrowRightBold} text={t('general.next')} onClick={nextStep} />
          ) : (state.step === ParseStep.PARSE) ? (
            <BaseButton color={currentIngShouldDelete ? 'error' : 'info'} icon={currentIngShouldDelete ? $globals.icons.delete : $globals.icons.arrowRightBold} icon-right={!currentIngShouldDelete} text={t(currentIngShouldDelete ? 'recipe.parser.delete-item' : 'general.next')} onClick={nextIngredient} />
          ) : (state.step === ParseStep.REVIEW) ? (
            <BaseButton create text={t('general.save')} icon={$globals.icons.save} loading={state.saveLoading} onClick={saveIngs} />
          ) : null}
        </SwipeTransition>
      </template>
    ) : null}
  </BaseDialog>
    </>
  );
}
