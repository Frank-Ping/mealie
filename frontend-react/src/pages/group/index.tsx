import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Card, CardContent, Container, form } from "@mui/material";
import GroupPreferencesEditor from "@/components/Domain/Group/GroupPreferencesEditor";
import GroupAIProviderSettingsEditor from "@/components/Domain/Group/GroupAIProviderSettingsEditor";
import { useGroupSelf } from "@/composables/use-groups";
import { useAIProviders } from "@/composables/use-ai-providers";
import { alert } from "@/composables/use-toast";
import type { AIProviderCreate, AIProviderUpdate } from "@/lib/api/types/group";
import type { VForm } from "@/types/auto-forms";

export const handle = {
  middleware: ["auth", "can-manage-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function GroupPage() {
  const { t } = useTranslation();

  const { group, actions: groupActions } = useGroupSelf();
  const i18n = useI18n();

  useSeoMeta({
    title: i18n.t("group.group"),
  });

  // useGroupSelf() caches data in a module-level singleton for the lifetime of the tab,
  // so revisiting this page via client-side navigation can otherwise show stale
  // preferences/AI settings if they were changed elsewhere (e.g. Admin Groups panel)
  // in the same session. Force a revalidation whenever this page is entered.
  /* WF4-REVIEW [J] */ onMounted(() => {
    groupActions.refresh();
  });

  const [refGroupPrefsEditForm, setRefGroupPrefsEditForm] = useState(null);
  const [refGroupAISettingsForm, setRefGroupAISettingsForm] = useState(null);

  async function handlePrefsSubmit() {
    if (!refGroupPrefsEditForm?.validate() || !group?.preferences) {
      return;
    }

    const data = await groupActions.updatePreferences();
    if (data) {
      alert.success(i18n.t("settings.settings-updated"));
    }
    else {
      alert.error(i18n.t("settings.settings-update-failed"));
    }
  }

  async function handleAISettingsSubmit() {
    if (!refGroupAISettingsForm?.validate() || !group?.aiProviderSettings) {
      return;
    }

    const data = await groupActions.updateAIProviderSettings();
    if (data) {
      alert.success(i18n.t("settings.settings-updated"));
    }
    else {
      alert.error(i18n.t("settings.settings-update-failed"));
    }
  }

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

  return (
    <>
  {(group) ? (
    <Container className="narrow-container">
      <BasePageTitle className="mb-5">
        <template>
          {/* WF4-REVIEW: cover → objectFit */}
          <Box component="img" width="100%" max-height="100" max-width="100" src="/svgs/manage-group-settings.svg" />
        </template>
        <template>
          {t("profile.group-settings")}
        </template>
        {t("profile.group-description")}
      </BasePageTitle>
      <div className="mb-10">
        {/* WF4-REVIEW: validation semantics [J] */}
        <form ref="refGroupPrefsEditForm" onSubmit={(e) => { e.preventDefault(); handlePrefsSubmit; }}>
          <Card variant="outlined" style="border-color: lightgray;">
            <CardContent>
              {(group.preferences) ? (
                /* WF4-REVIEW: v-model on complex expression "group.preferences" [J] */
                <GroupPreferencesEditor {/* WF4-REVIEW: v-model group.preferences */} />
              ) : null}
            </CardContent>
          </Card>
          <div className="d-flex pa-2">
            <BaseButton type="submit" edit className="ml-auto">
              {t("general.update")}
            </BaseButton>
          </div>
        </form>
      </div>
      <div>
        {/* WF4-REVIEW: validation semantics [J] */}
        <form ref="refGroupAISettingsForm" onSubmit={(e) => { e.preventDefault(); handleAISettingsSubmit; }}>
          <Card variant="outlined" style="border-color: lightgray;">
            <CardContent>
              {(group.aiProviderSettings) ? (
                /* WF4-REVIEW: v-model on complex expression "group.aiProviderSettings" [J] */
                <GroupAIProviderSettingsEditor {/* WF4-REVIEW: v-model group.aiProviderSettings */} onCreate={handleCreateProvider} onUpdate={handleUpdateProvider} onDelete={handleDeleteProvider} />
              ) : null}
            </CardContent>
          </Card>
          <div className="d-flex pa-2">
            <BaseButton type="submit" edit className="ml-auto">
              {t("general.update")}
            </BaseButton>
          </div>
        </form>
      </div>
    </Container>
  ) : null}
    </>
  );
}
