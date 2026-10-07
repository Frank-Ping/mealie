import { useTranslation } from "react-i18next";
import { Chip, FormControlLabel } from "@mui/material";

export default function ParseDialogInfo() {
  const { t } = useTranslation();

  const dontShowAgain = defineModel<boolean>({ default: true });
  defineProps<{
    autoParsed: number;
    toReview: number;
  }>();

  return (
    <>
  {/* WF4-REVIEW: unmapped <v-empty-state> — judgement component, convert manually [J] */}
  <VEmptyState color="success" icon={$globals.icons.progressCheck} headline={t('recipe.parser.ingredient-parser-headline')}>
    <div className="d-flex ga-2 flex-column">
      <h3 className="my-0">
        {t("recipe.parser.ingredient-parser-title")}
      </h3>
      <p>
        {t("recipe.parser.ingredient-parser-description")}
      </p>
      <p>
        {t("recipe.parser.ingredient-parser-final-review-description")}
      </p>
      <h3 className="mb-0">
        {t("recipe.parser.ingredient-parser-result-title")}
      </h3>
      <div className="d-flex ga-2 flex-wrap">
        {(autoParsed) ? (
          <Chip size="large" color="success" prepend-icon={$globals.icons.checkboxMarkedCircle}>
            {t("recipe.parser.ingredient-parser-result-success", autoParsed)}
          </Chip>
        ) : null}
        <Chip size="large" color="warning" prepend-icon={$globals.icons.alert}>
          {t("recipe.parser.ingredient-parser-result-failed", toReview)}
        </Chip>
      </div>
    </div>
  </VEmptyState>
  {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
  <FormControlLabel value={dontShowAgain} onChange={/* WF4-REVIEW: setter */ setDontShowAgain} className="ml-3" hide-details density="compact" label={t('recipe.parser.dont-show-again')} />
    </>
  );
}
