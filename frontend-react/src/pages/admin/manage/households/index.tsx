import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, CardContent, Container, Divider, TextField, Toolbar, Tooltip, form } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { fieldTypes } from "@/composables/forms";
import { useGroups } from "@/composables/use-groups";
import { useAdminHouseholds } from "@/composables/use-households";
import { validators } from "@/composables/use-validators";
import type { HouseholdInDB } from "@/lib/api/types/household";
import type { VForm } from "@/types/auto-forms";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function HouseholdsPage() {
  const { t } = useTranslation();

  const i18n = useI18n();

  useSeoMeta({
    title: i18n.t("household.manage-households"),
  });

  const { groups } = useGroups();
  const { households, deleteHousehold, createHousehold } = useAdminHouseholds();

  const [refNewHouseholdForm, setRefNewHouseholdForm] = useState(null);

  const [createDialog, setCreateDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState("");
  const [search, setSearch] = useState("");
  const [updateMode, setUpdateMode] = useState(false);

  const headers = [
    {
      title: i18n.t("household.household"),
      align: "start",
      sortable: false,
      value: "id",
    },
    { title: i18n.t("general.name"), value: "name" },
    { title: i18n.t("group.group"), value: "group" },
    { title: i18n.t("user.total-users"), value: "users" },
    { title: i18n.t("user.webhooks-enabled"), value: "webhookEnable" },
    { title: i18n.t("general.delete"), value: "actions" },
  ];

  const createHouseholdForm = /* WF4-REVIEW [J] */ reactive({
    items: [
      {
        label: i18n.t("household.household-name"),
        varName: "name",
        type: fieldTypes.TEXT,
        rules: [validators.required],
      },
    ],
    data: {
      groupId: "",
      name: "",
    },
  });

  function openDialog() {
    setCreateDialog(true);
    createHouseholdForm.data.name = "";
    createHouseholdForm.data.groupId = "";
  }

  const navigate = useNavigate();

  function handleRowClick(item: HouseholdInDB) {
    navigate(`/admin/manage/households/${item.id}`);
  }

  async function handleCreateSubmit() {
    if (!refNewHouseholdForm?.validate()) {
      return;
    }
    setCreateDialog(false);
    await createHousehold(createHouseholdForm.data);
  }

  return (
    <>
  <Container fluid>
    <BaseDialog value={createDialog} onChange={setCreateDialog} bottom-sheet title={t('household.create-household')} icon={$globals.icons.household}>
      <template />
      <CardContent>
        {/* WF4-REVIEW: validation semantics [J] */}
        <form ref="refNewHouseholdForm" onKeyDown={(e) => { e.preventDefault(); handleCreateSubmit; }}>
          {(groups) ? (
            /* WF4-REVIEW: items/item-title/item-value → MenuItem children; v-model on complex expression "createHouseholdForm.data.groupId" [J] */
            <TextField select {/* WF4-REVIEW: v-model createHouseholdForm.data.groupId */} items={groups} item-title="name" item-value="id" variant="filled" label={t('household.household-group')} rules={[validators.required]} />
          ) : null}
          {/* WF4-REVIEW: v-model on complex expression "createHouseholdForm.data" [J] */}
          <AutoForm {/* WF4-REVIEW: v-model createHouseholdForm.data */} update-mode={updateMode} items={createHouseholdForm.items} />
        </form>
      </CardContent>
      <template>
        <BaseButton type="submit" onClick={handleCreateSubmit}>
          {t("general.create")}
        </BaseButton>
      </template>
    </BaseDialog>
    <BaseDialog value={confirmDialog} onChange={setConfirmDialog} bottom-sheet title={t('general.confirm')} icon={$globals.icons.alertCircle} color="error" can-confirm onConfirm={deleteHousehold(deleteTarget)}>
      <template />
      <CardContent>
        {t("general.confirm-delete-generic")}
      </CardContent>
    </BaseDialog>
    <BaseCardSectionTitle title={t('household.household-management')} />
    <section>
      <Toolbar flat color="transparent" className="justify-between">
        <BaseButton onClick={openDialog}>
          {t("general.create")}
        </BaseButton>
      </Toolbar>
      {(headers && households) ? (
        /* WF4-REVIEW: unmapped <v-data-table> — judgement component, convert manually [J] */
        <VDataTable headers={headers} items={households} item-key="id" className="elevation-0" items-per-page={-1} hide-default-footer disable-pagination search={search} onClickRow={($event, { item }) => handleRowClick(item)}>
          <template>
            {item.users?.length}
          </template>
          <template>
            {item.group}
          </template>
          <template>
            {item.webhooks!.length > 0 ? t("general.yes") : t("general.no")}
          </template>
          <template>
            {/* WF4-REVIEW: activator slot variants [J] */}
            <Tooltip location="bottom" disabled={!(item && item.users!.length > 0)}>
              <template>
                <div {...(props)}>
                  <Button disabled={item && item.users!.length > 0} className="mr-1" icon color="error" variant="text" onClick={(e) => { e.stopPropagation(); confirmDialog = true; deleteTarget = item.id; }}>
                    {/* WF4-REVIEW: icon name resolves via lib/icons */}
                    <MdiIcon name={$globals.icons.delete} />
                  </Button>
                </div>
              </template>
              <span>
                {t("admin.household-delete-note")}
              </span>
            </Tooltip>
          </template>
        </VDataTable>
      ) : null}
      <Divider />
    </section>
  </Container>
    </>
  );
}
