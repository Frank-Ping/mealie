import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Autocomplete, CardContent, Divider } from "@mui/material";
import { useCategoryStore } from "@/composables/store";
import { useUserApi } from "@/composables/api";
import { validators } from "@/composables/use-validators";
import { fieldTypes } from "@/composables/forms";
import { normalizeFilter } from "@/composables/use-utils";
import { alert } from "@/composables/use-toast";
import type { AutoFormItems } from "@/types/auto-forms";
import type { RecipeCategory } from "@/lib/api/types/recipe";
import type { TableHeaders, TableConfig } from "@/components/global/CrudTable";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function Categories() {
  const { t } = useTranslation();

  const i18n = useI18n();
  const auth = useMealieAuth();
  const groupSlug = useMemo(() => auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  const userApi = useUserApi();

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
      text: i18n.t("data-pages.recipe-count"),
      value: "recipeCount",
      show: true,
      sortable: true,
    },
  ];
  const categoryStore = useCategoryStore();

  /* WF4-REVIEW [J] */ onMounted(() => {
    categoryStore.actions.refresh();
  });

  // ============================================================
  // Form items (shared)
  const formItems = [
    {
      label: i18n.t("general.name"),
      varName: "name",
      type: fieldTypes.TEXT,
      rules: [validators.required],
    },
  ] as AutoFormItems;

  // ============================================================
  // Create
  const createForm = /* WF4-REVIEW [J] */ reactive({
    items: formItems,
    data: { name: "" } as RecipeCategory,
  });

  async function handleCreate(createFormData: RecipeCategory) {
    await categoryStore.actions.createOne(createFormData);
    createForm.data.name = "";
  }

  // ============================================================
  // Edit
  const editForm = /* WF4-REVIEW [J] */ reactive({
    items: formItems,
    data: {} as RecipeCategory,
  });

  async function handleEdit(editFormData: RecipeCategory) {
    await categoryStore.actions.updateOne(editFormData);
    editForm.data = {} as RecipeCategory;
  }

  // ============================================================
  // Bulk Actions
  async function handleBulkAction(event: string, items: RecipeCategory[]) {
    if (event === "delete-selected") {
      const ids = items.filter(item => item.id != null).map(item => item.id!);
      await categoryStore.actions.deleteMany(ids);
    }
  }

  // ============================================================
  // Merge Categories
  const [mergeDialog, setMergeDialog] = useState(false);
  const [fromCategory, setFromCategory] = useState(null);
  const [toCategory, setToCategory] = useState(null);

  const canMerge = computed(() => {
    return fromCategory && toCategory && fromCategory.id !== toCategory.id;
  });

  async function mergeCategories() {
    if (!canMerge || !fromCategory?.id || !toCategory?.id) {
      return;
    }

    const { data } = await userApi.categories.merge(fromCategory.id, toCategory.id);

    if (data) {
      setFromCategory(null);
      setToCategory(null);
      categoryStore.actions.refresh();
    }
  }

  // ============================================================
  // Delete Unused
  const DELETE_UNUSED_PREVIEW_LIMIT = 10;

  const [deleteUnusedDialog, setDeleteUnusedDialog] = useState(false);
  const [unusedCategories, setUnusedCategories] = useState([]);
  const unusedCategoryIds = useMemo(() => unusedCategories.filter(c => c.id != null, []); // WF4-REVIEW: dependency array.map(c => c.id!));
  const unusedCategoryNamesPreview = useMemo(() => unusedCategories.slice(0, DELETE_UNUSED_PREVIEW_LIMIT, []); // WF4-REVIEW: dependency array.map(c => c.name),
  );
  const unusedCategoryNamesRemaining = useMemo(() => Math.max(unusedCategories.length - DELETE_UNUSED_PREVIEW_LIMIT, 0, []); // WF4-REVIEW: dependency array,
  );
  const [loadingEmpty, setLoadingEmpty] = useState(false);

  async function openDeleteUnusedDialog() {
    setLoadingEmpty(true);
    const { data } = await userApi.categories.getEmpty();
    setLoadingEmpty(false);
    setUnusedCategories(data ?? []);

    if (unusedCategories.length === 0) {
      alert.info(i18n.t("data-pages.categories.no-unused-categories"));
      return;
    }

    setDeleteUnusedDialog(true);
  }

  async function confirmDeleteUnused() {
    await categoryStore.actions.deleteMany(unusedCategoryIds);
    setUnusedCategories([]);
  }

  return (
    <>
  <div>
    <BaseDialog value={mergeDialog} onChange={setMergeDialog} bottom-sheet icon={$globals.icons.categories} title={t('data-pages.categories.combine-category')} can-confirm onConfirm={mergeCategories}>
      <CardContent>
        <div>
          {t("data-pages.categories.merge-dialog-text")}
        </div>
        {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
        <Autocomplete value={fromCategory} onChange={setFromCategory} return-object items={categoryStore.store} custom-filter={normalizeFilter} item-title="name" label={t('data-pages.categories.source-category')} />
        {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
        <Autocomplete value={toCategory} onChange={setToCategory} return-object items={categoryStore.store} custom-filter={normalizeFilter} item-title="name" label={t('data-pages.categories.target-category')} />
        {(canMerge && fromCategory && toCategory) ? (
          <template>
            <div className="text-center">
              {t("data-pages.categories.merge-category-example", { category1: fromCategory.name, category2: toCategory.name })}
            </div>
          </template>
        ) : null}
      </CardContent>
    </BaseDialog>
    <BaseDialog value={deleteUnusedDialog} onChange={setDeleteUnusedDialog} bottom-sheet title={t('general.confirm')} icon={$globals.icons.alertCircle} color="error" can-confirm onConfirm={confirmDeleteUnused}>
      <CardContent>
        {t('data-pages.categories.delete-unused-confirm', { count: unusedCategoryIds.length }, unusedCategoryIds.length)}
        <ul style="margin: 0.5rem 0 0; padding-left: 1.25rem; font-size: 0.85rem; color: rgba(var(--v-theme-on-surface), 0.7); line-height: 1.8;">
          {unusedCategoryNamesPreview.map(name => (
            <li key={name}>
              {name}
            </li>
          ))}
        </ul>
        {(unusedCategoryNamesRemaining > 0) ? (
          <div className="text-body-2 pl-2">
            {t('data-pages.delete-unused-more', { count: unusedCategoryNamesRemaining })}
          </div>
        ) : null}
      </CardContent>
    </BaseDialog>
    <GroupDataPage icon={$globals.icons.categories} title={t('data-pages.categories.category-data')} create-title={t('data-pages.categories.new-category')} edit-title={t('data-pages.categories.edit-category')} table-headers={tableHeaders} table-config={tableConfig} data={categoryStore.store || []} bulk-actions={[{ icon: $globals.icons.delete, text: t('general.delete'), event: 'delete-selected' }]} create-form={createForm} edit-form={editForm} onCreateOne={handleCreate} onEditOne={handleEdit} onDeleteOne={categoryStore.actions.deleteOne} onBulkAction={handleBulkAction}>
      <template>
        {(groupSlug && item.recipeCount > 0) ? (
          <NuxtLink to={`/g/${groupSlug}?categories=${item.id}`}>
            {item.recipeCount}
          </NuxtLink>
        ) : (
          <span>
            {item.recipeCount || 0}
          </span>
        )}
      </template>
      <template>
        <BaseButton onClick={mergeDialog = true}>
          <template>
            {$globals.icons.externalLink}
          </template>
          {t("data-pages.combine")}
        </BaseButton>
        <Divider vertical className="mx-2" />
        <BaseButton color="error" loading={loadingEmpty} onClick={openDeleteUnusedDialog}>
          <template>
            {$globals.icons.broom}
          </template>
          {t("data-pages.delete-unused")}
        </BaseButton>
      </template>
    </GroupDataPage>
  </div>
    </>
  );
}
