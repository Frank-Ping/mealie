import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, CardHeader, Container, Divider, Fab, Grid, Paper, Tooltip } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { invoke, until } from "@vueuse/core";
import type { RouteLocationNormalized } from "vue-router";
import RecipeIngredients from "../RecipeIngredients";
import RecipePageEditorToolbar from "./RecipePageParts/RecipePageEditorToolbar";
import RecipePageFooter from "./RecipePageParts/RecipePageFooter";
import RecipePageHeader from "./RecipePageParts/RecipePageHeader";
import RecipePageIngredientEditor from "./RecipePageParts/RecipePageIngredientEditor";
import RecipePageIngredientToolsView from "./RecipePageParts/RecipePageIngredientToolsView";
import RecipePageInstructions from "./RecipePageParts/RecipePageInstructions";
import RecipePageOrganizers from "./RecipePageParts/RecipePageOrganizers";
import RecipePageParseDialog from "./RecipePageParts/RecipeParseDialog/RecipePageParseDialog";
import RecipePageScale from "./RecipePageParts/RecipePageScale";
import RecipePageInfoEditor from "./RecipePageParts/RecipePageInfoEditor";
import RecipePageComments from "./RecipePageParts/RecipePageComments";
import RecipePrintContainer from "@/components/Domain/Recipe/RecipePrintContainer";
import {
  clearPageState,
  PageMode,
  usePageState,
} from "@/composables/recipe-page/shared-state";
import { useCookModeQuery, type BooleanString } from "@/composables/recipe-page/use-cook-mode-query";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { Recipe, RecipeCategory, RecipeIngredient, RecipeTag, RecipeTool } from "@/lib/api/types/recipe";
import { useRouteQuery } from "@/composables/use-router";
import { useUserApi } from "@/composables/api";
import { uuid4, deepCopy } from "@/composables/use-utils";
import RecipeDialogBulkAdd from "@/components/Domain/Recipe/RecipeDialogBulkAdd";
import RecipeNotes from "@/components/Domain/Recipe/RecipeNotes";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { useNavigationWarning } from "@/composables/use-navigation-warning";
import { useUnitConversion, useUnitSystem } from "@/composables/recipes";
import { useHouseholdSelf } from "@/composables/use-households";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function RecipePage() {
  const { t } = useTranslation();

  const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });

  const display = useDisplay();
  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const { isOwnGroup } = useLoggedInState();

  const { household } = useHouseholdSelf();

  const disableComments = useMemo(() => household?.preferences?.recipeDisableComments
    || recipe?.settings?.disableComments
    || false,, []); // WF4-REVIEW: dependency array

  const groupSlug = useMemo(() => (route.params.groupSlug as string) || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  const ingredientStorageKey = useMemo(() => `recipe-ingredients:${recipe.id || recipe.slug}:checked`, []); // WF4-REVIEW: dependency array

  const navigate = useNavigate();
  const api = useUserApi();
  const { pageMode, setMode, isEditForm, isEditJSON, isCookMode, isEditMode, isParsing, toggleCookMode, toggleIsParsing }
    = usePageState(recipe.slug);
  const { deactivateNavigationWarning } = useNavigationWarning();
  const [scale, setScale] = useState(1);

  const { unitSystem } = useUnitSystem();
  const { convertIngredient } = useUnitConversion();

  /**
   * The recipe as the reader asked to see it — the recipe itself unless they've opted into a unit
   * system. Cook mode, print and the ingredient list all read this, so they convert together.
   *
   * Returns `recipe` by identity whenever nothing is being converted, and always does so in edit
   * mode. That is load-bearing rather than cosmetic: `recipe` is a defineModel the editors below
   * mutate in place, so handing them a derived copy would silently drop edits. Conversion is
   * display-only and never reaches anything that saves.
   */
  const displayedRecipe = useMemo(() => {
    if (isEditMode || !unitSystem) {
      return recipe;
    }

    return {
      ...recipe,
      recipeIngredient: recipe.recipeIngredient.map(
        ingredient => convertIngredient(ingredient, unitSystem.value!, scale),
      ),
    };
  }, []); // WF4-REVIEW: dependency array

  const notLinkedIngredients = useMemo(() => {
    return displayedRecipe.recipeIngredient.filter((ingredient) => {
      return !recipe.recipeInstructions.some(step =>
        step.ingredientReferences?.map(ref => ref.referenceId).includes(ingredient.referenceId),
      );
    });
  }, []); // WF4-REVIEW: dependency array

  /** =============================================================
   * Floating save button — track toolbar visibility
   */
  const [recipeToolbar, setRecipeToolbar] = useState(null);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  let toolbarObserver: IntersectionObserver | undefined;

  /* WF4-REVIEW [J] */ onMounted(async () => {
    await /* WF4-REVIEW [J] */ nextTick();
    const el = recipeToolbar?.$el as HTMLElement | undefined;
    if (!el) return;
    toolbarObserver = new IntersectionObserver(
      ([entry]) => { setToolbarVisible(entry.isIntersecting); },
      { threshold: 0 },
    );
    toolbarObserver.observe(el);
  });

  /* WF4-REVIEW [J] */ onUnmounted(() => toolbarObserver?.disconnect());

  /** =============================================================
   * Recipe Snapshot on Mount
   * this is used to determine if the recipe has been changed since the last save
   * and prompts the user to save if they have unsaved changes.
   */
  const [originalRecipe, setOriginalRecipe] = useState(null);
  const [discardDialog, setDiscardDialog] = useState(false);
  const [pendingRoute, setPendingRoute] = useState(null);

  invoke(async () => {
    await until(recipe).not.toBeNull();
    setOriginalRecipe(deepCopy(recipe));
  });

  function hasUnsavedChanges(): boolean {
    if (setOriginalRecipe(== null) {
      return false);
    }
    return JSON.stringify(recipe) !== JSON.stringify(originalRecipe);
  }

  function restoreOriginalRecipe() {
    if (originalRecipe) {
      recipe = deepCopy(originalRecipe) as NoUndefinedField<Recipe>;
    }
  }

  function closeEditor() {
    if (hasUnsavedChanges()) {
      setPendingRoute(null);
      setDiscardDialog(true);
    }
    else {
      setMode(PageMode.VIEW);
    }
  }

  function confirmDiscard() {
    restoreOriginalRecipe();
    setDiscardDialog(false);

    if (pendingRoute) {
      const destination = pendingRoute;
      setPendingRoute(null);
      navigate(destination);
    }
    else {
      setMode(PageMode.VIEW);
    }
  }

  function cancelDiscard() {
    setDiscardDialog(false);
    setPendingRoute(null);
  }

  onBeforeRouteLeave((to) => {
    if (isEditMode && hasUnsavedChanges()) {
      setPendingRoute(to);
      setDiscardDialog(true);
      return false;
    }
  });

  /* WF4-REVIEW [J] */ onUnmounted(() => {
    deactivateNavigationWarning();
    clearPageState(recipe.slug || "");
  });
  const hasLinkedIngredients = useMemo(() => {
    return recipe.recipeInstructions.some(
      step => step.ingredientReferences && step.ingredientReferences.length > 0,
    );
  }, []); // WF4-REVIEW: dependency array
  /** =============================================================
   * Set State onMounted
   */

  const paramsEdit = useRouteQuery<BooleanString>("edit", "");
  const paramsParse = useRouteQuery<BooleanString>("parse", "");
  const paramsCook = useRouteQuery<BooleanString>("cook", "");
  const { hydrateCookMode } = useCookModeQuery({
    cookQuery: paramsCook,
    isEditMode,
    pageMode,
    setMode,
  });

  /* WF4-REVIEW [J] */ onMounted(() => {
    if (paramsEdit === "true" && isOwnGroup) {
      setMode(PageMode.EDIT);
    }

    if (paramsParse === "true" && isOwnGroup) {
      toggleIsParsing(true);
    }

    hydrateCookMode();
  });

  // When set, the isEditMode watcher skips its URL cleanup because saveRecipe
  // is navigating to a new slug that naturally omits ?edit=true.
  const [isNavigatingAfterRename, setIsNavigatingAfterRename] = useState(false);

  /* WF4-REVIEW [J] */ watch(isEditMode, (newVal) => {
    if (!newVal) {
      if (isNavigatingAfterRename) {
        setIsNavigatingAfterRename(false);
        return;
      }
      paramsEdit = undefined;
    }
  });

  /* WF4-REVIEW [J] */ watch(isParsing, () => {
    if (!isParsing) {
      paramsParse = undefined;
    }
  });

  /** =============================================================
   * Recipe Save Delete
   */

  async function saveRecipe() {
    const { data, error } = await api.recipes.updateOne(route.params.slug as string, recipe);
    if (!error) {
      if (data?.slug && data.slug !== route.params.slug) {
        setIsNavigatingAfterRename(true);
      }
      setMode(PageMode.VIEW);
    }
    if (data?.slug) {
      recipe = data as NoUndefinedField<Recipe>;
      setOriginalRecipe(deepCopy(recipe));
      if (data.slug !== route.params.slug) {
        navigate(/* WF4-REVIEW: replace+query */ `/g/${groupSlug}/r/` + data.slug);
      }
    }
  }

  async function saveParsedIngredients(ingredients: NoUndefinedField<RecipeIngredient[]>) {
    const returnToEdit = isEditMode;
    recipe.recipeIngredient = ingredients;
    await saveRecipe();
    toggleIsParsing(false);
    if (returnToEdit) {
      setMode(PageMode.EDIT);
    }
  }

  async function deleteRecipe() {
    const { data } = await api.recipes.deleteOne(recipe.slug);
    if (data?.slug) {
      navigate(`/g/${groupSlug}`);
    }
  }

  /** =============================================================
   * View Preferences
   */
  const landscape = useMemo(() => {
    const preferLandscape = recipe.settings?.landscapeView;
    const smallScreen = !display.smAndUp;

    if (preferLandscape) {
      return true;
    }
    else if (smallScreen) {
      return true;
    }

    return false;
  }, []); // WF4-REVIEW: dependency array

  /** =============================================================
   * Bulk Step Editor
   * TODO: Move to RecipePageInstructions component
   */

  function addStep(steps: Array<string> | null = null) {
    if (!recipe.recipeInstructions) {
      return;
    }

    if (steps) {
      const cleanedSteps = steps.map((step) => {
        return { id: uuid4(), text: step, title: "", summary: "", ingredientReferences: [], noteReferences: [] };
      });

      recipe.recipeInstructions.push(...cleanedSteps);
    }
    else {
      recipe.recipeInstructions.push({
        id: uuid4(),
        text: "",
        title: "",
        summary: "",
        ingredientReferences: [],
        noteReferences: [],
      });
    }
  }

  /** =============================================================
   * RecipeChip Clicked
   */

  function chipClicked(item: RecipeTag | RecipeCategory | RecipeTool, itemType: string) {
    if (!item.id) {
      return;
    }
    navigate(`/g/${groupSlug}?${itemType}=${item.id}`);
  }

  // expose to template
  // (all variables used in template are top-level in <script setup>)

  return (
    <>
  <div>
    <BaseDialog value={discardDialog} onChange={setDiscardDialog} bottom-sheet title={t('general.discard-changes')} color="warning" icon={icons.alertCircle} can-confirm onConfirm={confirmDiscard} onCancel={cancelDiscard}>
      <CardContent>
        {t("general.discard-changes-description")}
      </CardContent>
    </BaseDialog>
    <RecipePageParseDialog model-value={isParsing} ingredients={recipe.recipeIngredient} width={$vuetify.display.smAndDown ? '100%' : '80%'} onUpdateModelValue={toggleIsParsing} onSave={saveParsedIngredients} />
    <Container sx={{ display: (!isCookMode) ? undefined : "none" }} key="recipe-page" className="px-0" className={{ 'pa-0': $vuetify.display.smAndDown }}>
      <Card flat className="d-print-none">
        <RecipePageHeader ref="recipeToolbar" recipe={recipe} recipe-scale={scale} landscape={landscape} onSave={saveRecipe} onDelete={deleteRecipe} onClose={closeEditor} />
        {(isEditJSON) ? (
          <RecipeJsonEditor value={recipe} onChange={/* WF4-REVIEW: setter */ setRecipe} className="mt-10" mode="text" main-menu-bar={false} />
        ) : (
          <CardContent>
            <div>
              {(isEditMode) ? (
                <RecipePageInfoEditor value={recipe} onChange={/* WF4-REVIEW: setter */ setRecipe} />
              ) : null}
            </div>
            <div>
              {(isEditForm) ? (
                <RecipePageEditorToolbar value={recipe} onChange={/* WF4-REVIEW: setter */ setRecipe} />
              ) : null}
            </div>
            <div>
              {(isEditForm) ? (
                <RecipePageIngredientEditor value={recipe} onChange={/* WF4-REVIEW: setter */ setRecipe} />
              ) : null}
            </div>
            <div>
              <RecipePageScale value={scale} onChange={setScale} recipe={recipe} />
            </div>
            <Grid container>
              {(!isCookMode || isEditForm) ? (
                /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
                <Grid cols="12" sm="12" md="4" className={$vuetify.display.mdAndUp ? 'border-e-thin' : null}>
                  {(!isEditForm) ? (
                    <RecipePageIngredientToolsView recipe={displayedRecipe} scale={scale} ingredient-storage-key={ingredientStorageKey} className="pr-2" />
                  ) : null}
                  {($vuetify.display.mdAndUp) ? (
                    <RecipePageOrganizers value={recipe} onChange={/* WF4-REVIEW: setter */ setRecipe} className="pr-2" onItemSelected={chipClicked} />
                  ) : null}
                </Grid>
              ) : null}
              {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
              <Grid cols="12" sm="12" md={8 + (isCookMode ? 1 : 0) * 4}>
                {/* WF4-REVIEW: v-model on complex expression "recipe.recipeInstructions" [J]; v-model on complex expression "recipe.assets" [J] */}
                <RecipePageInstructions recipe={displayedRecipe} scale={scale} ingredient-storage-key={ingredientStorageKey} />
                {(isEditForm) ? (
                  <div className="d-flex">
                    <RecipeDialogBulkAdd className="ml-auto my-2 mr-1" onBulkData={addStep} />
                    <BaseButton className="my-2" onClick={addStep()}>
                      {t("general.add")}
                    </BaseButton>
                  </div>
                ) : null}
                {(!$vuetify.display.mdAndUp) ? (
                  <div>
                    <RecipePageOrganizers value={recipe} onChange={/* WF4-REVIEW: setter */ setRecipe} />
                  </div>
                ) : null}
                {/* WF4-REVIEW: v-model on complex expression "recipe.notes" [J] */}
                <RecipeNotes edit={isEditForm} />
              </Grid>
            </Grid>
            <RecipePageFooter value={recipe} onChange={/* WF4-REVIEW: setter */ setRecipe} />
          </CardContent>
        )}
      </Card>
      <WakelockSwitch />
      {(!disableComments && !isEditForm && !isCookMode) ? (
        <RecipePageComments value={recipe} onChange={/* WF4-REVIEW: setter */ setRecipe} className="px-1 my-4 d-print-none" />
      ) : null}
      <RecipePrintContainer recipe={displayedRecipe} scale={scale} />
    </Container>
    {(isEditMode && !toolbarVisible) ? (
      <Fab color="success" location="bottom end" size="large" app appear className="d-print-none" onClick={saveRecipe}>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={icons.save} />
        {/* WF4-REVIEW: activator slot variants [J] */}
        <Tooltip activator="parent" location="left">
          {t("general.save")}
        </Tooltip>
      </Fab>
    ) : null}
    <Paper sx={{ display: (isCookMode && !hasLinkedIngredients) ? undefined : "none" }} key="cookmode" height={$vuetify.display.smAndUp ? 'calc(100vh - 48px)' : 'auto'} class-name="overflow-hidden">
      <Grid container style="height: 100%" no-gutters className="overflow-hidden">
        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
        <Grid cols="12" sm="5" className="overflow-y-auto pl-4 pr-3 py-2" style="height: 100%">
          <div className="d-flex align-center">
            <RecipePageScale value={scale} onChange={setScale} recipe={recipe} />
          </div>
          {(!isEditForm) ? (
            <RecipePageIngredientToolsView recipe={displayedRecipe} scale={scale} is-cook-mode={isCookMode} ingredient-storage-key={ingredientStorageKey} />
          ) : null}
          <Divider />
        </Grid>
        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
        <Grid className="overflow-y-auto" className={$vuetify.display.smAndDown ? 'py-2': 'py-6'} style="height: 100%" cols="12" sm="7">
          <h2 className="text-h5 px-4 font-weight-medium opacity-80">
            {t('recipe.instructions')}
          </h2>
          {/* WF4-REVIEW: v-model on complex expression "recipe.recipeInstructions" [J]; v-model on complex expression "recipe.assets" [J] */}
          <RecipePageInstructions className="overflow-y-hidden px-4" recipe={displayedRecipe} scale={scale} ingredient-storage-key={ingredientStorageKey} />
        </Grid>
      </Grid>
    </Paper>
    <Paper sx={{ display: (isCookMode && hasLinkedIngredients) ? undefined : "none" }}>
      <div className="mt-2 px-2 px-md-4">
        <RecipePageScale value={scale} onChange={setScale} recipe={recipe} />
      </div>
      {/* WF4-REVIEW: v-model on complex expression "recipe.recipeInstructions" [J]; v-model on complex expression "recipe.assets" [J] */}
      <RecipePageInstructions className="overflow-y-hidden mt-n5 px-2 px-md-4" recipe={displayedRecipe} scale={scale} ingredient-storage-key={ingredientStorageKey} />
      {(notLinkedIngredients.length > 0) ? (
        <div className="px-2 px-md-4 pb-4">
          <Divider />
          <Card flat>
            {/* WF4-REVIEW: title text moves to the title prop */}
            <CardHeader>
              {t("recipe.not-linked-ingredients")}
            </CardHeader>
            <RecipeIngredients value={notLinkedIngredients} scale={scale} is-cook-mode={isCookMode} storage-key={ingredientStorageKey} />
          </Card>
        </div>
      ) : null}
    </Paper>
    {(isCookMode) ? (
      <Button icon color="primary" style="position: fixed; right: 12px; top: 60px" onClick={toggleCookMode()}>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={icons.close} />
      </Button>
    ) : null}
  </div>
    </>
  );
}
