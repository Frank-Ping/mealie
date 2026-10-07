import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, ListItem, ListItemText } from "@mui/material";
import { icons } from "@/lib/icons";
import type { TableHeaders, TableConfig, BulkAction } from "@/components/global/CrudTable";
import type { AutoFormItems } from "@/types/auto-forms";

interface Props {
  icon: string;
  title: string;
  createTitle?: string;
  editTitle?: string;
}

export default function GroupDataPage({ icon, title, createTitle, editTitle }: Props) {
  const { t } = useTranslation();

  const slots = useSlots();

  const emit = defineEmits<{
    (e: "deleteOne", id: string): void;
    (e: "deleteMany", ids: string[]): void;
    (e: "create-one" | "edit-one", data: any): void;
    (e: "bulk-action", event: string, items: any[]): void;
  }>();

  const tableHeaders = defineModel<TableHeaders[]>("tableHeaders", { required: true });
  const createForm = defineModel<{ items: AutoFormItems; data: Record<string, any> }>("createForm", { required: true });
  const createDialog = defineModel("createDialog", { type: Boolean, default: false });

  const editForm = defineModel<{ items: AutoFormItems; data: Record<string, any> }>("editForm", { required: true });
  const editDialog = defineModel("editDialog", { type: Boolean, default: false });

  const props = /* props via generated interface + destructured signature */,
    },
    data: {
      type: Array as PropType<Array<any>>,
      required: true,
    },
    bulkActions: {
      type: Array as PropType<BulkAction[]>,
      required: true,
    },
    initialSort: {
      type: String,
      default: "name",
    },
    onDeleteDialogOpen: {
      type: Function as PropType<(items: any[]) => Promise<void>>,
      default: null,
    },
  });

  // ============================================================
  // Bulk Action Handler
  function handleBulkAction(event: string, items: any[]) {
    if (event === "delete-selected") {
      bulkDeleteEventHandler(items);
      return;
    }
    emit("bulk-action", event, items);
  }

  // ============================================================
  // Create & Edit
  const [createFormValid, setCreateFormValid] = useState(false);
  const [editFormValid, setEditFormValid] = useState(false);
  const itemSlotNames = useMemo(() => Object.keys(slots).filter(slotName => slotName.startsWith("item.")), []); // WF4-REVIEW: dependency array
  const editEventHandler = (item: any) => {
    editForm.data = { ...item };
    editDialog = true;
  };

  // ============================================================
  // Delete Logic
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  async function deleteEventHandler(item: any) {
    setDeleteTarget(item);
    if (onDeleteDialogOpen) {
      await onDeleteDialogOpen([item]);
    }
    setDeleteDialog(true);
  }

  // ============================================================
  // Bulk Delete Logic
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  async function bulkDeleteEventHandler(items: Array<any>) {
    setBulkDeleteTarget(items);
    if (onDeleteDialogOpen) {
      await onDeleteDialogOpen(items);
    }
    setBulkDeleteDialog(true);
    console.log("Bulk Delete Event Handler", items);
  }

  return (
    <>
  <BaseDialog value={createDialog} onChange={/* WF4-REVIEW: setter */ setCreateDialog} title={createTitle || t('general.create')} icon={icon} color="primary" max-width="600px" width="100%" submit-disabled={!createFormValid} can-confirm onConfirm={emit('create-one', createForm.data)}>
    <div className="mx-2 mt-2">
      <slot name="create-dialog-top" />
      {/* WF4-REVIEW: v-model on complex expression "createForm.data" [J] */}
      <AutoForm value={createFormValid} onChange={setCreateFormValid} items={createForm.items} className="py-2" />
    </div>
  </BaseDialog>
  <BaseDialog value={editDialog} onChange={/* WF4-REVIEW: setter */ setEditDialog} title={editTitle || t('general.edit')} icon={icon} color="primary" max-width="600px" width="100%" submit-disabled={!editFormValid} can-confirm onConfirm={emit('edit-one', editForm.data)}>
    <div className="mx-2 mt-2">
      <slot name="edit-dialog-top" />
      {/* WF4-REVIEW: v-model on complex expression "editForm.data" [J] */}
      <AutoForm value={editFormValid} onChange={setEditFormValid} items={editForm.items} className="py-2" />
    </div>
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      <slot name="edit-dialog-custom-action" />
    </>
  </BaseDialog>
  <BaseDialog value={deleteDialog} onChange={setDeleteDialog} bottom-sheet title={t('general.confirm')} icon={icons.alertCircle} color="error" can-confirm onConfirm={onDeleteOne?.(deleteTarget.id)}>
    <CardContent>
      {t("general.confirm-delete-generic")}
      {(deleteTarget) ? (
        <p className="mt-4 mb-0 font-weight-bold">
          {deleteTarget.name || deleteTarget.title || deleteTarget.id}
        </p>
      ) : null}
      <slot name="delete-dialog-bottom" />
    </CardContent>
  </BaseDialog>
  <BaseDialog value={bulkDeleteDialog} onChange={setBulkDeleteDialog} bottom-sheet width="650px" title={t('general.confirm')} icon={icons.alertCircle} color="error" can-confirm onConfirm={onBulkAction?.('delete-selected', bulkDeleteTarget)}>
    <CardContent>
      <p className="h4">
        {t('general.confirm-delete-generic-items')}
      </p>
      <Card variant="outlined">
        {/* WF4-REVIEW: unmapped <v-virtual-scroll> — judgement component, convert manually [J] */}
        <VVirtualScroll height="400" item-height="25" items={bulkDeleteTarget}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem className="pb-2">
              {/* WF4-REVIEW: content → primary prop */}
              <ListItemText>
                {item.name || item.title || item.id}
              </ListItemText>
            </ListItem>
          </>
        </VVirtualScroll>
      </Card>
      <slot name="delete-dialog-bottom" />
    </CardContent>
  </BaseDialog>
  <BaseCardSectionTitle icon={icon} section title={title} />
  <CrudTable headers={tableHeaders} table-config={tableConfig} data={data || []} bulk-actions={bulkActions} initial-sort={initialSort} onEditOne={editEventHandler} onDeleteOne={deleteEventHandler} onBulkAction={handleBulkAction}>
    {itemSlotNames.map(slotName => (
      /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
      <>
        <slot name={slotName} {...(slotProps)} />
      </>
    ))}
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      {/* WF4-REVIEW: assignment handler "createDialog = true" — target not a tracked ref [J] */}
      <BaseButton create onClick={createDialog = true}>
        {t("general.create")}
      </BaseButton>
      <slot name="table-button-row" />
    </>
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      <slot name="table-button-bottom" />
    </>
  </CrudTable>
    </>
  );
}
