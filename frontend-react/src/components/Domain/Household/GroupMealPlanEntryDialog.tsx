import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, CardContent, FormControlLabel, Grid, TextField, ToggleButtonGroup } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { format } from "date-fns";
import RecipeSelector from "@/components/Domain/Recipe/RecipeSelector";
import { usePlanTypeOptions } from "@/composables/use-group-mealplan";
import { buildRuleQueryFilter, useMealplanRules } from "@/composables/use-mealplan-rules";
import { validators } from "@/composables/use-validators";
import type { CreatePlanEntry, PlanEntryType, ReadPlanEntry, UpdatePlanEntry } from "@/lib/api/types/meal-plan";
import type { RecipeSummary } from "@/lib/api/types/recipe";

interface Props {
  entry?: ReadPlanEntry | null;
  date?: Date | null;
}

export default function GroupMealPlanEntryDialog({ entry = null, date = null }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const emit = defineEmits<{
    create: [payload: CreatePlanEntry];
    update: [payload: UpdatePlanEntry];
  }>();

  const dialog = defineModel<boolean>({ required: true });

  const { rules } = useMealplanRules();
  const planTypeOptions = usePlanTypeOptions();

  const selector = ref<InstanceType<typeof RecipeSelector> | null>(null);

  const [entryMode, setEntryMode] = useState("recipe");
  const [selectedDate, setSelectedDate] = useState(new Date(););
  const [entryType, setEntryType] = useState("dinner");
  const [recipe, setRecipe] = useState(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [ignoreRules, setIgnoreRules] = useState(false);

  const isRecipe = useMemo(() => setEntryMode(== "recipe", [])); // WF4-REVIEW: dependency array

  const applicableRuleFilter = useMemo(() => buildRuleQueryFilter(rules, selectedDate, entryType, []); // WF4-REVIEW: dependency array);
  const ruleQueryFilter = useMemo(() => ignoreRules ? null : applicableRuleFilter, []); // WF4-REVIEW: dependency array

  const submitDisabled = useMemo(() => isRecipe ? !recipe : !title.trim(, []); // WF4-REVIEW: dependency array);

  function parseEntryDate(date: string) {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function initialize() {
    setEntryMode(entry && !entry.recipeId ? "note" : "recipe");
    setSelectedDate(entry ? parseEntryDate(entry.date) : date ?? new Date());
    setEntryType(entry?.entryType ?? "dinner");
    setRecipe(entry?.recipe ?? null);
    setTitle(entry?.title ?? "");
    setText(entry?.text ?? "");
    setIgnoreRules(false);
    selector?.reset();
  }

  function submit() {
    const payload = {
      date: format(selectedDate, "yyyy-MM-dd"),
      entryType: entryType,
      title: isRecipe ? "" : title,
      text: isRecipe ? "" : text,
      recipeId: isRecipe ? recipe?.id : null,
    };

    if (entry) {
      emit("update", {
        ...payload,
        id: entry.id,
        groupId: entry.groupId,
        userId: entry.userId,
      });
    }
    else {
      emit("create", payload);
    }
  }

  /* WF4-REVIEW [J] */ watch(dialog, (isOpen) => {
    if (isOpen) {
      initialize();
    }
  });

  return (
    <>
  <BaseDialog value={dialog} onChange={/* WF4-REVIEW: setter */ setDialog} title={entry ? t('meal-plan.update-this-meal-plan') : t('meal-plan.create-a-new-meal-plan')} submit-text={entry ? t('general.update') : t('general.create')} icon={$globals.icons.foods} submit-disabled={submitDisabled} color="primary" width="1000" can-submit disable-submit-on-enter onSubmit={submit}>
    <CardContent>
      <Grid container>
        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
        <Grid cols="12" md="5">
          {/* WF4-REVIEW: value/selection API */}
          <ToggleButtonGroup value={entryMode} onChange={setEntryMode} mandatory divided variant="outlined" color="primary" className="w-100 mb-4">
            <Button value="recipe" className="flex-grow-1">
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={$globals.icons.silverwareForkKnife} />
              {t("general.recipe")}
            </Button>
            <Button value="note" className="flex-grow-1">
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={$globals.icons.textBox} />
              {t("meal-plan.note")}
            </Button>
          </ToggleButtonGroup>
          <MealPlanDatePicker value={selectedDate} onChange={setSelectedDate} entry-type={entryType} />
          {/* WF4-REVIEW: items/item-title/item-value → MenuItem children */}
          <TextField select value={entryType} onChange={setEntryType} className="mt-4" items={planTypeOptions} label={t('recipe.entry-type')} item-title="text" item-value="value" return-object={false} hide-details />
        </Grid>
        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
        <Grid cols="12" md="7" className="entry-detail">
          {(isRecipe) ? (
            <RecipeSelector ref="selector" value={recipe} onChange={setRecipe} height="auto" query-filter={ruleQueryFilter}>
              <template>
                {/* WF4-REVIEW: control={<Switch/>} + label prop */}
                <FormControlLabel value={ignoreRules} onChange={setIgnoreRules} className="ignore-rules-switch flex-grow-0 ms-auto" color="primary" density="compact" hide-details disabled={!applicableRuleFilter} label={t('meal-plan.ignore-rules')} />
              </template>
              <template>
                {(ruleQueryFilter) ? (
                  <Alert type="info" variant="tonal">
                    <div>
                      {t("meal-plan.no-recipes-match-your-rules")}
                    </div>
                    <Button className="mt-2" size="small" color="info" variant="tonal" onClick={ignoreRules = true}>
                      {t("meal-plan.ignore-rules")}
                    </Button>
                  </Alert>
                ) : (
                  <Alert type="info" variant="tonal" text={t('search.no-results')} />
                )}
              </template>
            </RecipeSelector>
          ) : (
            <div>
              {/* WF4-REVIEW: rules/error-messages → error+helperText */}
              <TextField value={title} onChange={setTitle} label={t('meal-plan.meal-title')} rules={[validators.required]} />
              <TextField multiline value={text} onChange={setText} label={t('meal-plan.meal-note')} rows="6" />
            </div>
          )}
        </Grid>
      </Grid>
    </CardContent>
  </BaseDialog>
    </>
  );
}
