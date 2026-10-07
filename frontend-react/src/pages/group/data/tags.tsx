import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Autocomplete, CardContent, Divider } from "@mui/material";
import { validators } from "@/composables/use-validators";
import { useTagStore } from "@/composables/store";
import { useUserApi } from "@/composables/api";
import { fieldTypes } from "@/composables/forms";
import { normalizeFilter } from "@/composables/use-utils";
import { alert } from "@/composables/use-toast";
import type { AutoFormItems } from "@/types/auto-forms";
import type { RecipeTag } from "@/lib/api/types/recipe";
import type { TableHeaders, TableConfig } from "@/components/global/CrudTable";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function Tags() {
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
  const tagStore = useTagStore();

  /* WF4-REVIEW [J] */ onMounted(() => {
    tagStore.actions.refresh();
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
    data: { name: "" } as RecipeTag,
  });

  async function handleCreate(createFormData: RecipeTag) {
    await tagStore.actions.createOne(createFormData);
    createForm.data.name = "";
  }

  // ============================================================
  // Edit
  const editForm = /* WF4-REVIEW [J] */ reactive({
    items: formItems,
    data: {} as RecipeTag,
  });

  async function handleEdit(editFormData: RecipeTag) {
    await tagStore.actions.updateOne(editFormData);
    editForm.data = {} as RecipeTag;
  }

  // ============================================================
  // Bulk Actions
  async function handleBulkAction(event: string, items: RecipeTag[]) {
    if (event === "delete-selected") {
      const ids = items.filter(item => item.id != null).map(item => item.id!);
      await tagStore.actions.deleteMany(ids);
    }
  }

  // ============================================================
  // Merge Tags
  const [mergeDialog, setMergeDialog] = useState(false);
  const [fromTag, setFromTag] = useState(null);
  const [toTag, setToTag] = useState(null);

  const canMerge = computed(() => {
    return fromTag && toTag && fromTag.id !== toTag.id;
  });

  async function mergeTags() {
    if (!canMerge || !fromTag?.id || !toTag?.id) {
      return;
    }

    const { data } = await userApi.tags.merge(fromTag.id, toTag.id);

    if (data) {
      setFromTag(null);
      setToTag(null);
      tagStore.actions.refresh();
    }
  }

  // ============================================================
  // Delete Unused
  const DELETE_UNUSED_PREVIEW_LIMIT = 10;

  const [deleteUnusedDialog, setDeleteUnusedDialog] = useState(false);
  const [unusedTags, setUnusedTags] = useState([]);
  const unusedTagIds = useMemo(() => unusedTags.filter(t => t.id != null, []); // WF4-REVIEW: dependency array.map(t => t.id!));
  const unusedTagNamesPreview = useMemo(() => unusedTags.slice(0, DELETE_UNUSED_PREVIEW_LIMIT, []); // WF4-REVIEW: dependency array.map(t => t.name));
  const unusedTagNamesRemaining = useMemo(() => Math.max(unusedTags.length - DELETE_UNUSED_PREVIEW_LIMIT, 0, []); // WF4-REVIEW: dependency array);
  const [loadingEmpty, setLoadingEmpty] = useState(false);

  async function openDeleteUnusedDialog() {
    setLoadingEmpty(true);
    const { data } = await userApi.tags.getEmpty();
    setLoadingEmpty(false);
    setUnusedTags(data ?? []);

    if (unusedTags.length === 0) {
      alert.info(i18n.t("data-pages.tags.no-unused-tags"));
      return;
    }

    setDeleteUnusedDialog(true);
  }

  async function confirmDeleteUnused() {
    await tagStore.actions.deleteMany(unusedTagIds);
    setUnusedTags([]);
  }

  return (
    <>
  <div>
    <BaseDialog value={mergeDialog} onChange={setMergeDialog} bottom-sheet icon={$globals.icons.tags} title={t('data-pages.tags.combine-tag')} can-confirm onConfirm={mergeTags}>
      <CardContent>
        <div>
          {t("data-pages.tags.merge-dialog-text")}
        </div>
        {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
        <Autocomplete value={fromTag} onChange={setFromTag} return-object items={tagStore.store} custom-filter={normalizeFilter} item-title="name" label={t('data-pages.tags.source-tag')} />
        {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
        <Autocomplete value={toTag} onChange={setToTag} return-object items={tagStore.store} custom-filter={normalizeFilter} item-title="name" label={t('data-pages.tags.target-tag')} />
        {(canMerge && fromTag && toTag) ? (
          <template>
            <div className="text-center">
              {t("data-pages.tags.merge-tag-example", { tag1: fromTag.name, tag2: toTag.name })}
            </div>
          </template>
        ) : null}
      </CardContent>
    </BaseDialog>
    <BaseDialog value={deleteUnusedDialog} onChange={setDeleteUnusedDialog} bottom-sheet title={t('general.confirm')} icon={$globals.icons.alertCircle} color="error" can-confirm onConfirm={confirmDeleteUnused}>
      <CardContent>
        {t('data-pages.tags.delete-unused-confirm', { count: unusedTagIds.length }, unusedTagIds.length)}
        <ul style="margin: 0.5rem 0 0; padding-left: 1.25rem; font-size: 0.85rem; color: rgba(var(--v-theme-on-surface), 0.7); line-height: 1.8;">
          {unusedTagNamesPreview.map(name => (
            <li key={name}>
              {name}
            </li>
          ))}
        </ul>
        {(unusedTagNamesRemaining > 0) ? (
          <div className="text-body-2 pl-2">
            {t('data-pages.delete-unused-more', { count: unusedTagNamesRemaining })}
          </div>
        ) : null}
      </CardContent>
    </BaseDialog>
    <GroupDataPage icon={$globals.icons.tags} title={t('data-pages.tags.tag-data')} create-title={t('data-pages.tags.new-tag')} edit-title={t('data-pages.tags.edit-tag')} table-headers={tableHeaders} table-config={tableConfig} data={tagStore.store || []} bulk-actions={[{ icon: $globals.icons.delete, text: t('general.delete'), event: 'delete-selected' }]} create-form={createForm} edit-form={editForm} onCreateOne={handleCreate} onEditOne={handleEdit} onDeleteOne={tagStore.actions.deleteOne} onBulkAction={handleBulkAction}>
      <template>
        {(groupSlug && item.recipeCount > 0) ? (
          <NuxtLink to={`/g/${groupSlug}?tags=${item.id}`}>
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
