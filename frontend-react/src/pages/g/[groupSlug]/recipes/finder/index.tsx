import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge, Box, Button, Card, CardContent, CardHeader, Chip, Container, Divider, FormControlLabel, Grid } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { watchDebounced } from "@vueuse/core";
import { useUserApi } from "@/composables/api";
import { usePublicExploreApi } from "@/composables/api/api-client";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { useFoodStore, usePublicFoodStore, useToolStore, usePublicToolStore } from "@/composables/store";
import type { IngredientFood, RecipeSuggestionQuery, RecipeSuggestionResponseItem, RecipeTool } from "@/lib/api/types/recipe";
import { Organizer } from "@/lib/api/types/non-generated";
import QueryFilterBuilder from "@/components/Domain/QueryFilterBuilder";
import RecipeSuggestion from "@/components/Domain/Recipe/RecipeSuggestion";
import SearchFilter from "@/components/Domain/SearchFilter";
import type { QueryFilterJSON } from "@/lib/api/types/non-generated";
import type { FieldDefinition } from "@/composables/use-query-filter-builder";
import { useRecipeFinderPreferences } from "@/composables/use-users/preferences";
import { normalizeMissingItemLimit } from "@/lib/recipe/recipe-finder";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface RecipeSuggestions {
  readyToMake: RecipeSuggestionResponseItem[];
  missingItems: RecipeSuggestionResponseItem[];
}

