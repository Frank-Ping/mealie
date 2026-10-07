import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Card, CardContent, Container, TextField, form } from "@mui/material";
import GroupPreferencesEditor from "@/components/Domain/Group/GroupPreferencesEditor";
import GroupAIProviderSettingsEditor from "@/components/Domain/Group/GroupAIProviderSettingsEditor";
import { useAdminApi } from "@/composables/api";
import { alert } from "@/composables/use-toast";
import type { AIProviderCreate, AIProviderUpdate } from "@/lib/api/types/group";
import type { VForm } from "vuetify/components";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Id() {
  const { t } = useTranslation();

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]

  const i18n = useI18n();

  const groupId = route.params.id as string; // was computed — plain read stays reactive

  // ==============================================
  // New User Form

  const [refGroupEditForm, setRefGroupEditForm] = useState(null);

  const adminApi = useAdminApi();

  const [userError, setUserError] = useState(false);

  const { data: group, refresh } = useLazyAsyncData(`get-household-${groupId}`, async () => {
    if (!groupId) {
      return null;
    }
    const { data, error } = await adminApi.groups.getOne(groupId);

    if (error?.response?.status === 404) {
      alert.error(i18n.t("user.user-not-found"));
      setUserError(true);
    }
    return data;
  }, { watch: [groupId] });

  async function handleSubmit() {
    if (!refGroupEditForm?.validate() || !group) {
      return;
    }

    const { response, data } = await adminApi.groups.updateOne(group.id, group);
    if (response?.status === 200 && data) {
      if (group.slug !== data.slug) {
        // the slug updated, which invalidates the nav URLs
        window.location.reload();
      }
      group = data;
      alert.success(i18n.t("settings.settings-updated"));
    }
    else {
      alert.error(i18n.t("settings.settings-update-failed"));
    }
  }

  async function handleCreateProvider(data: AIProviderCreate) {
    if (!group) return;
    const result = await adminApi.aiProviders.createProvider(group.id, data);
    if (result.data) {
      await refresh();
      alert.success(i18n.t("group.ai-provider-settings.provider-created"));
    }
    else {
      alert.error(i18n.t("group.ai-provider-settings.provider-create-failed"));
    }
  }

  async function handleUpdateProvider(id: string, data: AIProviderUpdate) {
    if (!group) return;
    const result = await adminApi.aiProviders.updateProvider(group.id, id, data);
    if (result.data) {
      await refresh();
      alert.success(i18n.t("group.ai-provider-settings.provider-updated"));
    }
    else {
      alert.error(i18n.t("group.ai-provider-settings.provider-update-failed"));
    }
  }

  async function handleDeleteProvider(id: string) {
    if (!group) return;
    const result = await adminApi.aiProviders.deleteProvider(group.id, id);
    if (result.data) {
      await refresh();
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
      <BasePageTitle>
        <template>
          {/* WF4-REVIEW: cover → objectFit */}
          <Box component="img" width="100%" max-height="125" max-width="125" src="/svgs/manage-group-settings.svg" />
        </template>
        <template>
          {t('group.admin-group-management')}
        </template>
      </BasePageTitle>
      <AppToolbar back />
      <CardContent>
        {t('group.group-id-value', [group.id])}
      </CardContent>
      {(!userError) ? (
        /* WF4-REVIEW: validation semantics [J] */
        <form ref="refGroupEditForm" onSubmit={(e) => { e.preventDefault(); handleSubmit; }}>
          <Card variant="outlined" style="border-color: lightgrey;">
            <CardContent>
              {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "group.name" [J] */}
              <TextField {/* WF4-REVIEW: v-model group.name */} label={t('group.group-name')} />
              {(group.preferences) ? (
                /* WF4-REVIEW: v-model on complex expression "group.preferences" [J] */
                <GroupPreferencesEditor {/* WF4-REVIEW: v-model group.preferences */} />
              ) : null}
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
      ) : null}
    </Container>
  ) : null}
    </>
  );
}
