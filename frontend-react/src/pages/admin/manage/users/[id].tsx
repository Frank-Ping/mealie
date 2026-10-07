import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Card, CardActions, CardContent, Container, Grid, Paper, TextField, form } from "@mui/material";
import { useAdminApi, useUserApi } from "@/composables/api";
import { useGroups } from "@/composables/use-groups";
import { useAdminHouseholds } from "@/composables/use-households";
import { alert } from "@/composables/use-toast";
import { useUserForm } from "@/composables/use-users";
import { validators } from "@/composables/use-validators";
import type { UserOut } from "@/lib/api/types/user";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Id() {
  const { t } = useTranslation();

  const { userForm } = useUserForm();
  const { groups } = useGroups();
  const { useHouseholdsInGroup } = useAdminHouseholds();
  const i18n = useI18n();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]

  const userId = route.params.id as string;

  // ==============================================
  // New User Form

  const [refNewUserForm, setRefNewUserForm] = useState(null);

  const adminApi = useAdminApi();

  const [user, setUser] = useState(null);
  const households = useHouseholdsInGroup(computed(() => user?.groupId || ""));

  const disabledFields = computed(() => {
    return user?.authMethod !== "Mealie" ? ["admin"] : [];
  });

  const [userError, setUserError] = useState(false);

  const [resetUrl, setResetUrl] = useState(null);
  const [generatingToken, setGeneratingToken] = useState(false);

  /* WF4-REVIEW [J] */ onMounted(async () => {
    const { data, error } = await adminApi.users.getOne(userId);

    if (error?.response?.status === 404) {
      alert.error(i18n.t("user.user-not-found"));
      setUserError(true);
    }

    if (data) {
      setUser(data);
    }
  });

  async function handleSubmit() {
    if (!refNewUserForm?.validate() || setUser(== null) return);

    const { response, data } = await adminApi.users.updateOne(user.id, user);

    if (response?.status === 200 && data) {
      setUser(data);
    }
  }

  async function handlePasswordReset() {
    if (setUser(== null) return);
    setGeneratingToken(true);

    const { response, data } = await adminApi.users.generatePasswordResetToken({ email: user.email });

    if (response?.status === 201 && data) {
      const token: string = data.token;
      setResetUrl(`${window.location.origin}/reset-password/?token=${token}`);
    }

    setGeneratingToken(false);
  }

  const userApi = useUserApi();
  async function sendResetEmail() {
    if (!user?.email) return;
    const { response } = await userApi.email.sendForgotPassword({ email: user.email });
    if (response && response.status === 200) {
      alert.success(i18n.t("profile.email-sent"));
    }
    else {
      alert.error(i18n.t("profile.error-sending-email"));
    }
  }

  return (
    <>
  {(user) ? (
    <Container className="narrow-container">
      <BasePageTitle>
        <template>
          {/* WF4-REVIEW: cover → objectFit */}
          <Box component="img" width="100%" max-height="125" max-width="125" src="/svgs/manage-profile.svg" />
        </template>
        <template>
          {t("user.admin-user-management")}
        </template>
        {t("user.changes-reflected-immediately")}
      </BasePageTitle>
      <AppToolbar back />
      {(!userError) ? (
        /* WF4-REVIEW: validation semantics [J] */
        <form ref="refNewUserForm" onSubmit={(e) => { e.preventDefault(); handleSubmit; }}>
          <Card variant="outlined" style="border-color: lightgrey;">
            <Paper className="pt-4">
              <CardContent>
                <div className="d-flex">
                  <p>
                    {t("user.user-id-with-value", { id: user.id })}
                  </p>
                </div>
                <Grid container>
                  {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                  <Grid cols="6">
                    {(groups) ? (
                      /* WF4-REVIEW: items/item-title/item-value → MenuItem children; v-model on complex expression "user.group" [J] */
                      <TextField select {/* WF4-REVIEW: v-model user.group */} disabled items={groups} variant="solo-filled" flat item-title="name" item-value="name" return-object={false} label={t('group.user-group')} rules={[validators.required]} />
                    ) : null}
                  </Grid>
                  {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                  <Grid cols="6">
                    {(households) ? (
                      /* WF4-REVIEW: items/item-title/item-value → MenuItem children; v-model on complex expression "user.household" [J] */
                      <TextField select {/* WF4-REVIEW: v-model user.household */} items={households} variant="solo-filled" flat item-title="name" item-value="name" return-object={false} label={t('household.user-household')} rules={[validators.required]} />
                    ) : null}
                  </Grid>
                </Grid>
                <div className="d-flex py-2 pr-2">
                  <BaseButton type="button" loading={generatingToken} create onClick={(e) => { e.preventDefault(); handlePasswordReset; }}>
                    {t("user.generate-password-reset-link")}
                  </BaseButton>
                </div>
                {(resetUrl) ? (
                  <div className="mb-2">
                    <CardContent>
                      <p className="text-center pb-0">
                        {resetUrl}
                      </p>
                    </CardContent>
                    <CardActions className="align-center pt-0" style="gap: 4px">
                      <BaseButton cancel onClick={resetUrl = ''}>
                        {t("general.close")}
                      </BaseButton>
                      <Box sx={ flexGrow: 1 } />
                      {(user.email) ? (
                        <BaseButton color="info" className="mr-1" onClick={sendResetEmail}>
                          <template>
                            {$globals.icons.email}
                          </template>
                          {t("user.email")}
                        </BaseButton>
                      ) : null}
                      <AppButtonCopy icon={false} color="info" copy-text={resetUrl} />
                    </CardActions>
                  </div>
                ) : null}
                <AutoForm value={user} onChange={setUser} items={userForm} update-mode disabled-fields={disabledFields} />
              </CardContent>
            </Paper>
          </Card>
          <div className="d-flex pa-2">
            <BaseButton type="submit" edit className="ml-auto">
              {t("general.update")}
            </BaseButton>
          </div>
        </form>
      ) : null}
    </Container>
  ) : null}
    </>
  );
}
