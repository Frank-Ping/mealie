import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Button, CardContent, Container, Divider, Toolbar } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useAdminApi } from "@/composables/api";
import { alert } from "@/composables/use-toast";
import { useUser, useAllUsers } from "@/composables/use-user";
import type { UserOut } from "@/lib/api/types/user";
import UserInviteDialog from "@/components/Domain/User/UserInviteDialog";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function UsersPage() {
  const { t } = useTranslation();

  const { i18n } = useTranslation();

  useHead({
    title: i18n.t("sidebar.manage-users"),
  });

  const api = useAdminApi();
  const [inviteDialog, setInviteDialog] = useState(undefined);
  const auth = useMealieAuth();

  const user = auth.user; // was computed — plain read stays reactive

  // icons imported directly (was $globals)

  const navigate = useNavigate();

  const isUserOwnAccount = useMemo(() => {
    return state.deleteTargetId === user?.id;
  }, []); // WF4-REVIEW: dependency array

  const ACTIONS_OPTIONS = [
    {
      text: i18n.t("user.reset-locked-users"),
      icon: icons.lock,
      event: "unlock-all-users",
    },
  ];

  const state = /* WF4-REVIEW [J] */ reactive({
    deleteDialog: false,
    deleteTargetId: "",
    search: "",
    groups: [],
    households: [],
    sendTo: "",
  });

  const { users, refreshAllUsers } = useAllUsers();
  const { deleteUser: deleteUserMixin } = useUser(refreshAllUsers);

  function deleteUser(id: string) {
    deleteUserMixin(id);

    if (isUserOwnAccount) {
      auth.getSession();
    }
  }

  function handleRowClick(item: UserOut) {
    navigate(`/admin/manage/users/${item.id}`);
  }

  // ==========================================================
  // Constants / Non-reactive

  const headers = [
    {
      title: i18n.t("user.user-id"),
      align: "start",
      value: "id",
    },
    { title: i18n.t("user.username"), value: "username" },
    { title: i18n.t("user.full-name"), value: "fullName" },
    { title: i18n.t("user.email"), value: "email" },
    { title: i18n.t("group.group"), value: "group" },
    { title: i18n.t("household.household"), value: "household" },
    { title: i18n.t("user.auth-method"), value: "authMethod" },
    { title: i18n.t("user.admin"), value: "admin" },
    { title: i18n.t("general.delete"), value: "actions", sortable: false, align: "center" },
  ];

  async function unlockAllUsers(): Promise<void> {
    const { data } = await api.users.unlockAllUsers(true);

    if (data) {
      const unlocked = data.unlocked ?? 0;

      alert.success(`${unlocked} user(s) unlocked`);
      refreshAllUsers();
    }
  }

  useSeoMeta({
    title: i18n.t("sidebar.manage-users"),
  });

  return (
    <>
  <Container fluid>
    <UserInviteDialog value={inviteDialog} onChange={setInviteDialog} />
    {/* WF4-REVIEW: v-model on complex expression "state.deleteDialog" [J] */}
    <BaseDialog bottom-sheet title={t('general.confirm')} icon={icons.alertCircle} color="error" can-confirm onConfirm={deleteUser(state.deleteTargetId)}>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>

      </>
      <CardContent>
        {(isUserOwnAccount) ? (
          <Alert type="warning" text={t('general.confirm-delete-own-admin-account')} variant="outlined" />
        ) : null}
        {t("general.confirm-delete-generic")}
      </CardContent>
    </BaseDialog>
    <BaseCardSectionTitle title={t('user.user-management')} />
    <section>
      <Toolbar color="transparent" flat className="justify-between">
        <BaseButton to="/admin/manage/users/create" className="mr-2">
          {t("general.create")}
        </BaseButton>
        {($appInfo.allowPasswordLogin) ? (
          <BaseButton className="mr-2" color="info" icon={icons.link} onClick={() => setInviteDialog(true)}>
            {t("group.invite")}
          </BaseButton>
        ) : null}
        <BaseOverflowButton mode="event" variant="elevated" items={ACTIONS_OPTIONS} onUnlockAllUsers={unlockAllUsers} />
      </Toolbar>
      {/* WF4-REVIEW: unmapped <v-data-table> — judgement component, convert manually [J] */}
      <VDataTable headers={headers} items={users || []} item-key="id" className="elevation-0" elevation="0" items-per-page={-1} hide-default-footer disable-pagination search={state.search} onClickRow={($event, { item }) => handleRowClick(item)}>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "end" on <v-icon> */}
          <MdiIcon name={item.admin ? icons.checkboxMarkedCircle : icons.windowClose} color={item.admin ? 'success' : undefined} />
        </>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          <Button icon disabled={+item.id == 1} color="error" variant="text" onClick={(e) => { e.stopPropagation(); state.deleteDialog = true;
              state.deleteTargetId = item.id;; }}>
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={icons.delete} />
          </Button>
        </>
      </VDataTable>
      <Divider />
    </section>
  </Container>
    </>
  );
}
