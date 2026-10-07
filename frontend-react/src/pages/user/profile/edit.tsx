import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, Container, FormControlLabel, Slide, TextField, form } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useUserApi } from "@/composables/api";
import UserAvatar from "@/components/Domain/User/UserAvatar";
import UserPasswordStrength from "@/components/Domain/User/UserPasswordStrength";
import { validators } from "@/composables/use-validators";
import { useUserActivityPreferences } from "@/composables/use-users/preferences";
import useDefaultActivity from "@/composables/use-default-activity";
import { ActivityKey } from "@/lib/api/types/activity";
import type { UserBase } from "@/lib/api/types/user";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  middleware: ["auth"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Edit() {
  const { t } = useTranslation();

  const { i18n } = useTranslation();
  const auth = useMealieAuth();
  const { getDefaultActivityLabels, getActivityLabel, getActivityKey } = useDefaultActivity();
  const user = auth.user; // was computed — plain read stays reactive

  useSeoMeta({
    title: i18n.t("settings.profile"),
  });

  const activityPreferences = useUserActivityPreferences();
  const activityOptions = getDefaultActivityLabels(i18n);
  const [selectedDefaultActivity, setSelectedDefaultActivity] = useState(getActivityLabel(i18n, activityPreferences.defaultActivity));
  /* WF4-REVIEW [J] */ watch(selectedDefaultActivity, () => {
    activityPreferences.defaultActivity = getActivityKey(i18n, selectedDefaultActivity) ?? ActivityKey.RECIPES;
  });

  const [userCopy, setUserCopy] = useState({ ...user });
  /* WF4-REVIEW [J] */ watch(user, () => {
    setUserCopy({ ...user });
  });

  const api = useUserApi();
  const [showPassword, setShowPassword] = useState(false);
  const password = /* WF4-REVIEW [J] */ reactive({
    current: "",
    newOne: "",
    newTwo: "",
  });

  const passwordsMatch = useMemo(() => password.newOne === password.newTwo && password.newOne.length > 0, []); // WF4-REVIEW: dependency array

  async function updateUser() {
    const userData = userCopy;
    if (!userData?.id || !userData.email) return;

    const updatePayload: UserBase = {
      id: userData.id,
      username: userData.username,
      fullName: userData.fullName,
      email: userData.email,
      authMethod: userData.authMethod,
      admin: userData.admin,
      group: userData.group,
      household: userData.household,
      showAnnouncements: userData.showAnnouncements,
      advanced: userData.advanced,
      canInvite: userData.canInvite,
      canManage: userData.canManage,
      canManageHousehold: userData.canManageHousehold,
      canOrganize: userData.canOrganize,
    };

    const { response } = await api.users.updateOne(userData.id, updatePayload);
    if (response?.status === 200) {
      auth.getSession();
    }
  }

  async function updatePassword() {
    if (!userCopy?.id) {
      return;
    }
    const { response } = await api.users.changePassword({
      currentPassword: password.current,
      newPassword: password.newOne,
    });

    if (response?.status === 200) {
      // The new password invalidates this session server-side, so end it here rather than letting the
      // next request fail its way to the login page.
      await auth.signOut();
    }
  }

  return (
    <>
  <Container className="narrow-container">
    <BasePageTitle divider>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        <div className="d-flex flex-column align-center justify-center">
          <UserAvatar tooltip={false} size="96" user-id={userCopy.id!} />
          <AppButtonUpload className="my-1" file-name="profile" accept="image/*" url={`/api/users/${userCopy.id}/image`} onUploaded={auth.getSession()} />
        </div>
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t("profile.user-settings")}
      </>
    </BasePageTitle>
    <section className="mt-5">
      <ToggleState tag="article">
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {(!toggleState && $appInfo.allowPasswordLogin) ? (
            <Button color="info" className="mt-2 mb-n3" onClick={toggle}>
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={icons.lock} />
              {t("settings.change-password")}
            </Button>
          ) : ($appInfo.allowPasswordLogin) ? (
            <Button color="info" className="mt-2 mb-n3" onClick={toggle}>
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={icons.user} />
              {t("settings.profile")}
            </Button>
          ) : null}
        </>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {/* WF4-REVIEW: transition semantics */}
          <Slide in={true} leave-absolute hide-on-leave>
            {(!toggleState) ? (
              <div key="personal-info">
                <BaseCardSectionTitle className="mt-10" title={t('profile.personal-information')} />
                <Card tag="article" variant="outlined" style="border-color: lightgrey;">
                  <CardContent className="pb-0">
                    {/* WF4-REVIEW: validation semantics [J] */}
                    <form ref="userUpdate">
                      {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "userCopy.username" [J] */}
                      <TextField label={t('user.username')} required validate-on="blur" density="comfortable" variant="underlined" />
                      {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "userCopy.fullName" [J] */}
                      <TextField label={t('user.full-name')} required validate-on="blur" density="comfortable" variant="underlined" />
                      {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "userCopy.email" [J] */}
                      <TextField label={t('user.email')} validate-on="blur" required density="comfortable" variant="underlined" />
                    </form>
                  </CardContent>
                  <CardActions>
                    <Box sx={{ flexGrow: 1 }} />
                    <BaseButton update onClick={updateUser} />
                  </CardActions>
                </Card>
              </div>
            ) : (
              <div key="change-password">
                <BaseCardSectionTitle className="mt-10" title={t('settings.change-password')} />
                <Card variant="outlined" style="border-color: lightgrey;">
                  <CardContent className="pb-0">
                    {/* WF4-REVIEW: validation semantics [J] */}
                    <form ref="passChange">
                      {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "password.current" [J] */}
                      <TextField prepend-icon={icons.lock} label={t('user.current-password')} validate-on="blur" type={showPassword ? 'text' : 'password'} append-icon={showPassword ? icons.eye : icons.eyeOff} rules={[validators.minLength(1)]} density="comfortable" variant="underlined" onClickAppend={() => setShowPassword(!showPassword)} />
                      {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "password.newOne" [J] */}
                      <TextField prepend-icon={icons.lock} label={t('user.new-password')} type={showPassword ? 'text' : 'password'} append-icon={showPassword ? icons.eye : icons.eyeOff} rules={[validators.minLength(8)]} density="comfortable" variant="underlined" onClickAppend={() => setShowPassword(!showPassword)} />
                      {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "password.newTwo" [J] */}
                      <TextField prepend-icon={icons.lock} label={t('user.confirm-password')} rules={[password.newOne === password.newTwo || t('user.password-must-match')]} validate-on="blur" type={showPassword ? 'text' : 'password'} append-icon={showPassword ? icons.eye : icons.eyeOff} density="comfortable" variant="underlined" onClickAppend={() => setShowPassword(!showPassword)} />
                      {/* WF4-REVIEW: v-model on complex expression "password.newOne" [J] */}
                      <UserPasswordStrength />
                    </form>
                  </CardContent>
                  <CardActions>
                    <Box sx={{ flexGrow: 1 }} />
                    <BaseButton update disabled={!passwordsMatch || password.current.length < 0} onClick={updatePassword} />
                  </CardActions>
                </Card>
              </div>
            )}
          </Slide>
        </>
      </ToggleState>
    </section>
    <section>
      <BaseCardSectionTitle className="mt-10" title={t('profile.preferences')} />
      <Card variant="outlined" style="border-color: lightgrey;">
        <CardContent>
          {/* WF4-REVIEW: unmapped <v-combobox> — judgement component, convert manually [J] */}
          <VCombobox value={selectedDefaultActivity} onChange={setSelectedDefaultActivity} label={t('user.default-activity')} items={activityOptions} hint={t('user.default-activity-hint')} density="comfortable" variant="underlined" validate-on="blur" persistent-hint />
          {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "userCopy.showAnnouncements" [J] */}
          <FormControlLabel hide-details label={t('announcements.show-announcements-from-mealie')} color="primary" onChange={updateUser} />
          {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "userCopy.advanced" [J] */}
          <FormControlLabel hide-details label={t('profile.show-advanced-description')} color="primary" onChange={updateUser} />
        </CardContent>
      </Card>
      <nuxt-link className="mt-5 d-flex flex-column justify-center text-center text-primary" to={`/group`}>
        {t('profile.looking-for-privacy-settings')}
      </nuxt-link>
      <div className="d-flex flex-wrap justify-center mt-5">
        <Button variant="outlined" className="rounded-xl my-1 mx-1" component={Link} to={`/user/profile`} nuxt exact>
          {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
          <MdiIcon name={icons.backArrow} />
          {t('profile.back-to-profile')}
        </Button>
      </div>
    </section>
  </Container>
    </>
  );
}
