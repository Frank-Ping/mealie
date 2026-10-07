import { useTranslation } from "react-i18next";
import { Button, Card, Container, FormControlLabel, Grid, ToggleButtonGroup } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import type { Recipe } from "@/lib/api/types/recipe";
import { ImagePosition, useUserPrintPreferences } from "@/composables/use-users/preferences";
import RecipePrintView from "@/components/Domain/Recipe/RecipePrintView";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";

interface Props {
  recipe?: NoUndefinedField<Recipe>;
}

export default function RecipeDialogPrintPreferences({ recipe = undefined }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const dialog = defineModel<boolean>({ default: false });
  const preferences = useUserPrintPreferences();

  return (
    <>
  <BaseDialog value={dialog} onChange={/* WF4-REVIEW: setter */ setDialog} icon={$globals.icons.printerSettings} title={t('general.print-preferences')} width="70%" max-width="816px">
    <div className="pa-6">
      <Container className="print-config mb-3 pa-0">
        <Grid container>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols="auto" align-self="center" className="text-center">
            <div className="text-subtitle-2" style="text-align: center;">
              {t('recipe.recipe-image')}
            </div>
            {/* WF4-REVIEW: value/selection API; v-model on complex expression "preferences.imagePosition" [J] */}
            <ToggleButtonGroup {/* WF4-REVIEW: v-model preferences.imagePosition */} mandatory="force" style="width: fit-content;">
              <Button value={ImagePosition.left}>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={$globals.icons.dockLeft} />
              </Button>
              <Button value={ImagePosition.right}>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={$globals.icons.dockRight} />
              </Button>
              <Button value={ImagePosition.hidden}>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={$globals.icons.windowClose} />
              </Button>
            </ToggleButtonGroup>
          </Grid>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols="auto" align-self="start">
            <Grid container no-gutters>
              {/* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "preferences.showDescription" [J] */}
              <FormControlLabel {/* WF4-REVIEW: v-model preferences.showDescription */} hide-details color="primary" label={t('recipe.description')} />
            </Grid>
            <Grid container no-gutters>
              {/* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "preferences.showNotes" [J] */}
              <FormControlLabel {/* WF4-REVIEW: v-model preferences.showNotes */} hide-details color="primary" label={t('recipe.notes')} />
            </Grid>
          </Grid>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols="auto" align-self="start">
            <Grid container no-gutters>
              {/* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "preferences.showNutrition" [J] */}
              <FormControlLabel {/* WF4-REVIEW: v-model preferences.showNutrition */} hide-details color="primary" label={t('recipe.nutrition')} />
            </Grid>
            <Grid container no-gutters>
              {/* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "preferences.expandChildRecipes" [J] */}
              <FormControlLabel {/* WF4-REVIEW: v-model preferences.expandChildRecipes */} hide-details color="primary" label={t('recipe.include-linked-recipe-ingredients')} />
            </Grid>
          </Grid>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols="auto" align-self="start">
            <Grid container no-gutters>
              {/* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "preferences.showLinkedIngredients" [J] */}
              <FormControlLabel {/* WF4-REVIEW: v-model preferences.showLinkedIngredients */} hide-details color="primary" label={t('recipe.linked-ingredients')} />
            </Grid>
            <Grid container no-gutters>
              {/* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "preferences.showSubstitutions" [J] */}
              <FormControlLabel {/* WF4-REVIEW: v-model preferences.showSubstitutions */} hide-details color="primary" label={t('recipe.substitutions')} />
            </Grid>
          </Grid>
        </Grid>
      </Container>
      <Card height="fit-content" max-height="40vh" width="100%" className="print-preview" style="overflow-y: auto;">
        <RecipePrintView recipe={recipe} />
      </Card>
    </div>
  </BaseDialog>
    </>
  );
}
