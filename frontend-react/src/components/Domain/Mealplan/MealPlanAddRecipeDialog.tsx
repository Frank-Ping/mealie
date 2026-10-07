import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CardContent, TextField } from "@mui/material";
import { useUserApi } from "@/composables/api";
import { alert } from "@/composables/use-toast";
import type { PlanEntryType } from "@/lib/api/types/meal-plan";
import { usePlanTypeOptions } from "@/composables/use-group-mealplan";

export default function MealPlanAddRecipeDialog() {
  const { t } = useTranslation();

  const props = defineProps<{
    recipeId: string;
  }>();

  const mealplannerDialog = defineModel<boolean>({
    default: false,
  });

  const i18n = useI18n();
  const api = useUserApi();
  const planTypeOptions = usePlanTypeOptions();
  const navigate = useNavigate();

  const [newMealType, setNewMealType] = useState("dinner");
  const [newMealdate, setNewMealdate] = useState(new Date(););

  const newMealdateString = useMemo(() =>  {
    // Format the date to YYYY-MM-DD in the same timezone as newMealdate
    const year = newMealdate.getFullYear(, []); // WF4-REVIEW: dependency array
    const month = String(newMealdate.getMonth() + 1).padStart(2, "0");
    const day = String(newMealdate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  async function addRecipeToPlan() {
    const { response } = await api.mealplans.createOne({
      date: newMealdateString,
      entryType: newMealType,
      title: "",
      text: "",
      recipeId: props.recipeId,
    });

    if (response?.status === 201) {
      alert.success(i18n.t("recipe.recipe-added-to-mealplan"), null, {
        action: {
          message: i18n.t("general.view"),
          onClick: () => navigate("/household/mealplan/planner/view"),
        },
      });
    }
    else {
      alert.error(i18n.t("recipe.failed-to-add-recipe-to-mealplan"));
    }
  }

  return (
    <>
  <BaseDialog value={mealplannerDialog} onChange={/* WF4-REVIEW: setter */ setMealplannerDialog} bottom-sheet title={t('recipe.add-recipe-to-mealplan')} color="primary" icon={$globals.icons.calendar} can-confirm onConfirm={addRecipeToPlan}>
    <CardContent>
      <MealPlanDatePicker value={newMealdate} onChange={setNewMealdate} entry-type={newMealType} />
      {/* WF4-REVIEW: items/item-title/item-value → MenuItem children */}
      <TextField select value={newMealType} onChange={setNewMealType} return-object={false} items={planTypeOptions} label={t('recipe.entry-type')} item-title="text" item-value="value" />
    </CardContent>
  </BaseDialog>
    </>
  );
}
