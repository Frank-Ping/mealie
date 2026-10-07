import { useTranslation } from "react-i18next";
import { icons } from "@/lib/icons";
import { validators } from "@/composables/use-validators";
import MultiPurposeLabel from "@/components/Domain/ShoppingList/MultiPurposeLabel";
import { fieldTypes } from "@/composables/forms";
import type { MultiPurposeLabelSummary } from "@/lib/api/types/labels";
import type { AutoFormItems } from "@/types/auto-forms";
import { useLabelStore } from "@/composables/store";
import type { TableHeaders, TableConfig } from "@/components/global/CrudTable";

export default function Labels() {
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
      text: i18n.t("general.name"),
      value: "name",
      show: true,
      sortable: true,
    },
  ];

  const labelStore = useLabelStore();

  // ============================================================
  // Form items (shared)
  const formItems: AutoFormItems = [
    {
      label: i18n.t("general.name"),
      varName: "name",
      type: fieldTypes.TEXT,
      rules: [validators.required],
    },
    {
      label: i18n.t("general.color"),
      varName: "color",
      type: fieldTypes.COLOR,
    },
  ];

  // ============================================================
  // Create
  const createForm = /* WF4-REVIEW [J] */ reactive({
    items: formItems,
    data: {
      name: "",
      color: "",
    } as MultiPurposeLabelSummary,
  });

  async function handleCreate(createFormData: MultiPurposeLabelSummary) {
    await labelStore.actions.createOne(createFormData);
    createForm.data = { name: "", color: "#7417BE" } as MultiPurposeLabelSummary;
  }

  // ============================================================
  // Edit
  const editForm = /* WF4-REVIEW [J] */ reactive({
    items: formItems,
    data: {} as MultiPurposeLabelSummary,
  });

  async function handleEdit(editFormData: MultiPurposeLabelSummary) {
    await labelStore.actions.updateOne(editFormData);
    editForm.data = {} as MultiPurposeLabelSummary;
  }

  // ============================================================
  // Bulk Actions
  async function handleBulkAction(event: string, items: MultiPurposeLabelSummary[]) {
    if (event === "delete-selected") {
      const ids = items.filter(item => item.id != null).map(item => item.id!);
      await labelStore.actions.deleteMany(ids);
    }
  }

  return (
    <>
  <div>
    <GroupDataPage icon={icons.tags} title={t('data-pages.labels.labels')} create-title={t('data-pages.labels.new-label')} edit-title={t('data-pages.labels.edit-label')} table-headers={tableHeaders} table-config={tableConfig} data={labelStore.store || []} bulk-actions={[{ icon: icons.delete, text: t('general.delete'), event: 'delete-selected' }]} create-form={createForm} edit-form={editForm} onCreateOne={handleCreate} onEditOne={handleEdit} onDeleteOne={labelStore.actions.deleteOne} onBulkAction={handleBulkAction}>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {(item) ? (
          <MultiPurposeLabel label={item}>
            {item.name}
          </MultiPurposeLabel>
        ) : null}
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {(createForm.data.name) ? (
          <MultiPurposeLabel label={createForm.data} className="my-2" />
        ) : null}
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {(editForm.data.name) ? (
          <MultiPurposeLabel label={editForm.data} className="my-2" />
        ) : null}
      </>
    </GroupDataPage>
  </div>
    </>
  );
}
