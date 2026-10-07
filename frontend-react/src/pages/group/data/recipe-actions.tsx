import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { icons } from "@/lib/icons";
import { validators } from "@/composables/use-validators";
import { useGroupRecipeActions } from "@/composables/use-group-recipe-actions";
import type { GroupRecipeActionOut } from "@/lib/api/types/household";
import type { TableHeaders, TableConfig } from "@/components/global/CrudTable";
import type { AutoFormItems } from "@/types/auto-forms";
import { fieldTypes } from "@/composables/forms";

export default function RecipeActions() {
  const { t } = useTranslation();

  const { i18n } = useTranslation();

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
      text: i18n.t("general.title"),
      value: "title",
      show: true,
      sortable: true,
    },
    {
      text: i18n.t("general.url"),
      value: "url",
      show: true,
    },
    {
      text: i18n.t("data-pages.recipe-actions.action-type"),
      value: "actionType",
      show: true,
      sortable: true,
    },
  ];

  const actionStore = useGroupRecipeActions();

  // ============================================================
  // Form items (shared)
  const formItems = useMemo(() => [
    {
      label: i18n.t("general.title"),
      varName: "title",
      type: fieldTypes.TEXT,
      rules: [validators.required],
    },
    {
      label: i18n.t("general.url"),
      varName: "url",
      type: fieldTypes.TEXT,
      rules: [validators.required, validators.url],
    },
    {
      label: i18n.t("data-pages.recipe-actions.action-type"),
      varName: "actionType",
      type: fieldTypes.SELECT,
      options: [
        { text: i18n.t("data-pages.recipe-actions.action-types.link"), value: "link" },
        { text: i18n.t("data-pages.recipe-actions.action-types.post"), value: "post" },
      ],
      selectReturnValue: "value",
      rules: [validators.required],
    },
  ], []); // WF4-REVIEW: dependency array

  // ============================================================
  // Create

  const createForm = /* WF4-REVIEW [J] */ reactive({
    items: formItems,
    data: {} as GroupRecipeActionOut,
  });

  async function handleCreate() {
    await actionStore.actions.createOne(createForm.data);
    createForm.data = {} as GroupRecipeActionOut;
  }

  // ============================================================
  // Edit Action

  const editForm = /* WF4-REVIEW [J] */ reactive({
    items: formItems,
    data: {} as GroupRecipeActionOut,
  });

  async function handleEdit(editFormData: GroupRecipeActionOut) {
    await actionStore.actions.updateOne(editFormData);
    editForm.data = {} as GroupRecipeActionOut;
  }

  // ============================================================
  // Bulk Actions
  async function handleBulkAction(event: string, items: GroupRecipeActionOut[]) {
    console.log("Bulk Action Event:", event, "Items:", items);
    if (event === "delete-selected") {
      const ids = items.filter(item => item.id != null).map(item => item.id!);
      await actionStore.actions.deleteMany(ids);
    }
  }

  return (
    <>
  <div>
    <GroupDataPage icon={icons.link} title={t('data-pages.recipe-actions.recipe-actions-data')} create-title={t('data-pages.recipe-actions.new-recipe-action')} edit-title={t('data-pages.recipe-actions.edit-recipe-action')} table-headers={tableHeaders} table-config={tableConfig} data={actionStore.recipeActions || []} bulk-actions={[{ icon: icons.delete, text: t('general.delete'), event: 'delete-selected' }]} create-form={createForm} edit-form={editForm} initial-sort="title" onCreateOne={handleCreate} onEditOne={handleEdit} onDeleteOne={actionStore.actions.deleteOne} onBulkAction={handleBulkAction} />
  </div>
    </>
  );
}
