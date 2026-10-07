import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Autocomplete, TextField, Tooltip } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useNuxtApp } from "#app";
import { useI18n } from "vue-i18n";
import { usePublicExploreApi, useUserApi } from "@/composables/api";
import { useRecipeSearch } from "@/composables/recipes/use-recipe-search";
import { useFoodData, useFoodStore, useUnitData, useUnitStore } from "@/composables/store";
import { useSearch } from "@/composables/use-search";
import RecipeIngredientSubstitutionEditor from "@/components/Domain/Recipe/RecipeIngredientSubstitutionEditor";
import type { RecipeIngredient } from "@/lib/api/types/recipe";
import { useMealieAuth } from "@/composables/use-mealie-auth";
import { useLoggedInState } from "@/composables/use-logged-in-state";

interface Props {
  menuAttachTarget?: string;
  isRecipe?: boolean;
  unitError?: boolean;
  unitErrorTooltip?: string;
  foodError?: boolean;
  foodErrorTooltip?: string;
  enableContextMenu?: boolean;
  enableDragHandle?: boolean;
  deleteDisabled?: boolean;
  onClickIngredientField?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onInsertAbove?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onInsertBelow?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onDelete?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
}

export default function RecipeIngredientEditor({ menuAttachTarget = "body", isRecipe = false, unitError = false, unitErrorTooltip = "", foodError = false, foodErrorTooltip = "", enableContextMenu = false, enableDragHandle = false, deleteDisabled = false, onClickIngredientField, onInsertAbove, onInsertBelow, onDelete }: Props) {
  const { t } = useTranslation();

  // defineModel replaces modelValue prop
  const model = defineModel<RecipeIngredient>({ required: true });

  const props = /* props via generated interface + destructured signature */

  /* emits → props: onClickIngredientField, onInsertAbove, onInsertBelow, onDelete */

  const { i18n } = useTranslation();
  // icons imported directly (was $globals)

  const state = /* WF4-REVIEW [J] */ reactive({
    showTitle: false,
    showSubstitutions: false,
    isRecipe: isRecipe,
  });

  // an ingredient that arrives with a title or substitutions shows them without being toggled on,
  // so what the menu entries act on is this, not the flag on its own -- otherwise the first press
  // is a no-op and the second one is the destructive half of a toggle nobody saw move
  const titleVisible = useMemo(() => !!model.title || state.showTitle, []); // WF4-REVIEW: dependency array
  const substitutionsVisible = useMemo(() => !!model.substitutions?.length || state.showSubstitutions, []); // WF4-REVIEW: dependency array

  const contextMenuOptions = useMemo(() => {
    // these entries clear what they hide, so they name the action instead of saying "toggle"
    const options = [
      {
        text: titleVisible
          ? i18n.t("recipe.clear-section")
          : i18n.t("recipe.add-section"),
        event: "toggle-section",
      },
      {
        text: i18n.t("recipe.toggle-recipe"),
        event: "toggle-subrecipe",
      },
      {
        text: substitutionsVisible
          ? i18n.t("recipe.clear-substitutions")
          : i18n.t("recipe.add-substitutions"),
        event: "toggle-substitutions",
      },
      {
        text: i18n.t("recipe.insert-above"),
        event: "insert-above",
      },
      {
        text: i18n.t("recipe.insert-below"),
        event: "insert-below",
      },
    ];

    return options;
  }, []); // WF4-REVIEW: dependency array

  const btns = useMemo(() => {
    const out = [
      {
        icon: icons.dotsVertical,
        text: i18n.t("general.menu"),
        event: "open",
        children: contextMenuOptions,
      },
    ];

    // If delete event is being listened for, show delete button
    // $attrs is not available in <script setup>, so always show if parent listens
    out.unshift({
      icon: icons.delete,
      text: i18n.t("general.delete"),
      event: "delete",
      children: undefined,
      disabled: deleteDisabled,
    });
    return out;
  }, []); // WF4-REVIEW: dependency array

  // Foods
  const foodStore = useFoodStore();
  const foodData = useFoodData();
  const [foodAutocomplete, setFoodAutocomplete] = useState(undefined);
  const { search: foodSearch, filtered: filteredFoods } = useSearch(foodStore.store);

  // the substitution pickers offer every food; unlike the main field they can't create one,
  // since a substitute the user has to invent is what the note is for
  const allFoods = foodStore.store; // was computed — plain read stays reactive

  const showCreateFood = useMemo(() => !!foodSearch
    && !filteredFoods.some((f: any) => (f.name ?? "").toLowerCase() === foodSearch.toLowerCase()),, []); // WF4-REVIEW: dependency array

  async function createAssignFood() {
    foodData.data.name = foodSearch;
    model.food = await foodStore.actions.createOne(foodData.data) || undefined;
    foodData.reset();
    foodAutocomplete?.blur();
  }

  // Recipes
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const auth = useMealieAuth();
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const { isOwnGroup } = useLoggedInState();
  const api = isOwnGroup ? useUserApi() : usePublicExploreApi(groupSlug).explore;
  const search = useRecipeSearch(api);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // Reset or Grab Recipes on Change
  /* WF4-REVIEW [J] */ watch(loading, (val) => {
    if (!val) {
      search.query = "";
      setSelectedIndex(-1);
      search.data = [];
    }
  });

  // Units
  const unitStore = useUnitStore();
  const unitsData = useUnitData();
  const [unitAutocomplete, setUnitAutocomplete] = useState(undefined);
  const { search: unitSearch, filtered: filteredUnits } = useSearch(unitStore.store);

  const showCreateUnit = useMemo(() => !!unitSearch
    && !filteredUnits.some((u: any) => (u.name ?? "").toLowerCase() === unitSearch.toLowerCase()),, []); // WF4-REVIEW: dependency array

  async function createAssignUnit() {
    unitsData.data.name = unitSearch;
    model.unit = await unitStore.actions.createOne(unitsData.data) || undefined;
    unitsData.reset();
    unitAutocomplete?.blur();
  }

  function toggleTitle() {
    if (titleVisible) {
      model.title = "";
      state.showTitle = false;
    }
    else {
      state.showTitle = true;
    }
  }

  function addSubstitution() {
    model.substitutions = [...(model.substitutions || []), { substituteFoodId: null, note: "" }];
    state.showSubstitutions = true;
  }

  function deleteSubstitution(index: number) {
    model.substitutions?.splice(index, 1);
    // removing the last row leaves the section open; the user is still working in it
    state.showSubstitutions = true;
  }

  function toggleSubstitutions() {
    if (substitutionsVisible) {
      model.substitutions = [];
      state.showSubstitutions = false;
    }
    else {
      addSubstitution();
    }
  }

  function toggleIsRecipe() {
    if (state.isRecipe) {
      model.referencedRecipe = undefined;
    }
    else {
      model.unit = undefined;
      model.food = undefined;
    }
    state.isRecipe = !state.isRecipe;
  }

  function handleUnitEnter() {
    if (
      model.unit === undefined
      || model.unit === null
      || !model.unit.name.includes(unitSearch)
    ) {
      createAssignUnit();
    }
  }

  function handleFoodEnter() {
    if (
      model.food === undefined
      || model.food === null
      || !model.food.name.includes(foodSearch)
    ) {
      createAssignFood();
    }
  }

  function quantityFilter(e: KeyboardEvent) {
    if (e.key === "-" || e.key === "+" || e.key === "e") {
      e.preventDefault();
    }
  }

  return (
    <>
  <div>
    {(titleVisible) ? (
      /* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "model.title" [J] */
      <TextField density="compact" variant="underlined" hide-details className="mx-1 mt-3 mb-4" placeholder={t('recipe.section-title')} style="max-width: 500px" onClick={onClickIngredientField?.('title')} />
    ) : null}
    <RecipeIngredientEditorLayout header={enableDragHandle || enableContextMenu}>
      {(enableDragHandle) ? (
        /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
        <>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={icons.arrowUpDown} className="ma-2 handle" size="large" />
        </>
      ) : null}
      {(enableContextMenu) ? (
        /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
        <>
          <BaseButtonGroup hover large={false} className="ml-auto" buttons={btns} onToggleSection={toggleTitle} onToggleSubrecipe={toggleIsRecipe} onToggleSubstitutions={toggleSubstitutions} onInsertAbove={onInsertAbove?.()} onInsertBelow={onInsertBelow?.()} onDelete={onDelete?.()} />
        </>
      ) : null}
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        <div className="flex-grow-1">
          <div className="d-flex ga-2 py-2" className={$vuetify.display.mdAndDown ? 'flex-column' : ''}>
            {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J]; v-model on complex expression "model.quantity" [J] */}
            <VNumberInput variant="filled" precision={null} min={0} hide-details inset density="compact" style={$vuetify.display.mdAndDown ? '' : 'flex: 3 0 50px;'} placeholder={t('recipe.quantity')} onKeypress={quantityFilter} />
            {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S]; v-model on complex expression "model.unit" [J] */}
            <Autocomplete ref="unitAutocomplete" value={unitSearch} onChange={/* WF4-REVIEW: setter */ setUnitSearch} auto-select-first hide-details density="compact" style={$vuetify.display.mdAndDown ? '' : 'flex: 4 0 50px;'} variant="filled" return-object items={filteredUnits} custom-filter={() => true} item-title="name" placeholder={t('recipe.choose-unit')} clearable menu-props={{ attach: menuAttachTarget, maxHeight: '250px' }} onKeyUp={handleUnitEnter}>
              {(unitError) ? (
                /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
                <>
                  {/* WF4-REVIEW: activator slot variants [J] */}
                  <Tooltip location="bottom">
                    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                    <>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={icons.alert} {...(unitTooltipProps)} className="opacity-100" color="primary" />
                    </>
                    {(unitErrorTooltip) ? (
                      <span>
                        {unitErrorTooltip}
                      </span>
                    ) : null}
                  </Tooltip>
                </>
              ) : null}
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                <div className="caption text-center pb-2">
                  {t("recipe.press-enter-to-create")}
                </div>
              </>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {(showCreateUnit) ? (
                  <div className="px-2">
                    <BaseButton block size="small" onClick={createAssignUnit()} />
                  </div>
                ) : null}
              </>
            </Autocomplete>
            {(!state.isRecipe) ? (
              /* WF4-REVIEW: items → options/getOptionLabel; value wiring [S]; v-model on complex expression "model.food" [J] */
              <Autocomplete ref="foodAutocomplete" value={foodSearch} onChange={/* WF4-REVIEW: setter */ setFoodSearch} auto-select-first hide-details density="compact" style={$vuetify.display.mdAndDown ? '' : 'flex: 7 0 50px;'} variant="filled" return-object items={filteredFoods} custom-filter={() => true} item-title="name" placeholder={t('recipe.choose-food')} clearable menu-props={{ attach: menuAttachTarget, maxHeight: '250px' }} onKeyUp={handleFoodEnter}>
                {(foodError) ? (
                  /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
                  <>
                    {/* WF4-REVIEW: activator slot variants [J] */}
                    <Tooltip location="bottom">
                      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                      <>
                        {/* WF4-REVIEW: icon name resolves via lib/icons */}
                        <MdiIcon name={icons.alert} {...(foodTooltipProps)} className="opacity-100" color="primary" />
                      </>
                      {(foodErrorTooltip) ? (
                        <span>
                          {foodErrorTooltip}
                        </span>
                      ) : null}
                    </Tooltip>
                  </>
                ) : null}
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  <div className="caption text-center pb-2">
                    {t("recipe.press-enter-to-create")}
                  </div>
                </>
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {(showCreateFood) ? (
                    <div className="px-2">
                      <BaseButton block size="small" onClick={createAssignFood()} />
                    </div>
                  ) : null}
                </>
              </Autocomplete>
            ) : null}
            {(state.isRecipe) ? (
              /* WF4-REVIEW: items → options/getOptionLabel; value wiring [S]; v-model on complex expression "model.referencedRecipe" [J]; v-model on complex expression "search.query" [J] */
              <Autocomplete ref="search.query" auto-select-first hide-details density="compact" style={$vuetify.display.mdAndDown ? '' : 'flex: 7 0 50px;'} variant="filled" return-object items={search.data || []} item-title="name" placeholder={t('search.type-to-search')} clearable label={!model.referencedRecipe ? t('recipe.choose-recipe') : ''} onClick={search.trigger()} onFocus={search.trigger()} />
            ) : null}
            {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "model.note" [J] */}
            <TextField hide-details density="compact" style={$vuetify.display.mdAndDown ? '' : 'flex: 7 0 50px;'} variant="filled" placeholder={t('recipe.notes')} className="" onClick={onClickIngredientField?.('note')} />
          </div>
        </div>
      </>
    </RecipeIngredientEditorLayout>
    <div className="px-2" className={{ 'ml-10': !$vuetify.display.mdAndDown }}>
      {(substitutionsVisible) ? (
        <div className="py-2">
          <div className="d-flex align-center text-caption mb-1">
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={icons.swapHorizontal} size="small" className="mr-1" />
            {t("recipe.substitutions")}
          </div>
          <RecipeIngredientSubstitutionEditor substitutions={model.substitutions || []} foods={allFoods} menu-attach-target={menuAttachTarget} onAdd={addSubstitution} onDelete={deleteSubstitution} />
        </div>
      ) : null}
      <slot name="before-divider" />
    </div>
  </div>
    </>
  );
}
