import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Container, FormControlLabel } from "@mui/material";
import { useUserApi } from "@/composables/api";
import type { UserOut } from "@/lib/api/types/user";
import UserAvatar from "@/components/Domain/User/UserAvatar";

export const handle = {
  middleware: ["auth"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Members() {
  const { t } = useTranslation();

  const api = useUserApi();
  const { i18n } = useTranslation();

  useSeoMeta({
    title: i18n.t("profile.members"),
  });

  const [members, setMembers] = useState([]);

  const headers = [
    { title: "", value: "avatar", sortable: false, align: "center" },
    { title: i18n.t("user.username"), value: "username" },
    { title: i18n.t("user.full-name"), value: "fullName" },
    { title: i18n.t("user.admin"), value: "admin" },
    { title: i18n.t("group.manage"), value: "manage", sortable: false, align: "center" },
    { title: i18n.t("settings.organize"), value: "organize", sortable: false, align: "center" },
    { title: i18n.t("group.invite"), value: "invite", sortable: false, align: "center" },
    { title: i18n.t("group.manage-household"), value: "manageHousehold", sortable: false, align: "center" },
  ];

  async function refreshMembers() {
    const { data } = await api.households.fetchMembers();
    if (data) {
      setMembers(data.items);
    }
  }

  async function setPermissions(user: UserOut) {
    const payload = {
      userId: user.id,
      canInvite: user.canInvite,
      canManageHousehold: user.canManageHousehold,
      canManage: user.canManage,
      canOrganize: user.canOrganize,
    };

    await api.households.setMemberPermissions(payload);
  }

  /* WF4-REVIEW [J] */ onMounted(async () => {
    await refreshMembers();
  });

  return (
    <>
  <Container>
    <BasePageTitle divider>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="100%" max-height="125" max-width="125" src="/svgs/manage-members.svg" />
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t('group.manage-members')}
      </>
      <i18n-t keypath="group.manage-members-description">
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          <b>
            {t('group.manage')}
          </b>
        </>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          <b>
            {t('settings.organize')}
          </b>
        </>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          <b>
            {t('group.invite')}
          </b>
        </>
      </i18n-t>
      <Container className="mt-1 px-0">
        <nuxt-link className="text-center text-primary" to={`/user/profile/edit`}>
          {t('group.looking-to-update-your-profile')}
        </nuxt-link>
      </Container>
    </BasePageTitle>
    {/* WF4-REVIEW: unmapped <v-data-table> — judgement component, convert manually [J] */}
    <VDataTable headers={headers} items={members || []} item-key="id" className="elevation-0" items-per-page={-1} hide-default-footer disable-pagination>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {(item) ? (
          <UserAvatar tooltip={false} user-id={item.id} />
        ) : null}
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {item && item.admin ? t('user.admin') : t('user.user')}
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {(item) ? (
          <div className="d-flex justify-center">
            {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "item.canManageHousehold" [J] */}
            <FormControlLabel disabled={item.id === sessionUser?.id || item.admin} color="primary" className="" style="max-width: 30px" hide-details onChange={setPermissions(item)} />
          </div>
        ) : null}
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {(item) ? (
          <div className="d-flex justify-center">
            {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "item.canManage" [J] */}
            <FormControlLabel disabled={item.id === sessionUser?.id || item.admin} className="" style="max-width: 30px" hide-details color="primary" onChange={setPermissions(item)} />
          </div>
        ) : null}
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {(item) ? (
          <div className="d-flex justify-center">
            {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "item.canOrganize" [J] */}
            <FormControlLabel disabled={item.id === sessionUser?.id || item.admin} className="" style="max-width: 30px" hide-details color="primary" onChange={setPermissions(item)} />
          </div>
        ) : null}
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {(item) ? (
          <div className="d-flex justify-center">
            {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "item.canInvite" [J] */}
            <FormControlLabel disabled={item.id === sessionUser?.id || item.admin} className="" style="max-width: 30px" hide-details color="primary" onChange={setPermissions(item)} />
          </div>
        ) : null}
      </>
    </VDataTable>
  </Container>
    </>
  );
}
