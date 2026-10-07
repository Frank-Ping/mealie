import { useTranslation } from "react-i18next";
import { Button, CardContent, Container, Divider, Toolbar, Tooltip } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { fieldTypes } from "@/composables/forms";
import { useGroups } from "@/composables/use-groups";
import { validators } from "@/composables/use-validators";
import type { GroupInDB } from "@/lib/api/types/user";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function GroupsPage() {
  const { t } = useTranslation();

  const { i18n } = useTranslation();

  useHead({
    title: i18n.t("group.manage-groups"),
  });

  // Set page title
  useSeoMeta({
    title: i18n.t("group.manage-groups"),
  });

  const { groups, deleteGroup, createGroup } = useGroups();

  const state = /* WF4-REVIEW [J] */ reactive({
    createDialog: false,
    confirmDialog: false,
    deleteTarget: "",
    search: "",
    headers: [
      {
        title: i18n.t("group.group"),
        align: "start",
        sortable: false,
        value: "id",
      },
      { title: i18n.t("general.name"), value: "name" },
      { title: i18n.t("group.total-households"), value: "households" },
      { title: i18n.t("user.total-users"), value: "users" },
      { title: i18n.t("general.delete"), value: "actions" },
    ],
    updateMode: false,
    createGroupForm: {
      items: [
        {
          label: i18n.t("group.group-name"),
          varName: "name",
          type: fieldTypes.TEXT,
          rules: [validators.required],
        },
      ],
      data: {
        name: "",
      },
    },
  });

  function openDialog() {
    state.createDialog = true;
    state.createGroupForm.data.name = "";
  }

  function handleRowClick(item: GroupInDB) {
    navigateTo(`/admin/manage/groups/${item.id}`);
  }

  return (
    <>
  <Container fluid>
    {/* WF4-REVIEW: v-model on complex expression "state.createDialog" [J] */}
    <BaseDialog bottom-sheet title={t('group.create-group')} icon={icons.group} can-submit onSubmit={createGroup(state.createGroupForm.data)}>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>

      </>
      <CardContent>
        {/* WF4-REVIEW: v-model on complex expression "state.createGroupForm.data" [J] */}
        <AutoForm update-mode={state.updateMode} items={state.createGroupForm.items} />
      </CardContent>
    </BaseDialog>
    {/* WF4-REVIEW: v-model on complex expression "state.confirmDialog" [J] */}
    <BaseDialog bottom-sheet title={t('general.confirm')} icon={icons.alertCircle} color="error" can-confirm onConfirm={deleteGroup(state.deleteTarget)}>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>

      </>
      <CardContent>
        {t("general.confirm-delete-generic")}
      </CardContent>
    </BaseDialog>
    <BaseCardSectionTitle title={t('group.group-management')} />
    <section>
      <Toolbar flat color="transparent" className="justify-between">
        <BaseButton onClick={openDialog}>
          {t("general.create")}
        </BaseButton>
      </Toolbar>
      {/* WF4-REVIEW: unmapped <v-data-table> — judgement component, convert manually [J] */}
      <VDataTable headers={state.headers} items={groups || []} item-key="id" className="elevation-0" items-per-page={-1} hide-default-footer disable-pagination search={state.search} onClickRow={($event, { item }) => handleRowClick(item)}>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {item.households!.length}
        </>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {item.users!.length}
        </>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {/* WF4-REVIEW: activator slot variants [J] */}
          <Tooltip location="bottom" disabled={!(item && (item.households!.length > 0 || item.users!.length > 0))}>
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              <div {...(props)}>
                <Button disabled={item && (item.households!.length > 0 || item.users!.length > 0)} className="mr-1" icon color="error" variant="text" onClick={(e) => { e.stopPropagation(); state.confirmDialog = true;
                    state.deleteTarget = item.id;; }}>
                  {/* WF4-REVIEW: icon name resolves via lib/icons */}
                  <MdiIcon name={icons.delete} />
                </Button>
              </div>
            </>
            <span>
              {t("admin.group-delete-note")}
            </span>
          </Tooltip>
        </>
      </VDataTable>
      <Divider />
    </section>
  </Container>
    </>
  );
}
