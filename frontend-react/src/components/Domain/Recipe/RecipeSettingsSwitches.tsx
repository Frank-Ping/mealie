import { useTranslation } from "react-i18next";
import { FormControlLabel } from "@mui/material";
import type { RecipeSettings } from "@/lib/api/types/recipe";
import { useI18n } from "#imports";

export default function RecipeSettingsSwitches() {
  const { t } = useTranslation();

  defineProps<{ isOwner?: boolean }>();

  const model = defineModel<RecipeSettings>({ required: true });

  const { i18n } = useTranslation();
  const labels: Record<keyof RecipeSettings, string> = {
    public: i18n.t("recipe.public-recipe"),
    showNutrition: i18n.t("recipe.show-nutrition-values"),
    showAssets: i18n.t("asset.show-assets"),
    landscapeView: i18n.t("recipe.landscape-view-coming-soon"),
    disableComments: i18n.t("recipe.disable-comments"),
    locked: i18n.t("recipe.locked"),
  };

  return (
    <>
  <div>
    {model.map((_, key) => (
      /* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "model[key]" [J] */
      <FormControlLabel key={key} color="primary" xs density="compact" disabled={key == 'locked' && !isOwner} className="my-1" label={labels[key]} hide-details />
    ))}
  </div>
    </>
  );
}
