import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardActions, CardContent, CardHeader, Container, Divider, FormControlLabel, ListItem, ListItemText, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import RecipeDataTable from "@/components/Domain/Recipe/RecipeDataTable";
import RecipeOrganizerSelector from "@/components/Domain/Recipe/RecipeOrganizerSelector";
import { useUserApi } from "@/composables/api";
import { useRecipes, allRecipes } from "@/composables/recipes";
import type { Recipe, RecipeSettings } from "@/lib/api/types/recipe";
import GroupExportData from "@/components/Domain/Group/GroupExportData";
import type { GroupDataExport } from "@/lib/api/types/group";
import type { MenuItem } from "@/components/global/BaseOverflowButton";
import RecipeSettingsSwitches from "@/components/Domain/Recipe/RecipeSettingsSwitches";
import { useUserStore } from "@/composables/store/use-user-store";
import UserAvatar from "@/components/Domain/User/UserAvatar";
import { useHouseholdStore } from "@/composables/store/use-household-store";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  scrollToTop: true,
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Recipes() {
  const { t } = useTranslation();

  enum MODES {
    tag = "tag",
    category = "category",
    export = "export",
    delete = "delete",
    updateSettings = "updateSettings",
    changeOwner = "changeOwner",
  }



  const { i18n } = useTranslation();
  const auth = useMealieAuth();
  // icons imported directly (was $globals)

  useSeoMeta({
    title: i18n.t("data-pages.recipes.recipe-data"),
  });

  const { refreshRecipes } = useRecipes(true, true, false, `householdId=${auth.user?.householdId || ""}`);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  function resetAll() {
    setSelected([]);
    setToSetTags([]);
    setToSetCategories([]);
    setLoading(false);
  }

  const headers = /* WF4-REVIEW [J] */ reactive({
    id: false,
    owner: false,
    tags: true,
    tools: true,
    categories: true,
    recipeServings: false,
    recipeYieldQuantity: false,
    recipeYield: false,
    dateAdded: false,
  });

  const headerLabels = {
    id: i18n.t("general.id"),
    owner: i18n.t("general.owner"),
    tags: i18n.t("tag.tags"),
    categories: i18n.t("recipe.categories"),
    tools: i18n.t("tool.tools"),
    recipeServings: i18n.t("recipe.recipe-servings"),
    recipeYieldQuantity: i18n.t("recipe.recipe-yield"),
    recipeYield: i18n.t("recipe.recipe-yield-text"),
    dateAdded: i18n.t("general.date-added"),
  };

  const actions: MenuItem[] = [
    {
      icon: icons.database,
      text: i18n.t("export.export"),
      event: "export-selected",
    },
    {
      icon: icons.tags,
      text: i18n.t("data-pages.recipes.tag"),
      event: "tag-selected",
    },
    {
      icon: icons.categories,
      text: i18n.t("data-pages.recipes.categorize"),
      event: "categorize-selected",
    },
    {
      icon: icons.cog,
      text: i18n.t("data-pages.recipes.update-settings"),
      event: "update-settings",
    },
    {
      icon: icons.user,
      text: i18n.t("general.change-owner"),
      event: "change-owner",
    },
    {
      icon: icons.delete,
      text: i18n.t("general.delete"),
      event: "delete-selected",
    },
  ];

  const api = useUserApi();
  const [loading, setLoading] = useState(false);

  // ===============================================================
  // Group Exports

  const [purgeExportsDialog, setPurgeExportsDialog] = useState(false);

  async function purgeExports() {
    await api.bulk.purgeExports();
    refreshExports();
  }

  const [groupExports, setGroupExports] = useState([]);

  async function refreshExports() {
    const { data } = await api.bulk.fetchExports();

    if (data) {
      setGroupExports(data);
    }
  }

  /* WF4-REVIEW [J] */ onMounted(async () => {
    await refreshExports();
  });
  // ===============================================================
  // All Recipes

  function selectAll() {
    setSelected(allRecipes);
  }

  async function exportSelected() {
    setLoading(true);
    const { data } = await api.bulk.bulkExport({
      recipes: selected.map((x: Recipe) => x.slug ?? ""),
      exportType: "json",
    });

    if (data) {
      console.log(data);
    }

    resetAll();
    refreshExports();
  }

  const [toSetTags, setToSetTags] = useState([]);

  async function tagSelected() {
    setLoading(true);

    const recipes = selected.map((x: Recipe) => x.slug ?? "");
    await api.bulk.bulkTag({ recipes, tags: toSetTags });
    await refreshRecipes();
    resetAll();
  }

  const [toSetCategories, setToSetCategories] = useState([]);

  async function categorizeSelected() {
    setLoading(true);

    const recipes = selected.map((x: Recipe) => x.slug ?? "");
    await api.bulk.bulkCategorize({ recipes, categories: toSetCategories });
    await refreshRecipes();
    resetAll();
  }

  async function deleteSelected() {
    setLoading(true);

    const recipes = selected.map((x: Recipe) => x.slug ?? "");

    await api.bulk.bulkDelete({ recipes });

    await refreshRecipes();
    resetAll();
  }

  const recipeSettings = reactive<RecipeSettings>({
    public: false,
    showNutrition: false,
    showAssets: false,
    landscapeView: false,
    disableComments: false,
    locked: false,
  });

  async function updateSettings() {
    setLoading(true);

    const recipes = selected.map((x: Recipe) => x.slug ?? "");

    await api.bulk.bulkSetSettings({ recipes, settings: recipeSettings });

    await refreshRecipes();
    resetAll();
  }

  async function changeOwner() {
    if (!selected.length || !selectedOwner) {
      return;
    }

    selected.forEach((r) => {
      r.userId = selectedOwner;
    });

    setLoading(true);
    await api.recipes.patchMany(selected);

    await refreshRecipes();
    resetAll();
  }

  // ============================================================
  // Dialog Management

  const dialog = /* WF4-REVIEW [J] */ reactive({
    state: false,
    title: i18n.t("data-pages.recipes.tag-recipes"),
    mode: MODES.tag,
    tag: "",
    callback: () => {
      // Stub function to be overwritten
      return Promise.resolve();
    },
    icon: icons.tags,
  });

  function openDialog(mode: MODES) {
    const titles: Record<MODES, string> = {
      [MODES.tag]: i18n.t("data-pages.recipes.tag-recipes"),
      [MODES.category]: i18n.t("data-pages.recipes.categorize-recipes"),
      [MODES.export]: i18n.t("data-pages.recipes.export-recipes"),
      [MODES.delete]: i18n.t("data-pages.recipes.delete-recipes"),
      [MODES.updateSettings]: i18n.t("data-pages.recipes.update-settings"),
      [MODES.changeOwner]: i18n.t("general.change-owner"),
    };

    const callbacks: Record<MODES, () => Promise<void>> = {
      [MODES.tag]: tagSelected,
      [MODES.category]: categorizeSelected,
      [MODES.export]: exportSelected,
      [MODES.delete]: deleteSelected,
      [MODES.updateSettings]: updateSettings,
      [MODES.changeOwner]: changeOwner,
    };

    const icons: Record<MODES, string> = {
      [MODES.tag]: icons.tags,
      [MODES.category]: icons.categories,
      [MODES.export]: icons.database,
      [MODES.delete]: icons.delete,
      [MODES.updateSettings]: icons.cog,
      [MODES.changeOwner]: icons.user,
    };

    dialog.mode = mode;
    dialog.title = titles[mode];
    dialog.callback = callbacks[mode];
    dialog.icon = icons[mode];
    dialog.state = true;
  }

  const { store: allUsers } = useUserStore();
  const { store: households } = useHouseholdStore();
  const [selectedOwner, setSelectedOwner] = useState("");
  const selectedOwnerHousehold = useMemo(() => {
    if (!selectedOwner) {
      return null;
    }

    const owner = allUsers.find(u => u.id === selectedOwner);
    if (!owner) {
      return null;
    };

    return households.find(h => h.id === owner.householdId);
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  <Container fluid>
    <BaseDialog value={purgeExportsDialog} onChange={setPurgeExportsDialog} bottom-sheet title={t('data-pages.recipes.purge-exports')} color="error" icon={icons.alertCircle} can-confirm onConfirm={purgeExports()}>
      <CardContent>
        {t('data-pages.recipes.are-you-sure-you-want-to-delete-all-export-data')}
      </CardContent>
    </BaseDialog>
    {/* WF4-REVIEW: v-model on complex expression "dialog.state" [J] */}
    <BaseDialog ref="domDialog" bottom-sheet width="650px" color={dialog.mode == MODES.delete ? 'error' : undefined} icon={dialog.icon} title={dialog.title} submit-text={t('general.submit')} can-submit={dialog.mode != MODES.delete} can-delete={dialog.mode == MODES.delete} onSubmit={dialog.callback} onDelete={dialog.callback}>
      {(dialog.mode == MODES.tag) ? (
        <CardContent>
          <RecipeOrganizerSelector value={toSetTags} onChange={setToSetTags} selector-type="tags" />
        </CardContent>
      ) : (dialog.mode == MODES.category) ? (
        <CardContent>
          <RecipeOrganizerSelector value={toSetCategories} onChange={setToSetCategories} selector-type="categories" />
        </CardContent>
      ) : (dialog.mode == MODES.delete) ? (
        <CardContent>
          <p className="h4">
            {t('data-pages.recipes.confirm-delete-recipes')}
          </p>
          <Card variant="outlined">
            {/* WF4-REVIEW: unmapped <v-virtual-scroll> — judgement component, convert manually [J] */}
            <VVirtualScroll height="400" item-height="25" items={selected}>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {/* WF4-REVIEW: @click → ListItemButton */}
                <ListItem className="pb-2">
                  {/* WF4-REVIEW: content → primary prop */}
                  <ListItemText>
                    {item.name}
                  </ListItemText>
                </ListItem>
              </>
            </VVirtualScroll>
          </Card>
        </CardContent>
      ) : (dialog.mode == MODES.export) ? (
        <CardContent>
          <p className="h4">
            {t('data-pages.recipes.the-following-recipes-selected-length-will-be-exported',
                [selected.length])}
          </p>
          <Card variant="outlined">
            {/* WF4-REVIEW: unmapped <v-virtual-scroll> — judgement component, convert manually [J] */}
            <VVirtualScroll height="400" item-height="25" items={selected}>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {/* WF4-REVIEW: @click → ListItemButton */}
                <ListItem className="pb-2">
                  {/* WF4-REVIEW: content → primary prop */}
                  <ListItemText>
                    {item.name}
                  </ListItemText>
                </ListItem>
              </>
            </VVirtualScroll>
          </Card>
        </CardContent>
      ) : (dialog.mode == MODES.updateSettings) ? (
        <CardContent className="px-12">
          <p>
            {t('data-pages.recipes.settings-chosen-explanation')}
          </p>
          <div className="mx-auto">
            <RecipeSettingsSwitches value={recipeSettings} onChange={/* WF4-REVIEW: setter */ setRecipeSettings} />
          </div>
          <p className="text-center mb-0">
            <i>
              {t('data-pages.recipes.selected-length-recipe-s-settings-will-be-updated', selected.length)}
            </i>
          </p>
        </CardContent>
      ) : (dialog.mode == MODES.changeOwner) ? (
        <CardContent>
          {/* WF4-REVIEW: items/item-title/item-value → MenuItem children */}
          <TextField select value={selectedOwner} onChange={setSelectedOwner} items={allUsers} item-title="fullName" item-value="id" label={t('general.owner')} hide-details>
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              <UserAvatar user-id={selectedOwner} tooltip={false} />
            </>
          </TextField>
          {(selectedOwnerHousehold) ? (
            <CardContent className="d-flex" style="align-items: flex-end;">
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={icons.household} />
              <span className="pl-1">
                {selectedOwnerHousehold.name}
              </span>
            </CardContent>
          ) : null}
        </CardContent>
      ) : null}
    </BaseDialog>
    <section>
      <BaseCardSectionTitle icon={icons.primary} title={t('data-pages.recipes.recipe-data')}>
        {t('data-pages.recipes.recipe-data-description')}
      </BaseCardSectionTitle>
      <CardActions className="mt-n5 mb-1">
        {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
        <VMenu offset-y bottom nudge-bottom="6" close-on-content-click={false}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-btn> */}
            <Button color="accent" className="mr-2" variant="elevated" {...(props)}>
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={icons.cog} />
              {t('data-pages.columns')}
            </Button>
          </>
          <Card>
            {/* WF4-REVIEW: title text moves to the title prop */}
            <CardHeader className="py-2">
              <div>
                {t('data-pages.recipes.recipe-columns')}
              </div>
            </CardHeader>
            <Divider className="mx-2" />
            <CardContent className="mt-n5">
              {headers.map((_, key) => (
                /* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "headers[key]" [J] */
                <FormControlLabel key={key} density="compact" flat inset label={headerLabels[key]} hide-details />
              ))}
            </CardContent>
          </Card>
        </VMenu>
        <BaseOverflowButton disabled={selected.length < 1} mode="event" color="info" variant="elevated" items={actions} onExportSelected={openDialog(MODES.export)} onTagSelected={openDialog(MODES.tag)} onCategorizeSelected={openDialog(MODES.category)} onDeleteSelected={openDialog(MODES.delete)} onUpdateSettings={openDialog(MODES.updateSettings)} onChangeOwner={openDialog(MODES.changeOwner)} />
        {(selected.length > 0) ? (
          <p className="text-caption my-auto ml-5">
            {t('general.selected-count', selected.length)}
          </p>
        ) : null}
      </CardActions>
      <div className="mx-2 clip-width">
        {/* WF4-REVIEW: rules/error-messages → error+helperText */}
        <TextField value={search} onChange={setSearch} variant="underlined" label={t('search.search')} />
      </div>
      <Card>
        <RecipeDataTable value={selected} onChange={setSelected} loading={loading} recipes={allRecipes} show-headers={headers} search={search} />
        <CardActions className="justify-end">
          <BaseButton color="info" onClick={selectAll();
              openDialog(MODES.export);}>
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              {icons.database}
            </>
            {t('general.export-all')}
          </BaseButton>
        </CardActions>
      </Card>
    </section>
    <section className="mt-10">
      <BaseCardSectionTitle icon={icons.database} section title={t('data-pages.recipes.data-exports')}>
        {t('data-pages.recipes.data-exports-description')}
      </BaseCardSectionTitle>
      <CardActions className="mt-n5 mb-1">
        <BaseButton delete onClick={() => setPurgeExportsDialog(true)} />
      </CardActions>
      <Card>
        <GroupExportData exports={groupExports} />
      </Card>
    </section>
  </Container>
    </>
  );
}