export default function FinderPage() {
  const { t } = useTranslation();

  const display = useDisplay();
  const { i18n } = useTranslation();
  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]

  useSeoMeta({
    title: i18n.t("recipe-finder.recipe-finder"),
  });

  const useMobile = display.smAndDown; // was computed — plain read stays reactive

  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  const { isOwnGroup } = useLoggedInState();
  const api = isOwnGroup ? useUserApi() : usePublicExploreApi(groupSlug).explore;

  const preferences = useRecipeFinderPreferences();
  const state = /* WF4-REVIEW [J] */ reactive({
    ready: false,
    loading: false,
    recipesReady: false,
    settingsMenu: false,
    queryFilterMenu: false,
    queryFilterMenuKey: 0,
    queryFilterEditorValue: "",
    queryFilterEditorValueJSON: {},
    queryFilterJSON: preferences.queryFilterJSON,
    settings: {
      maxMissingFoods: normalizeMissingItemLimit(preferences.maxMissingFoods),
      maxMissingTools: normalizeMissingItemLimit(preferences.maxMissingTools),
      includeFoodsOnHand: preferences.includeFoodsOnHand,
      includeToolsOnHand: preferences.includeToolsOnHand,
      includeSubstitutions: preferences.includeSubstitutions,
      queryFilter: preferences.queryFilter,
      limit: 20,
    },
  });

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const maxMissingFoods = computed({
    get: () => state.settings.maxMissingFoods,
    set: (value) => {
      state.settings.maxMissingFoods = normalizeMissingItemLimit(value);
    },
  });

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const maxMissingTools = computed({
    get: () => state.settings.maxMissingTools,
    set: (value) => {
      state.settings.maxMissingTools = normalizeMissingItemLimit(value);
    },
  });

  /* WF4-REVIEW [J] */ onMounted(() => {
    if (!isOwnGroup) {
      state.settings.includeFoodsOnHand = false;
      state.settings.includeToolsOnHand = false;
    }
  });

  /* WF4-REVIEW [J] */ watch(
    () => state,
    (newState) => {
      preferences.queryFilter = newState.settings.queryFilter;
      preferences.queryFilterJSON = newState.queryFilterJSON;
      preferences.maxMissingFoods = newState.settings.maxMissingFoods;
      preferences.maxMissingTools = newState.settings.maxMissingTools;
      preferences.includeFoodsOnHand = newState.settings.includeFoodsOnHand;
      preferences.includeToolsOnHand = newState.settings.includeToolsOnHand;
      preferences.includeSubstitutions = newState.settings.includeSubstitutions;
    },
    {
      deep: true,
    },
  );

  const attrs = useMemo(() => {
    return {
      title: {
        class: {
          readyToMake: "ma-0 pa-0",
          missingItems: recipeSuggestions.readyToMake.length ? "ma-0 pa-0 mt-5" : "ma-0 pa-0",
        },
      },
      searchFilter: {
        colClass: useMobile ? "d-flex flex-wrap justify-end" : "d-flex flex-wrap justify-start",
        filterClass: useMobile ? "ml-4 mb-2" : "mr-4 mb-2",
      },
      settings: {
        colClass: useMobile ? "d-flex flex-wrap justify-end" : "d-flex flex-wrap justify-start",
      },
    };
  }, []); // WF4-REVIEW: dependency array

  const foodStore = isOwnGroup ? useFoodStore() : usePublicFoodStore(groupSlug);
  const foods = foodStore.store;
  const [selectedFoods, setSelectedFoods] = useState([]);
  function addFood(food: IngredientFood) {
    setSelectedFoods([...selectedFoods, food]);
    handleFoodUpdates();
  }
  function removeFood(food: IngredientFood) {
    setSelectedFoods(selectedFoods.filter(f => f.id !== food.id));
    handleFoodUpdates();
  }
  function handleFoodUpdates() {
    selectedFoods.sort((a, b) => (a.pluralName || a.name).localeCompare(b.pluralName || b.name));
    preferences.foodIds = selectedFoods.map(food => food.id);
  }
  /* WF4-REVIEW [J] */ watch(
    () => selectedFoods,
    () => {
      handleFoodUpdates();
    },
  );

  const toolStore = isOwnGroup ? useToolStore() : usePublicToolStore(groupSlug);
  const tools = toolStore.store;
  const [selectedTools, setSelectedTools] = useState([]);
  function addTool(tool: RecipeTool) {
    setSelectedTools([...selectedTools, tool]);
    handleToolUpdates();
  }
  function removeTool(tool: RecipeTool) {
    setSelectedTools(selectedTools.filter(t => t.id !== tool.id));
    handleToolUpdates();
  }
  function handleToolUpdates() {
    selectedTools.sort((a, b) => a.name.localeCompare(b.name));
    preferences.toolIds = selectedTools.map(tool => tool.id);
  }
  /* WF4-REVIEW [J] */ watch(
    () => selectedTools,
    () => {
      handleToolUpdates();
    },
  );

  async function hydrateFoods() {
    if (!preferences.foodIds.length) {
      return;
    }
    if (!foodStore.store.length) {
      await foodStore.actions.refresh();
    }

    const foods = preferences.foodIds
      .map(foodId => foodStore.store.find(food => food.id === foodId))
      .filter(food => !!food);

    setSelectedFoods(foods);
  }

  async function hydrateTools() {
    if (!preferences.toolIds.length) {
      return;
    }
    if (!toolStore.store.length) {
      await toolStore.actions.refresh();
    }

    const tools = preferences.toolIds
      .map(toolId => toolStore.store.find(tool => tool.id === toolId))
      .filter(tool => !!tool);

    setSelectedTools(tools);
  }

  /* WF4-REVIEW [J] */ onMounted(async () => {
    await Promise.all([hydrateFoods(), hydrateTools()]);
    state.ready = true;
    if (!selectedFoods.length) {
      state.recipesReady = true;
    };
  });

  const [recipeResponseItems, setRecipeResponseItems] = useState([]);
  const recipeSuggestions = useMemo(() => {
    const readyToMake: RecipeSuggestionResponseItem[] = [];
    const missingItems: RecipeSuggestionResponseItem[] = [];
    recipeResponseItems.forEach((responseItem) => {
      if (responseItem.missingFoods.length === 0 && responseItem.missingTools.length === 0) {
        readyToMake.push(responseItem);
      }
      else {
        missingItems.push(responseItem);
      };
    });

    return {
      readyToMake,
      missingItems,
    };
  }, []); // WF4-REVIEW: dependency array

  watchDebounced(
    [selectedFoods, selectedTools, state.settings], async () => {
      // don't search for suggestions if no filter are selected
      if (!selectedFoods.length && !selectedTools.length && !state.settings.queryFilter) {
        setRecipeResponseItems([]);
        state.recipesReady = true;
        return;
      }

      state.loading = true;
      const { data } = await api.recipes.getSuggestions(
        {
          limit: state.settings.limit,
          queryFilter: state.settings.queryFilter,
          maxMissingFoods: state.settings.maxMissingFoods,
          maxMissingTools: state.settings.maxMissingTools,
          includeFoodsOnHand: state.settings.includeFoodsOnHand,
          includeToolsOnHand: state.settings.includeToolsOnHand,
          includeSubstitutions: state.settings.includeSubstitutions,
        } as RecipeSuggestionQuery,
        selectedFoods.map(food => food.id),
        selectedTools.map(tool => tool.id),
      );
      state.loading = false;
      if (!data) {
        return;
      }
      setRecipeResponseItems(data.items);
      state.recipesReady = true;
    },
    {
      debounce: 500,
    },
  );

  const queryFilterBuilderFields: FieldDefinition[] = [
    {
      name: "recipe_category.id",
      label: i18n.t("category.categories"),
      type: Organizer.Category,
    },
    {
      name: "tags.id",
      label: i18n.t("tag.tags"),
      type: Organizer.Tag,
    },
    {
      name: "recipe_ingredient.food.id",
      label: i18n.t("recipe.ingredients"),
      type: Organizer.Food,
    },
    {
      name: "recipe_ingredient.food.label_id",
      label: i18n.t("data-pages.foods.food-label"),
      type: Organizer.Label,
    },
    {
      name: "household_id",
      label: i18n.t("household.households"),
      type: Organizer.Household,
    },
    {
      name: "user_id",
      label: i18n.t("user.users"),
      type: Organizer.User,
    },
    {
      name: "last_made",
      label: i18n.t("general.last-made"),
      type: "relativeDate",
    },
    {
      name: "rating",
      label: i18n.t("general.rating"),
      type: "number",
    },
    {
      name: "total_time_seconds",
      label: i18n.t("recipe.total-time"),
      type: "duration",
    },
  ];

  function clearQueryFilter() {
    state.queryFilterEditorValue = "";
    state.queryFilterEditorValueJSON = { parts: [] } as QueryFilterJSON;
    state.settings.queryFilter = "";
    state.queryFilterJSON = { parts: [] } as QueryFilterJSON;
    state.queryFilterMenu = false;
    state.queryFilterMenuKey += 1;
  }

  function saveQueryFilter() {
    state.settings.queryFilter = state.queryFilterEditorValue || "";
    state.queryFilterJSON = state.queryFilterEditorValueJSON || { parts: [] } as QueryFilterJSON;
    state.queryFilterMenu = false;
  }

  return (
    <>
  <Container>
    <BasePageTitle divider>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="100" max-height="100" max-width="100" src="/svgs/manage-cookbooks.svg" />
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t('recipe-finder.recipe-finder')}
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t('recipe-finder.recipe-finder-description')}
      </>
    </BasePageTitle>
    {(state.ready) ? (
      <Container>
        <Grid container>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols={useMobile ? 12 : 3}>
            <Container className="ma-0 pa-0">
              <Grid container no-gutters>
                {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                <Grid cols="12" no-gutters className={attrs.searchFilter.colClass}>
                  {(foods) ? (
                    <SearchFilter value={selectedFoods} onChange={setSelectedFoods} items={foods} className={attrs.searchFilter.filterClass}>
                      {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                      <MdiIcon name={icons.foods} />
                      {t("general.foods")}
                    </SearchFilter>
                  ) : null}
                  {(tools) ? (
                    <SearchFilter value={selectedTools} onChange={setSelectedTools} items={tools} className={attrs.searchFilter.filterClass}>
                      {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                      <MdiIcon name={icons.potSteam} />
                      {t("tool.tools")}
                    </SearchFilter>
                  ) : null}
                  <div className={attrs.searchFilter.filterClass}>
                    {/* WF4-REVIEW: content → badgeContent */}
                    <Badge model-value={!!state.queryFilterJSON.parts && state.queryFilterJSON.parts.length > 0} size="small" color="primary" content={(state.queryFilterJSON.parts || []).length}>
                      {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-btn> */}
                      <Button size="small" color="accent" onClick={state.queryFilterMenu = !state.queryFilterMenu}>
                        {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                        <MdiIcon name={icons.filter} />
                        {t("recipe-finder.other-filters")}
                        {/* WF4-REVIEW: v-model on complex expression "state.queryFilterMenu" [J] */}
                        <BaseDialog title={t('recipe-finder.other-filters')} icon={icons.filter} width="100%" max-width="1100px" submit-disabled={!state.queryFilterEditorValue} can-confirm onConfirm={saveQueryFilter}>
                          <CardContent>
                            <QueryFilterBuilder key={state.queryFilterMenuKey} initial-query-filter={state.queryFilterJSON} field-defs={queryFilterBuilderFields} onInput={(value) => state.queryFilterEditorValue = value} onInputJSON={(value) => state.queryFilterEditorValueJSON = value} />
                          </CardContent>
                          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                          <>
                            <BaseButton color="error" type="submit" onClick={clearQueryFilter}>
                              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                              <>
                                {icons.close}
                              </>
                              {t("search.clear-selection")}
                            </BaseButton>
                          </>
                        </BaseDialog>
                      </Button>
                    </Badge>
                  </div>
                </Grid>
              </Grid>
              <Grid container no-gutters className="mb-2">
                {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                <Grid cols="12" className={attrs.settings.colClass}>
                  {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J]; v-model on complex expression "state.settingsMenu" [J] */}
                  <VMenu offset-y nudge-bottom="3" close-on-content-click={false}>
                    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                    <>
                      {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-btn> */}
                      <Button size="small" color="primary" {...(props)}>
                        {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                        <MdiIcon name={icons.cog} />
                        {t("general.settings")}
                      </Button>
                    </>
                    <Card>
                      <CardContent>
                        <div>
                          {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */}
                          <VNumberInput value={maxMissingFoods} onChange={/* WF4-REVIEW: setter */ setMaxMissingFoods} precision={null} min={0} inset hide-details label={t('recipe-finder.max-missing-ingredients')} />
                          {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */}
                          <VNumberInput value={maxMissingTools} onChange={/* WF4-REVIEW: setter */ setMaxMissingTools} precision={null} min={0} inset hide-details label={t('recipe-finder.max-missing-tools')} className="mt-4" />
                        </div>
                        <div className="mt-1">
                          {(isOwnGroup) ? (
                            /* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "state.settings.includeFoodsOnHand" [J] */
                            <FormControlLabel density="compact" hide-details className="my-auto" label={t('recipe-finder.include-ingredients-on-hand')} />
                          ) : null}
                          {(isOwnGroup) ? (
                            /* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "state.settings.includeToolsOnHand" [J] */
                            <FormControlLabel density="compact" hide-details className="my-auto" label={t('recipe-finder.include-tools-on-hand')} />
                          ) : null}
                          {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "state.settings.includeSubstitutions" [J] */}
                          <FormControlLabel density="compact" hide-details className="my-auto" label={t('recipe-finder.include-substitutions')} />
                        </div>
                      </CardContent>
                    </Card>
                  </VMenu>
                </Grid>
              </Grid>
              <Grid container no-gutters className="my-2">
                {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                <Grid cols="12">
                  <Divider />
                </Grid>
              </Grid>
              <Grid container no-gutters className="mt-5">
                {/* WF4-REVIEW: title text moves to the title prop */}
                <CardHeader className="ma-0 pa-0">
                  {t("recipe-finder.selected-ingredients")}
                </CardHeader>
                <Container className="ma-0 pa-0" style="max-height: 60vh; overflow-y: auto;">
                  {(!selectedFoods.length) ? (
                    <CardContent className="ma-0 pa-0">
                      {t("recipe-finder.no-ingredients-selected")}
                    </CardContent>
                  ) : null}
                  {(useMobile) ? (
                    <div>
                      <Grid container no-gutters>
                        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                        <Grid cols="12" className="d-flex flex-wrap justify-end">
                          {selectedFoods.map(food => (
                            <Chip key={food.id} label className="ma-1" color="accent custom-transparent" closable variant="flat" onClickClose={removeFood(food)}>
                              <span className="text-hide-overflow">
                                {food.pluralName || food.name}
                              </span>
                            </Chip>
                          ))}
                        </Grid>
                      </Grid>
                    </div>
                  ) : (
                    <div>
                      {selectedFoods.map(food => (
                        <Grid container key={food.id} no-gutters className="mb-1">
                          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                          <Grid cols="12">
                            <Chip label color="accent custom-transparent" variant="flat" closable onClickClose={removeFood(food)}>
                              <span className="text-hide-overflow">
                                {food.pluralName || food.name}
                              </span>
                            </Chip>
                          </Grid>
                        </Grid>
                      ))}
                    </div>
                  )}
                </Container>
              </Grid>
              {(selectedTools.length) ? (
                <Grid container no-gutters className="mt-5">
                  {/* WF4-REVIEW: title text moves to the title prop */}
                  <CardHeader className="ma-0 pa-0">
                    {t("recipe-finder.selected-tools")}
                  </CardHeader>
                  <Container className="ma-0 pa-0">
                    {(useMobile) ? (
                      <div>
                        <Grid container no-gutters>
                          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                          <Grid cols="12" className="d-flex flex-wrap justify-end">
                            {selectedTools.map(tool => (
                              <Chip key={tool.id} label className="ma-1" color="accent custom-transparent" closeable variant="flat" onClickClose={removeTool(tool)}>
                                <span className="text-hide-overflow">
                                  {tool.name}
                                </span>
                              </Chip>
                            ))}
                          </Grid>
                        </Grid>
                      </div>
                    ) : (
                      <div>
                        {selectedTools.map(tool => (
                          <Grid container key={tool.id} no-gutters className="mb-1">
                            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                            <Grid cols="12">
                              <Chip label color="accent custom-transparent" closable variant="flat" onClickClose={removeTool(tool)}>
                                <span className="text-hide-overflow">
                                  {tool.name}
                                </span>
                              </Chip>
                            </Grid>
                          </Grid>
                        ))}
                      </div>
                    )}
                  </Container>
                </Grid>
              ) : null}
            </Container>
          </Grid>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols={useMobile ? 12 : 9} style={useMobile ? '' : 'max-height: 70vh; overflow-y: auto'}>
            {(recipeSuggestions.readyToMake.length || recipeSuggestions.missingItems.length) ? (
              <Container className="ma-0 pa-0">
                {(recipeSuggestions.readyToMake.length) ? (
                  <Grid container density="compact">
                    {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                    <Grid cols="12">
                      {/* WF4-REVIEW: title text moves to the title prop */}
                      <CardHeader className={attrs.title.class.readyToMake}>
                        {t("recipe-finder.ready-to-make")}
                      </CardHeader>
                    </Grid>
                    {recipeSuggestions.readyToMake.map((item, idx) => (
                      /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
                      <Grid key={`${idx}-ready`} cols="12">
                        {/* WF4-REVIEW: unmapped <v-lazy> — judgement component, convert manually [J] */}
                        <VLazy>
                          <RecipeSuggestion recipe={item.recipe} missing-foods={item.missingFoods} missing-tools={item.missingTools} substituted-foods={item.substitutedFoods} disable-checkbox={state.loading} onAddFood={addFood} onRemoveFood={removeFood} onAddTool={addTool} onRemoveTool={removeTool} />
                        </VLazy>
                      </Grid>
                    ))}
                  </Grid>
                ) : null}
                {(recipeSuggestions.missingItems.length) ? (
                  <Grid container density="compact">
                    {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                    <Grid cols="12">
                      {/* WF4-REVIEW: title text moves to the title prop */}
                      <CardHeader className={attrs.title.class.missingItems}>
                        {t("recipe-finder.almost-ready-to-make")}
                      </CardHeader>
                    </Grid>
                    {recipeSuggestions.missingItems.map((item, idx) => (
                      /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
                      <Grid key={`${idx}-missing`} cols="12">
                        {/* WF4-REVIEW: unmapped <v-lazy> — judgement component, convert manually [J] */}
                        <VLazy>
                          <RecipeSuggestion recipe={item.recipe} missing-foods={item.missingFoods} missing-tools={item.missingTools} substituted-foods={item.substitutedFoods} disable-checkbox={state.loading} onAddFood={addFood} onRemoveFood={removeFood} onAddTool={addTool} onRemoveTool={removeTool} />
                        </VLazy>
                      </Grid>
                    ))}
                  </Grid>
                ) : null}
              </Container>
            ) : (!state.recipesReady) ? (
              <Container>
                <Grid container>
                  {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                  <Grid cols="12" className="d-flex justify-center">
                    <AppLoader waiting-text={t('general.loading-recipes')} />
                  </Grid>
                </Grid>
              </Container>
            ) : (
              <Container>
                <Grid container>
                  {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                  <Grid cols="12" className="d-flex flex-column justify-center align-center ga-1">
                    {/* WF4-REVIEW: title text moves to the title prop */}
                    <CardHeader className="ma-0 pa-0">
                      {t("recipe-finder.no-recipes-found")}
                    </CardHeader>
                    <CardContent className="ma-0 pa-0 text-center">
                      {t("recipe-finder.no-recipes-found-description")}
                    </CardContent>
                  </Grid>
                </Grid>
              </Container>
            )}
          </Grid>
        </Grid>
      </Container>
    ) : (
      <Container>
        <Grid container>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols="12" className="d-flex justify-center">
            <AppLoader waiting-text={t('general.loading-recipes')} />
          </Grid>
        </Grid>
      </Container>
    )}
  </Container>
    </>
  );
}
