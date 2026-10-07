import { Grid } from "@mui/material";
import type { PlanEntryType } from "@/lib/api/types/meal-plan";
import { usePlanTypeOptions } from "@/composables/use-group-mealplan";

export default function MealPlanLayout() {
  defineProps<{
    mealplans: MealsByDate[];
  }>();
  const planTypeOptions = usePlanTypeOptions();

  function getDay(day: MealsByDate): Days {
    const forSection = (key: PlanEntryType) => day.meals.filter(({ entryType }) => entryType === key);
    return {
      date: day.date,
      sections: planTypeOptions
        .map(({ text, value }) => ({ title: text, meals: forSection(value) }))
        .filter(({ meals }) => meals.length > 0),
      recipes: day.meals.flatMap(({ recipe }) => recipe ? [recipe] : []),
    };
  }

  return (
    <>
  <Grid container>
    {mealplans.map((plan, index) => (
      /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
      <Grid key={index} cols="12" sm="12" md="12" lg="6" xl="4" xxl="4" className="col-borders my-1 d-flex flex-column">
        <slot {...({ plan, index, day: getDay(plan) })} />
      </Grid>
    ))}
  </Grid>
    </>
  );
}
