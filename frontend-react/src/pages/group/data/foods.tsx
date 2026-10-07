import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Autocomplete, Card, CardContent, CardHeader, ListItem, ListItemText } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import type { LocaleObject } from "@nuxtjs/i18n";
import RecipeDataAliasManagerDialog from "@/components/Domain/Recipe/RecipeDataAliasManagerDialog";
import RecipeDataSubstitutionManagerDialog from "@/components/Domain/Recipe/RecipeDataSubstitutionManagerDialog";
import type { ReverseSubstitutionChanges } from "@/components/Domain/Recipe/RecipeDataSubstitutionManagerDialog";
import { validators } from "@/composables/use-validators";
import { useUserApi } from "@/composables/api";
import type {
  CreateIngredientFood,
  IngredientFood,
  IngredientFoodAlias,
  IngredientFoodSubstitution,
} from "@/lib/api/types/recipe";
import MultiPurposeLabel from "@/components/Domain/ShoppingList/MultiPurposeLabel";
import { useLocales } from "@/composables/use-locales";
import { normalizeFilter } from "@/composables/use-utils";
import { useFoodStore, useLabelStore } from "@/composables/store";
import type { MultiPurposeLabelOut } from "@/lib/api/types/labels";
import type { AutoFormItems } from "@/types/auto-forms";
import type { TableHeaders, TableConfig } from "@/components/global/CrudTable";
import { fieldTypes } from "@/composables/forms";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function Foods() {
  const { t } = useTranslation();

  interface CreateIngredientFoodWithOnHand extends CreateIngredientFood {
    onHand: boolean;
    householdsWithIngredientFood: string[];
  }

  interface IngredientFoodWithOnHand extends IngredientFood {
    onHand: boolean;
  }

  const userApi = useUserApi();
  const i18n = useI18n();
  const auth = useMealieAuth();
  const tableConfig: TableConfig = {
    hideColumns: true,
    canExport: true,
  };
  const tableHeaders: TableHeaders[] = [
    {
      text: i18n.t("general.id"),
      value: "id",
      show: false,
    },
    {
      text: i18n.t("general.name"),
      value: "name",
      show: true,
      sortable: true,
    },
    {
      text: i18n.t("general.plural-name"),
      value: "pluralName",
      show: true,
      sortable: true,
    },
    {
      text: i18n.t("recipe.description"),
      value: "description",
      show: true,
    },
    {
      text: i18n.t("shopping-list.label"),
      value: "label",
      show: true,
      sortable: true,
      sort: (label1: MultiPurposeLabelOut | null, label2: MultiPurposeLabelOut | null) => {
        const label1Name = label1?.name || "";
        const label2Name = label2?.name || "";
        return label1Name.localeCompare(label2Name);
      },
    },
    {
      text: i18n.t("tool.on-hand"),
      value: "onHand",
      show: true,
      sortable: true,
    },
    {
      text: i18n.t("data-pages.foods.substitutions"),
      value: "substitutions",
      show: true,
      sortable: true,
      sort: (subs1: IngredientFoodSubstitution[] | null, subs2: IngredientFoodSubstitution[] | null) => {
        return (subs1?.length || 0) - (subs2?.length || 0);
      },
    },
    {
      text: i18n.t("general.date-added"),
      value: "createdAt",
      show: false,
      sortable: true,
    },
  ];

  const userHousehold = useMemo(() => auth.user?.householdSlug || "", []); // WF4-REVIEW: dependency array
  const userGroup = useMemo(() => auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  const foodStore = useFoodStore();
  const foods = useMemo(() => foodStore.store.map((food, []); // WF4-REVIEW: dependency array => {
      const onHand = food.householdsWithIngredientFood?.includes(userHousehold) || false;
      return { ...food, onHand } as IngredientFoodWithOnHand;
    }),
  );

  /* WF4-REVIEW [J] */ onMounted(() => {
    foodStore.actions.refresh();
  });

  // ============================================================
  // Labels
  const labelStore = useLabelStore();
  const { store: allLabels } = labelStore;
  const labelOptions = useMemo(() => allLabels.map(label => ({ text: label.name, value: label.id }, []); // WF4-REVIEW: dependency array) || []);

  // ============================================================
  // Form items (shared)
  const formItems = useMemo(() => [
    {
      label: i18n.t("general.name", []); // WF4-REVIEW: dependency array,
      varName: "name",
      type: fieldTypes.TEXT,
      rules: [validators.required],
    },
    {
      label: i18n.t("general.plural-name"),
      varName: "pluralName",
      type: fieldTypes.TEXT,
    },
    {
      label: i18n.t("recipe.description"),
      varName: "description",
      type: fieldTypes.TEXT,
    },
    {
      label: i18n.t("data-pages.foods.food-label"),
      varName: "labelId",
      type: fieldTypes.SELECT,
      options: labelOptions,
      selectReturnValue: "value",
    },
    {
      label: i18n.t("tool.on-hand"),
      varName: "onHand",
      type: fieldTypes.BOOLEAN,
      hint: i18n.t("data-pages.foods.on-hand-checkbox-label"),
    },
  ]);

  // ===============================================================
  // Create

  const createForm = /* WF4-REVIEW [J] */ reactive({
    get items() {
      return formItems;
    },
    data: { name: "", onHand: false, householdsWithIngredientFood: [] } as CreateIngredientFoodWithOnHand,
  });

  async function handleCreate() {
    if (!createForm.data || !createForm.data.name) {
      return;
    }

    if (createForm.data.onHand) {
      createForm.data.householdsWithIngredientFood = [userHousehold];
    }

    // @ts-expect-error the createOne function erroneously expects an id because it uses the IngredientFood type
    await foodStore.actions.createOne(createForm.data);
    createForm.data = {
      name: "",
      onHand: false,
      householdsWithIngredientFood: [],
    };
  }

  // ===============================================================
  // Edit

  const editForm = /* WF4-REVIEW [J] */ reactive({
    get items() {
      return formItems;
    },
    data: {} as IngredientFoodWithOnHand,
  });

  async function handleEdit() {
    if (!editForm.data) {
      return;
    }
    if (!editForm.data.householdsWithIngredientFood) {
      editForm.data.householdsWithIngredientFood = [];
    }

    const foodId = editForm.data.id;

    if (editForm.data.onHand && !editForm.data.householdsWithIngredientFood.includes(userHousehold)) {
      editForm.data.householdsWithIngredientFood.push(userHousehold);
    }
    else if (!editForm.data.onHand && editForm.data.householdsWithIngredientFood.includes(userHousehold)) {
      const idx = editForm.data.householdsWithIngredientFood.indexOf(userHousehold);
      if (idx !== -1) editForm.data.householdsWithIngredientFood.splice(idx, 1);
    }

    await foodStore.actions.updateOne(editForm.data);
    editForm.data = {} as IngredientFoodWithOnHand;
    await applyReverseSubstitutions(foodId);
  }

  // ============================================================
  // Bulk Actions
  async function handleBulkAction(event: string, items: IngredientFoodWithOnHand[]) {
    if (event === "delete-selected") {
      const ids = items.map(item => item.id);
      await foodStore.actions.deleteMany(ids);
      setAffectedRecipes([]);
      setAffectedRecipesTotal(0);
      setAffectedRecipesMoreLink("");
    }
    else if (event === "assign-selected") {
      bulkAssignEventHandler(items);
    }
  }

  // ============================================================
  // Alias Manager

  const [aliasManagerDialog, setAliasManagerDialog] = useState(false);
  function updateFoodAlias(newAliases: IngredientFoodAlias[]) {
    if (!editForm.data) {
      return;
    }
    editForm.data.aliases = newAliases;
    setAliasManagerDialog(false);
  }

  // ============================================================
  // Substitution Manager

  const [substitutionManagerDialog, setSubstitutionManagerDialog] = useState(false);

  // reverse substitutions live on other foods, so they can't ride along with the food being edited.
  // they're held until the edit is confirmed, and tagged with the food they were built for so
  // a cancelled edit can't leak them onto the next food the user opens
  const [pendingReverseSubstitutions, setPendingReverseSubstitutions] = useState(null);

  function updateFoodSubstitutions(
    newSubstitutions: IngredientFoodSubstitution[],
    reverseChanges: ReverseSubstitutionChanges,
  ) {
    if (!editForm.data) {
      return;
    }
    editForm.data.substitutions = newSubstitutions;
    setPendingReverseSubstitutions(reverseChanges.add.length || reverseChanges.remove.length
      ? { foodId: editForm.data.id, ...reverseChanges }
      : null);
    setSubstitutionManagerDialog(false);
  }

  async function applyReverseSubstitutions(foodId: string) {
    const pending = pendingReverseSubstitutions;
    setPendingReverseSubstitutions(null);
    if (!pending || !foodId || pending.foodId !== foodId) {
      return;
    }

    let updated = false;
    for (const reverseFoodId of [...pending.add, ...pending.remove]) {
      const reverseFood = foodStore.store.find(food => food.id === reverseFoodId);
      if (!reverseFood) {
        continue;
      }

      // rebuilt from what's on the other food right now, so a stale dialog can't resurrect
      // a row someone else removed in the meantime
      const others = (reverseFood.substitutions || []).filter(sub => sub.substituteFoodId !== foodId);
      const substitutions = pending.add.includes(reverseFoodId)
        ? [...others, { substituteFoodId: foodId }]
        : others;

      if (substitutions.length === (reverseFood.substitutions || []).length) {
        continue;
      }

      const payload = { ...reverseFood, substitutions };
      await userApi.foods.updateOne(reverseFoodId, payload);
      updated = true;
    }

    if (updated) {
      await foodStore.actions.refresh();
    }
  }

  // ============================================================
  // Delete Foods

  // fetch affected recipes before confirming deletion
  const [affectedRecipes, setAffectedRecipes] = useState([]);
  const [affectedRecipesTotal, setAffectedRecipesTotal] = useState(0);
  const [affectedRecipesMoreLink, setAffectedRecipesMoreLink] = useState("");

  async function onDeleteDialogOpen(items: IngredientFoodWithOnHand[]) {
    const ids = items.map(item => item.id);
    const { data } = await userApi.recipes.search({ foods: ids, perPage: 5 });
    setAffectedRecipes((data?.items ?? []).map(r => ({
      name: r.name ?? "",
      slug: r.slug ?? "",
      url: `/g/${userGroup}/r/${r.slug}`,
    })));
    setAffectedRecipesTotal(data?.total ?? 0);
    setAffectedRecipesMoreLink(`/g/${userGroup}?${ids.map(id => `foods=${id}`).join("&")}`);
  }

  // ============================================================
  // Merge Foods

  const [mergeDialog, setMergeDialog] = useState(false);
  const [fromFood, setFromFood] = useState(null);
  const [toFood, setToFood] = useState(null);

  const canMerge = computed(() => {
    return fromFood && toFood && fromFood.id !== toFood.id;
  });

  async function mergeFoods() {
    if (!canMerge || !fromFood || !toFood) {
      return;
    }

    const { data } = await userApi.foods.merge(fromFood.id, toFood.id);

    if (data) {
      foodStore.actions.refresh();
    }
  }

  // ============================================================
  // Seed

  const [seedDialog, setSeedDialog] = useState(false);
  const [locale, setLocale] = useState("");

  const { locales: LOCALES, locale: currentLocale } = useLocales();

  /* WF4-REVIEW [J] */ onMounted(() => {
    setLocale(currentLocale);
    foodStore.actions.refresh();
  });

  const locales = LOCALES.filter(locale =>
    (i18n.locales as LocaleObject[]).map(i18nLocale => i18nLocale.code).includes(locale as any),
  );

  async function seedDatabase() {
    const { data } = await userApi.seeders.foods({ locale: locale });

    if (data) {
      // seeding foods also creates the labels that group them
      foodStore.actions.refresh();
      labelStore.actions.refresh();
    }
  }

  // ============================================================
  // Bulk Assign Labels
  const [bulkAssignLabelDialog, setBulkAssignLabelDialog] = useState(false);
  const [bulkAssignTarget, setBulkAssignTarget] = useState([]);
  const [bulkAssignLabelId, setBulkAssignLabelId] = useState(undefined);

  function bulkAssignEventHandler(selection: IngredientFoodWithOnHand[]) {
    setBulkAssignTarget(selection);
    setBulkAssignLabelDialog(true);
  }

  async function assignSelected() {
    if (!bulkAssignLabelId) {
      return;
    }
    for (const item of bulkAssignTarget) {
      item.labelId = bulkAssignLabelId;
      await foodStore.actions.updateOne(item);
    }
    setBulkAssignTarget([]);
    setBulkAssignLabelId(undefined);
    foodStore.actions.refresh();
  }

  return (
    <>
  <div>
    <BaseDialog value={mergeDialog} onChange={setMergeDialog} bottom-sheet icon={$globals.icons.foods} title={t('data-pages.foods.combine-food')} can-confirm onConfirm={mergeFoods}>
      <CardContent>
        <div>
          {t("data-pages.foods.merge-dialog-text")}
        </div>
        {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
        <Autocomplete value={fromFood} onChange={setFromFood} return-object items={foods} custom-filter={normalizeFilter} item-title="name" label={t('data-pages.foods.source-food')} />
        {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
        <Autocomplete value={toFood} onChange={setToFood} return-object items={foods} custom-filter={normalizeFilter} item-title="name" label={t('data-pages.foods.target-food')} />
        {(canMerge && fromFood && toFood) ? (
          <template>
            <div className="text-center">
              {t("data-pages.foods.merge-food-example", { food1: fromFood.name, food2: toFood.name })}
            </div>
          </template>
        ) : null}
      </CardContent>
    </BaseDialog>
    <BaseDialog value={seedDialog} onChange={setSeedDialog} bottom-sheet icon={$globals.icons.foods} title={t('data-pages.seed-data')} can-confirm onConfirm={seedDatabase}>
      <CardContent>
        <div className="pb-2">
          {t("data-pages.foods.seed-dialog-text")}
        </div>
        {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
        <Autocomplete value={locale} onChange={setLocale} items={locales} item-title="name" custom-filter={normalizeFilter} label={t('data-pages.select-language')} className="my-3" hide-details variant="outlined" offset>
          <template>
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem {...(props)}>
              {/* WF4-REVIEW: content → secondary prop */}
              <ListItemText>
                {item.raw.progress}
                %
                {t("language-dialog.translated")}
              </ListItemText>
            </ListItem>
          </template>
        </Autocomplete>
        {(foods && foods.length > 0) ? (
          <Alert type="error" className="mb-0 text-body-2">
            {t("data-pages.foods.seed-dialog-warning")}
          </Alert>
        ) : null}
      </CardContent>
    </BaseDialog>
    {(editForm.data) ? (
      <RecipeDataAliasManagerDialog value={aliasManagerDialog} onChange={setAliasManagerDialog} data={editForm.data} onSubmit={updateFoodAlias} onCancel={aliasManagerDialog = false} />
    ) : null}
    {(editForm.data) ? (
      <RecipeDataSubstitutionManagerDialog value={substitutionManagerDialog} onChange={setSubstitutionManagerDialog} data={editForm.data} onSubmit={updateFoodSubstitutions} onCancel={substitutionManagerDialog = false} />
    ) : null}
    <BaseDialog value={bulkAssignLabelDialog} onChange={setBulkAssignLabelDialog} bottom-sheet title={t('data-pages.labels.assign-label')} icon={$globals.icons.tags} can-confirm onConfirm={assignSelected}>
      <CardContent>
        <Card className="mb-4">
          {/* WF4-REVIEW: title text moves to the title prop */}
          <CardHeader>
            {t("general.caution")}
          </CardHeader>
          <CardContent>
            {t("data-pages.foods.label-overwrite-warning")}
          </CardContent>
        </Card>
        {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
        <Autocomplete value={bulkAssignLabelId} onChange={setBulkAssignLabelId} clearable items={allLabels} custom-filter={normalizeFilter} item-value="id" item-title="name" label={t('data-pages.foods.food-label')} />
        <Card variant="outlined">
          {/* WF4-REVIEW: unmapped <v-virtual-scroll> — judgement component, convert manually [J] */}
          <VVirtualScroll height="400" item-height="25" items={bulkAssignTarget}>
            <template>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem className="pb-2">
                {/* WF4-REVIEW: content → primary prop */}
                <ListItemText>
                  {item.name}
                </ListItemText>
              </ListItem>
            </template>
          </VVirtualScroll>
        </Card>
      </CardContent>
    </BaseDialog>
    <GroupDataPage icon={$globals.icons.foods} title={t('data-pages.foods.food-data')} create-title={t('data-pages.foods.create-food')} edit-title={t('data-pages.foods.edit-food')} table-headers={tableHeaders} table-config={tableConfig} data={foods || []} bulk-actions={[
        { icon: $globals.icons.delete, text: t('general.delete'), event: 'delete-selected' },
        { icon: $globals.icons.tags, text: t('data-pages.labels.assign-label'), event: 'assign-selected' },
      ]} create-form={createForm} edit-form={editForm} on-delete-dialog-open={onDeleteDialogOpen} onCreateOne={handleCreate} onEditOne={handleEdit} onDeleteOne={foodStore.actions.deleteOne} onBulkAction={handleBulkAction}>
      <template>
        <BaseButton onClick={mergeDialog = true}>
          <template>
            {$globals.icons.externalLink}
          </template>
          {t("data-pages.combine")}
        </BaseButton>
      </template>
      <template>
        {(item.label) ? (
          <MultiPurposeLabel label={item.label}>
            {item.label.name}
          </MultiPurposeLabel>
        ) : null}
      </template>
      <template>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={item.onHand ? $globals.icons.check : $globals.icons.close} color={item.onHand ? 'success' : undefined} />
      </template>
      <template>
        {item.substitutions ? item.substitutions.length : 0}
      </template>
      <template>
        {item.createdAt ? $d(new Date(item.createdAt)) : ""}
      </template>
      <template>
        <BaseButton onClick={seedDialog = true}>
          <template>
            {$globals.icons.database}
          </template>
          {t("data-pages.seed")}
        </BaseButton>
      </template>
      <template>
        <BaseButton edit onClick={aliasManagerDialog = true}>
          {t("data-pages.manage-aliases")}
        </BaseButton>
        <BaseButton edit onClick={substitutionManagerDialog = true}>
          {t("data-pages.foods.manage-substitutions")}
        </BaseButton>
      </template>
      <template>
        {(affectedRecipes.length > 0) ? (
          <Alert type="warning" density="compact" className="mt-4 mb-0">
            {t("data-pages.foods.delete-affects-recipes", { count: affectedRecipesTotal })}
            <ul className="mt-1 pl-5 mb-0">
              {affectedRecipes.slice(0, 5).map(recipe => (
                <li key={recipe.slug}>
                  <NuxtLink to={recipe.url} className="text-white">
                    {recipe.name}
                  </NuxtLink>
                </li>
              ))}
            </ul>
            {(affectedRecipesTotal > 5) ? (
              <NuxtLink to={affectedRecipesMoreLink} className="text-white d-inline-block mt-1">
                {t("data-pages.foods.delete-affects-recipes-more", { count: affectedRecipesTotal })}
              </NuxtLink>
            ) : null}
          </Alert>
        ) : null}
      </template>
    </GroupDataPage>
  </div>
    </>
  );
}
