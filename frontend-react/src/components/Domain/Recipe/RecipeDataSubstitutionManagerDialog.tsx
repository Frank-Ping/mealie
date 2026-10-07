import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardContent, FormControlLabel } from "@mui/material";
import { icons } from "@/lib/icons";
import { whenever } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import RecipeIngredientSubstitutionEditor from "@/components/Domain/Recipe/RecipeIngredientSubstitutionEditor";
import { useFoodStore } from "@/composables/store";
import type { IngredientFood, IngredientFoodSubstitution } from "@/lib/api/types/recipe";

interface Props {
  data: IngredientFood;
}

interface SubstitutionRow {
  substituteFoodId: string | null;
  note: string;
  // null means "whatever the other food currently says"; a boolean is an explicit choice
  addReverse: boolean | null;
}

export interface ReverseSubstitutionChanges {
  add: string[];
  remove: string[];
}

export default function RecipeDataSubstitutionManagerDialog({ data }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature */

  const emit = defineEmits<{
    // reverse substitutions live on the other food, so the page writes them separately
    submit: [substitutions: IngredientFoodSubstitution[], reverseChanges: ReverseSubstitutionChanges];
    cancel: [];
  }>();

  // V-Model Support
  const dialog = defineModel<boolean>({ default: false });

  const { i18n } = useTranslation();
  const foodStore = useFoodStore();
  // a food cannot substitute for itself, so it is never offered
  const foodOptions = useMemo(() => foodStore.store.filter(food => food.id !== data.id), []); // WF4-REVIEW: dependency array

  const [substitutions, setSubstitutions] = useState([]);

  function substituteFood(substituteFoodId: string | null) {
    return substituteFoodId ? foodStore.store.find(food => food.id === substituteFoodId) : undefined;
  }

  // the reverse substitution lives on the other food, so it is read back off that food
  function reverseExists(substituteFoodId: string | null) {
    return !!substituteFood(substituteFoodId)?.substitutions?.some(sub => sub.substituteFoodId === data.id);
  }

  // the control is per-row because the dialog mixes saved and unsaved rows; a single checkbox
  // at the bottom couldn't say which of them it meant
  function reverseChecked(index: number) {
    const substitution = substitutions[index];
    return substitution ? (substitution.addReverse ?? reverseExists(substitution.substituteFoodId)) : false;
  }

  // echoes the "in place of" wording of the intro line, read backwards; the checkbox itself
  // carries whether the reverse is already there
  function reverseLabel(index: number) {
    const substitute = substituteFood(substitutions[index]?.substituteFoodId ?? null)?.name || "";
    return i18n.t("data-pages.foods.reverse-substitution-add", { food: data.name, substitute });
  }

  function setReverse(index: number, addReverse: boolean | null) {
    const substitution = substitutions[index];
    if (substitution) {
      substitution.addReverse = addReverse;
    }
  }

  function createSubstitution() {
    substitutions.push({
      substituteFoodId: null,
      note: "",
      addReverse: null,
    });
  }

  function deleteSubstitution(index: number) {
    substitutions.splice(index, 1);
  }

  // a row pointed at a different food has a different reverse to report on, so the choice made
  // about the previous one is dropped rather than carried over
  function resetReverse(index: number) {
    setReverse(index, null);
  }

  function initSubstitutions() {
    setSubstitutions((data.substitutions || []).map(substitution => ({
      substituteFoodId: substitution.substituteFoodId || null,
      note: substitution.note || "",
      addReverse: null,
    })));

    if (!substitutions.length) {
      createSubstitution();
    }
  }

  initSubstitutions();
  whenever(
    () => dialog,
    () => {
      initSubstitutions();
    },
  );

  function saveSubstitutions() {
    const seenFoodIds: string[] = [];
    const keepRows: SubstitutionRow[] = [];
    const keepSubstitutions: IngredientFoodSubstitution[] = [];
    const reverseChanges: ReverseSubstitutionChanges = { add: [], remove: [] };

    substitutions.forEach((substitution) => {
      const substituteFoodId = substitution.substituteFoodId || null;
      const note = (substitution.note || "").trim() || null;

      // an empty row is a UI artifact rather than something to save, matching the alias dialog
      if (!substituteFoodId && !note) {
        return;
      }

      if (substituteFoodId) {
        if (substituteFoodId === data.id || seenFoodIds.includes(substituteFoodId)) {
          return;
        }
        seenFoodIds.push(substituteFoodId);

        // only a row whose reverse differs from what the other food already has needs a write
        const exists = reverseExists(substituteFoodId);
        const wanted = substitution.addReverse ?? exists;
        if (wanted !== exists) {
          (wanted ? reverseChanges.add : reverseChanges.remove).push(substituteFoodId);
        }
      }

      keepRows.push({ substituteFoodId, note: note || "", addReverse: substitution.addReverse });
      keepSubstitutions.push({ substituteFoodId, note });
    });

    setSubstitutions(keepRows);
    emit("submit", keepSubstitutions, reverseChanges);
  }

  return (
    <>
  <div>
    <BaseDialog value={dialog} onChange={/* WF4-REVIEW: setter */ setDialog} title={t('data-pages.foods.manage-substitutions')} icon={icons.swapHorizontal} submit-icon={icons.check} submit-text={t('general.confirm')} can-submit onSubmit={saveSubstitutions} onCancel={onCancel?.()}>
      <CardContent>
        <p className="text-body-2 pb-3">
          {t("data-pages.foods.substitution-dialog-text", { food: data.name })}
        </p>
        <RecipeIngredientSubstitutionEditor substitutions={substitutions} foods={foodOptions} onAdd={createSubstitution} onDelete={deleteSubstitution} onFoodChanged={resetReverse}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {(substitutions[index]?.substituteFoodId) ? (
              /* WF4-REVIEW: control={<Checkbox/>} + label prop */
              <FormControlLabel model-value={reverseChecked(index)} label={reverseLabel(index)} density="compact" hide-details className="ml-2" onUpdateModelValue={setReverse(index, !!$event)} />
            ) : null}
          </>
        </RecipeIngredientSubstitutionEditor>
      </CardContent>
    </BaseDialog>
  </div>
    </>
  );
}
