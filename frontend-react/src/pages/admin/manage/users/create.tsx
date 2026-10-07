import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Card, CardContent, Container, Grid, Paper, TextField, form } from "@mui/material";
import { useAdminApi } from "@/composables/api";
import { useGroups } from "@/composables/use-groups";
import { useUserForm } from "@/composables/use-users";
import { validators } from "@/composables/use-validators";
import type { GroupInDB, UserIn } from "@/lib/api/types/user";
import type { VForm } from "@/types/auto-forms";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Create() {
  const { t } = useTranslation();

  const { userForm } = useUserForm();
  const { groups } = useGroups();
  const navigate = useNavigate();

  const [refNewUserForm, setRefNewUserForm] = useState(null);
  const adminApi = useAdminApi();

  const [selectedGroup, setSelectedGroup] = useState(undefined);
  const households = useMemo(() => selectedGroup?.households || [], []); // WF4-REVIEW: dependency array

  const [newUserData, setNewUserData] = useState({
    username: "",
    fullName: "",
    email: "",
    admin: false,
    group: computed(() => selectedGroup?.name || ""),
    household: "",
    advanced: false,
    canInvite: false,
    canManage: false,
    canOrganize: false,
    password: "",
    authMethod: "Mealie",
  });

  async function handleSubmit() {
    const { valid } = (await refNewUserForm?.validate()) ?? {
      valid: false,
    };

    if (!valid) return;

    const { response } = await adminApi.users.createOne(
      newUserData as UserIn,
    );

    if (response?.status === 201) {
      navigate("/admin/manage/users");
    }
  }

  return (
    <>
  <Container className="narrow-container">
    <BasePageTitle className="mb-2">
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="100%" max-height="125" max-width="125" src="/svgs/manage-profile.svg" />
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t('user.admin-user-creation')}
      </>
    </BasePageTitle>
    <AppToolbar back />
    {/* WF4-REVIEW: validation semantics [J] */}
    <form ref="refNewUserForm" onSubmit={(e) => { e.preventDefault(); handleSubmit; }}>
      <Card variant="outlined">
        <CardContent>
          <Paper>
            <Grid container>
              {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
              <Grid cols="6">
                {/* WF4-REVIEW: items/item-title/item-value → MenuItem children */}
                <TextField select value={selectedGroup} onChange={setSelectedGroup} items={groups || []} item-title="name" return-object variant="filled" label={t('group.user-group')} rules={[validators.required]} />
              </Grid>
              {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
              <Grid cols="6">
                {/* WF4-REVIEW: items/item-title/item-value → MenuItem children; v-model on complex expression "newUserData.household" [J] */}
                <TextField select disabled={!selectedGroup} items={households} item-title="name" item-value="name" variant="filled" label={t('household.user-household')} hint={selectedGroup ? '' : t('group.you-must-select-a-group-before-selecting-a-household')} persistent-hint rules={[validators.required]} />
              </Grid>
            </Grid>
          </Paper>
          <AutoForm value={newUserData} onChange={setNewUserData} items={userForm} />
        </CardContent>
      </Card>
      <div className="d-flex pa-2">
        <BaseButton type="submit" className="ml-auto" />
      </div>
    </form>
  </Container>
    </>
  );
}
