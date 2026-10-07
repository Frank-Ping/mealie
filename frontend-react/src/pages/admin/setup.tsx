import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardActions, CardHeader, Container, Divider, LinearProgress, List, ListItem, ListItemText, Toolbar, Typography } from "@mui/material";
import { useDark } from "@vueuse/core";
import { useAdminApi, useUserApi } from "@/composables/api";
import { useLocales } from "@/composables/use-locales";
import { alert } from "@/composables/use-toast";
import { useUserRegistrationForm } from "@/composables/use-users/user-registration-form";
import { useCommonSettingsForm } from "@/composables/use-setup/common-settings-form";
import { useGroupSelf } from "@/composables/use-groups";
import { useAIProviders } from "@/composables/use-ai-providers";
import UserRegistrationForm from "@/components/Domain/User/UserRegistrationForm";
import GroupAIProviderSettingsEditor from "@/components/Domain/Group/GroupAIProviderSettingsEditor";
import type { AIProviderCreate, AIProviderUpdate } from "@/lib/api/types/group";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  layout: "blank",
  middleware: ["admin-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Setup() {
  const { t } = useTranslation();

  // ================================================================
  // Setup
  const i18n = useI18n();
  const auth = useMealieAuth();
  const userApi = useUserApi();
  const adminApi = useAdminApi();

  const groupSlug = auth.user?.groupSlug; // was computed — plain read stays reactive

  const { group, actions: groupActions } = useGroupSelf();
  const { createOne, updateOne, deleteOne } = useAIProviders();

  async function handleCreateProvider(data: AIProviderCreate) {
    const result = await createOne(data);
    if (result.data) {
      await groupActions.refresh();
      alert.success(i18n.t("group.ai-provider-settings.provider-created"));
    }
    else {
      alert.error(i18n.t("group.ai-provider-settings.provider-create-failed"));
    }
  }

  async function handleUpdateProvider(id: string, data: AIProviderUpdate) {
    const result = await updateOne(id, data);
    if (result.data) {
      await groupActions.refresh();
      alert.success(i18n.t("group.ai-provider-settings.provider-updated"));
    }
    else {
      alert.error(i18n.t("group.ai-provider-settings.provider-update-failed"));
    }
  }

  async function handleDeleteProvider(id: string) {
    const result = await deleteOne(id);
    if (result.data) {
      await groupActions.refresh();
      alert.success(i18n.t("group.ai-provider-settings.provider-deleted"));
    }
    else {
      alert.error(i18n.t("group.ai-provider-settings.provider-delete-failed"));
    }
  }
  const { locale } = useLocales();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [langDialog, setLangDialog] = useState(false);
  const isDark = useDark();

  useSeoMeta({
    title: i18n.t("admin.setup.first-time-setup"),
  });

  enum Pages {
    LANDING = 1,
    USER_INFO = 2,
    PAGE_2 = 3,
    AI_PROVIDERS = 4,
    CONFIRM = 5,
    END = 6,
  }

  function getStepperColor(currentPage: Pages, page: Pages) {
    if (currentPage == page) {
      return "info";
    }
    if (currentPage > page) {
      return "success";
    }
    return "";
  }

  // ================================================================
  // Forms
  const { accountDetails, credentials } = useUserRegistrationForm();
  const { commonSettingsForm } = useCommonSettingsForm();
  const [commonSettings, setCommonSettings] = useState({
    makeGroupRecipesPublic: false,
    useSeedData: true,
  });

  const confirmationData = useMemo(() =>  {
    return [
      {
        display: true,
        text: i18n.t("user.email", []); // WF4-REVIEW: dependency array,
        value: accountDetails.email,
      },
      {
        display: true,
        text: i18n.t("user.username"),
        value: accountDetails.username,
      },
      {
        display: true,
        text: i18n.t("user.full-name"),
        value: accountDetails.fullName,
      },
      {
        display: true,
        text: i18n.t("user.enable-advanced-content"),
        value: accountDetails.advancedOptions ? i18n.t("general.yes") : i18n.t("general.no"),
      },
      {
        display: true,
        text: i18n.t("group.enable-public-access"),
        value: commonSettings.makeGroupRecipesPublic ? i18n.t("general.yes") : i18n.t("general.no"),
      },
      {
        display: true,
        text: i18n.t("user-registration.use-seed-data"),
        value: commonSettings.useSeedData ? i18n.t("general.yes") : i18n.t("general.no"),
      },
    ];
  });

  // ================================================================
  // Page Navigation
  const [currentPage, setCurrentPage] = useState(Pages.LANDING);

  // ================================================================
  // Page Submission

  async function updateUser() {
    // Note: auth.user is now a ref
    const { response } = await userApi.users.updateOne(auth.user.value!.id, {
      ...auth.user,
      email: accountDetails.email,
      username: accountDetails.username,
      fullName: accountDetails.fullName,
      advanced: accountDetails.advancedOptions,
    });

    if (!response || response.status !== 200) {
      alert.error(i18n.t("events.something-went-wrong"));
    }
    else {
      auth.getSession();
    }
  }

  async function updatePassword() {
    // Read before updateUser can change it: the account is still identified by its current email at
    // the point we have to sign back in.
    const currentEmail = auth.user.value!.email;
    const newPassword = credentials.password1;

    const { response } = await userApi.users.changePassword({
      currentPassword: "MyPassword",
      newPassword,
    });

    if (!response || response.status !== 200) {
      alert.error(i18n.t("events.something-went-wrong"));
      return;
    }

    // Changing the password invalidates this session, and setup has several authenticated steps left,
    // so sign straight back in rather than letting the rest of the wizard 401.
    const formData = new FormData();
    formData.append("username", currentEmail);
    formData.append("password", newPassword);
    formData.append("remember_me", "true");

    try {
      await auth.signIn(formData);
    }
    catch {
      alert.error(i18n.t("events.something-went-wrong"));
    }
  }

  async function submitRegistration() {
    // we update the password first, then update the user's details
    await updatePassword().then(updateUser);
  }

  async function updateGroup() {
    // Note: auth.user is now a ref
    const { data } = await userApi.groups.getOne(auth.user.value!.groupId);
    if (!data || !data.preferences) {
      alert.error(i18n.t("events.something-went-wrong"));
      return;
    }

    const preferences = {
      ...data.preferences,
      privateGroup: !commonSettings.makeGroupRecipesPublic,
    };

    const payload = {
      ...data,
      preferences,
    };

    // Note: auth.user is now a ref
    const { response } = await userApi.groups.updateOne(auth.user.value!.groupId, payload);
    if (!response || response.status !== 200) {
      alert.error(i18n.t("events.something-went-wrong"));
    }
  }

  async function updateHousehold() {
    // Note: auth.user is now a ref
    const { data } = await adminApi.households.getOne(auth.user.value!.householdId);
    if (!data || !data.preferences) {
      alert.error(i18n.t("events.something-went-wrong"));
      return;
    }

    const preferences = {
      ...data.preferences,
      privateHousehold: !commonSettings.makeGroupRecipesPublic,
      recipePublic: commonSettings.makeGroupRecipesPublic,
    };

    const payload = {
      ...data,
      preferences,
    };

    // Note: auth.user is now a ref
    const { response } = await adminApi.households.updateOne(auth.user.value!.householdId, payload);
    if (!response || response.status !== 200) {
      alert.error(i18n.t("events.something-went-wrong"));
    }
  }

  async function seedFoods() {
    const { response } = await userApi.seeders.foods({ locale: locale });
    if (!response || response.status !== 200) {
      alert.error(i18n.t("events.something-went-wrong"));
    }
  }

  async function seedUnits() {
    const { response } = await userApi.seeders.units({ locale: locale });
    if (!response || response.status !== 200) {
      alert.error(i18n.t("events.something-went-wrong"));
    }
  }

  async function seedData() {
    if (!commonSettings.useSeedData) {
      return;
    }

    await Promise.all([seedFoods(), seedUnits()]);
  }

  async function submitCommonSettings() {
    const tasks = [
      updateGroup(),
      updateHousehold(),
      seedData(),
    ];

    await Promise.all(tasks);
  }

  async function submitAll() {
    // Not part of the parallel batch: changing the password invalidates the session and establishes a
    // new one, and any request landing in that window would 401 and bounce the admin out of setup.
    await submitRegistration();

    const tasks = [
      submitCommonSettings(),
      groupActions.updateAIProviderSettings(),
    ];

    await Promise.all(tasks);
  }

  async function handleSubmit(page: number) {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    switch (page) {
      case Pages.USER_INFO:
        if (await accountDetails.validate()) {
          currentPage += 1;
        }
        break;
      case Pages.CONFIRM:
        await submitAll();
        currentPage += 1;
        break;
      case Pages.END:
        navigate(groupSlug ? `/g/${groupSlug}` : "/login");
        break;
    }
    setIsSubmitting(false);
  }

  // ================================================================
  // Stepper Navigation Handlers
  function onPrev() {
    if (isSubmitting) return;
    if (currentPage > Pages.LANDING) currentPage -= 1;
  }

  async function onNext() {
    if (isSubmitting) return;
    if (setCurrentPage(== Pages.USER_INFO) {
      await handleSubmit(Pages.USER_INFO));
      return;
    }
    if (setCurrentPage(== Pages.CONFIRM) {
      await handleSubmit(Pages.CONFIRM));
      return;
    }
    currentPage += 1;
  }

  async function onFinish() {
    if (isSubmitting) return;
    await handleSubmit(Pages.END);
  }

  return (
    <>
  <Container fluid className="d-flex justify-center align-start fill-height" className={{
      'bg-off-white': !$vuetify.theme.current.dark && !isDark,
    }}>
    <Card className="elevation-4" width="1200" className={{ 'my-10': $vuetify.display.mdAndUp }}>
      {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-toolbar> */}
      <Toolbar color="primary" className="d-flex justify-center">
        <Typography variant="h6" className="headline text-h4 text-center mx-0">
          Mealie
        </Typography>
      </Toolbar>
      {/* WF4-REVIEW: unmapped <v-stepper> — judgement component, convert manually [J] */}
      <VStepper value={currentPage} onChange={setCurrentPage} mobile-breakpoint="sm" alt-labels>
        {/* WF4-REVIEW: unmapped <v-stepper-header> — judgement component, convert manually [J] */}
        <VStepperHeader>
          {/* WF4-REVIEW: unmapped <v-stepper-item> — judgement component, convert manually [J] */}
          <VStepperItem value={Pages.LANDING} icon={$globals.icons.wave} complete={currentPage > Pages.LANDING} color={getStepperColor(currentPage, Pages.LANDING)} title={t('general.start')} />
          <Divider />
          {/* WF4-REVIEW: unmapped <v-stepper-item> — judgement component, convert manually [J] */}
          <VStepperItem value={Pages.USER_INFO} icon={$globals.icons.user} complete={currentPage > Pages.USER_INFO} color={getStepperColor(currentPage, Pages.USER_INFO)} title={t('user-registration.account-details')} />
          <Divider />
          {/* WF4-REVIEW: unmapped <v-stepper-item> — judgement component, convert manually [J] */}
          <VStepperItem value={Pages.PAGE_2} icon={$globals.icons.cog} complete={currentPage > Pages.PAGE_2} color={getStepperColor(currentPage, Pages.PAGE_2)} title={t('settings.site-settings')} />
          <Divider />
          {/* WF4-REVIEW: unmapped <v-stepper-item> — judgement component, convert manually [J] */}
          <VStepperItem value={Pages.AI_PROVIDERS} icon={$globals.icons.robot} complete={currentPage > Pages.AI_PROVIDERS} color={getStepperColor(currentPage, Pages.AI_PROVIDERS)} title={t('group.ai-provider-settings.ai-providers')} />
          <Divider />
          {/* WF4-REVIEW: unmapped <v-stepper-item> — judgement component, convert manually [J] */}
          <VStepperItem value={Pages.CONFIRM} icon={$globals.icons.chefHat} complete={currentPage > Pages.CONFIRM} color={getStepperColor(currentPage, Pages.CONFIRM)} title={t('admin.maintenance.summary-title')} />
          <Divider />
          {/* WF4-REVIEW: unmapped <v-stepper-item> — judgement component, convert manually [J] */}
          <VStepperItem value={Pages.END} icon={$globals.icons.check} complete={currentPage > Pages.END} color={getStepperColor(currentPage, Pages.END)} title={t('admin.setup.setup-complete')} />
        </VStepperHeader>
        {(isSubmitting && currentPage === Pages.CONFIRM) ? (
          <LinearProgress color="primary" indeterminate className="mb-2" />
        ) : null}
        {/* WF4-REVIEW: unmapped <v-stepper-window> — judgement component, convert manually [J] */}
        <VStepperWindow transition={false} className="stepper-window">
          {/* WF4-REVIEW: unmapped <v-stepper-window-item> — judgement component, convert manually [J] */}
          <VStepperWindowItem value={Pages.LANDING}>
            <Container className="mb-12">
              <AppLogo />
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader className="text-headline-medium my-5 justify-center text-center text-break text-pre-wrap">
                {t('admin.setup.welcome-to-mealie-get-started')}
              </CardHeader>
              <p className="text-body-1 text-center">
                {t('admin.setup.previous-mealie-instance')}
              </p>
              <Button to="backups" rounded variant="outlined" color="primary" className="text-subtitle-2 d-flex mx-auto my-3" style="width: fit-content;">
                {t('settings.backup.restore-backup')}
              </Button>
              <Button component={Link} to={groupSlug ? `/g/${groupSlug}` : '/login'} rounded variant="outlined" color="grey-lighten-1" className="text-subtitle-2 d-flex mx-auto" style="width: fit-content;">
                {t('admin.setup.already-set-up-bring-to-homepage')}
              </Button>
            </Container>
            <CardActions className="justify-center flex-column py-8">
              <BaseButton size="large" color="primary" className="px-10" rounded icon={$globals.icons.translate} onClick={langDialog = true}>
                {t('language-dialog.choose-language')}
              </BaseButton>
            </CardActions>
            {/* WF4-REVIEW: unmapped <v-stepper-actions> — judgement component, convert manually [J] */}
            <VStepperActions className="justify-end" disabled={isSubmitting} next-text="general.next" onClickNext={onNext}>
              <template>
                <Button variant="flat" color="success" disabled={isSubmitting} loading={isSubmitting} text={t('general.next')} onClick={onNext} />
              </template>
              <template />
            </VStepperActions>
          </VStepperWindowItem>
          {/* WF4-REVIEW: unmapped <v-stepper-window-item> — judgement component, convert manually [J] */}
          <VStepperWindowItem value={Pages.USER_INFO} eager>
            <Container max-width="880">
              <UserRegistrationForm />
            </Container>
            {/* WF4-REVIEW: unmapped <v-stepper-actions> — judgement component, convert manually [J] */}
            <VStepperActions disabled={isSubmitting} prev-text="general.back" onClickPrev={onPrev}>
              <template>
                <Button variant="flat" color="success" disabled={isSubmitting} loading={isSubmitting} text={t('general.next')} onClick={onNext} />
              </template>
            </VStepperActions>
          </VStepperWindowItem>
          {/* WF4-REVIEW: unmapped <v-stepper-window-item> — judgement component, convert manually [J] */}
          <VStepperWindowItem value={Pages.PAGE_2}>
            <Container max-width="880">
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader className="headline pa-0">
                {t('admin.setup.common-settings-for-new-sites')}
              </CardHeader>
              <AutoForm value={commonSettings} onChange={setCommonSettings} items={commonSettingsForm} />
            </Container>
            {/* WF4-REVIEW: unmapped <v-stepper-actions> — judgement component, convert manually [J] */}
            <VStepperActions disabled={isSubmitting} prev-text="general.back" onClickPrev={onPrev}>
              <template>
                <Button variant="flat" color="success" disabled={isSubmitting} loading={isSubmitting} text={t('general.next')} onClick={onNext} />
              </template>
            </VStepperActions>
          </VStepperWindowItem>
          {/* WF4-REVIEW: unmapped <v-stepper-window-item> — judgement component, convert manually [J] */}
          <VStepperWindowItem value={Pages.AI_PROVIDERS}>
            <Container max-width="880">
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader className="headline pa-0">
                {t('group.ai-provider-settings.ai-providers')}
              </CardHeader>
              {/* WF4-REVIEW: or CardHeader subheader */}
              <Typography variant="body2" color="text.secondary" className="px-0 py-2 text-wrap">
                {t('group.ai-provider-settings.ai-providers-description')}
              </Typography>
              {(group?.aiProviderSettings) ? (
                /* WF4-REVIEW: v-model on complex expression "group.aiProviderSettings" [J] */
                <GroupAIProviderSettingsEditor {/* WF4-REVIEW: v-model group.aiProviderSettings */} hide-header className="mt-4" onCreate={handleCreateProvider} onUpdate={handleUpdateProvider} onDelete={handleDeleteProvider} />
              ) : null}
            </Container>
            {/* WF4-REVIEW: unmapped <v-stepper-actions> — judgement component, convert manually [J] */}
            <VStepperActions disabled={isSubmitting} prev-text="general.back" onClickPrev={onPrev}>
              <template>
                <Button variant="flat" color="success" disabled={isSubmitting} loading={isSubmitting} text={t('general.next')} onClick={onNext} />
              </template>
            </VStepperActions>
          </VStepperWindowItem>
          {/* WF4-REVIEW: unmapped <v-stepper-window-item> — judgement component, convert manually [J] */}
          <VStepperWindowItem value={Pages.CONFIRM}>
            <Container max-width="880">
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader className="headline pa-0">
                {t('general.confirm-how-does-everything-look')}
              </CardHeader>
              <List>
                {confirmationData.map((item, idx) => (
                  <template>
                    {(item.display) ? (
                      /* WF4-REVIEW: @click → ListItemButton */
                      <ListItem key={idx} className="px-0">
                        {/* WF4-REVIEW: content → primary prop */}
                        <ListItemText>
                          {item.text}
                        </ListItemText>
                        {/* WF4-REVIEW: content → secondary prop */}
                        <ListItemText>
                          {item}
                        </ListItemText>
                      </ListItem>
                    ) : null}
                    {(idx !== confirmationData.length - 1) ? (
                      <Divider key={`divider-${idx}`} />
                    ) : null}
                  </template>
                ))}
              </List>
            </Container>
            {/* WF4-REVIEW: unmapped <v-stepper-actions> — judgement component, convert manually [J] */}
            <VStepperActions disabled={isSubmitting} prev-text="general.back" onClickPrev={onPrev}>
              <template>
                <BaseButton create flat disabled={isSubmitting} loading={isSubmitting} icon={$globals.icons.check} text={t('general.submit')} onClick={onNext} />
              </template>
            </VStepperActions>
          </VStepperWindowItem>
          {/* WF4-REVIEW: unmapped <v-stepper-window-item> — judgement component, convert manually [J] */}
          <VStepperWindowItem value={Pages.END}>
            <EndPageContent />
            {/* WF4-REVIEW: unmapped <v-stepper-actions> — judgement component, convert manually [J] */}
            <VStepperActions disabled={isSubmitting} prev-text="general.back" onClickPrev={onPrev}>
              <template>
                <BaseButton flat color="primary" disabled={isSubmitting} loading={isSubmitting} icon={$globals.icons.home} text={t('general.home')} onClick={onFinish} />
              </template>
            </VStepperActions>
          </VStepperWindowItem>
        </VStepperWindow>
      </VStepper>
      <LanguageDialog value={langDialog} onChange={setLangDialog} />
    </Card>
  </Container>
    </>
  );
}
