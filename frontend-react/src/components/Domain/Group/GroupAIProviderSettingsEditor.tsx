import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Autocomplete, Card, CardContent, Grid, Tooltip, Typography } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import type { AIProviderCreate, AIProviderUpdate } from "@/lib/api/types/group";
import type { AIProviderSettingsOut } from "@/lib/api/types/user";

export default function GroupAIProviderSettingsEditor({ hideHeader = false }: Props) {
  const { t } = useTranslation();

  const providerSettings = defineModel<AIProviderSettingsOut>({ required: true });

  /* props via destructured signature (was withDefaults(defineProps<?>) */

  const { hideHeader } = toRefs(props);

  const local = /* WF4-REVIEW [J] */ reactive({ ...providerSettings });
  /* WF4-REVIEW [J] */ watch(local, (newVal) => { providerSettings = { ...newVal }; });
  // Sync back when the parent refreshes after create/update/delete
  /* WF4-REVIEW [J] */ watch(providerSettings, (newVal) => { if (newVal) Object.assign(local, newVal); });

  const noDefaultProviderWarning = useMemo(() => local.providers.length > 0 && !local.defaultProviderId,, []); // WF4-REVIEW: dependency array

  defineEmits<{
    (e: "create", data: AIProviderCreate): void;
    (e: "update", id: string, data: AIProviderUpdate): void;
    (e: "delete", id: string): void;
  }>();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState(null);

  function openCreate() {
    setEditingProviderId(null);
    setDialogOpen(true);
  }

  function openEdit(id: string) {
    setEditingProviderId(id);
    setDialogOpen(true);
  }

  return (
    <>
  {(providerSettings) ? (
    <div>
      {(!hideHeader) ? (
        <BaseCardSectionTitle title={t('group.ai-provider-settings.ai-provider-settings')}>
          {(noDefaultProviderWarning) ? (
            /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
            <>
              {/* WF4-REVIEW: activator slot variants [J] */}
              <Tooltip location="bottom" color="warning">
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {/* WF4-REVIEW: icon name resolves via lib/icons */}
                  <MdiIcon name={icons.alert} {...(tooltipProps)} size="small" color="warning" className="ms-2" />
                </>
                <span>
                  {t('group.ai-provider-settings.no-default-provider-warning')}
                </span>
              </Tooltip>
            </>
          ) : null}
        </BaseCardSectionTitle>
      ) : null}
      {(!hideHeader) ? (
        <CardContent className="pt-0 pb-10 px-0">
          {t("group.ai-provider-settings.ai-provider-settings-description")}
        </CardContent>
      ) : null}
      <Grid container className="mb-4">
        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
        <Grid cols="12">
          {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S]; v-model on complex expression "local.defaultProviderId" [J] */}
          <Autocomplete label={t('group.ai-provider-settings.default-provider')} items={local.providers} item-title="name" item-value="id" clearable hide-details density="compact" variant="outlined" />
          {/* WF4-REVIEW: or CardHeader subheader */}
          <Typography variant="body2" color="text.secondary" className="mt-1">
            {t("group.ai-provider-settings.default-provider-description")}
          </Typography>
        </Grid>
        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
        <Grid cols="12">
          {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S]; v-model on complex expression "local.audioProviderId" [J] */}
          <Autocomplete label={t('group.ai-provider-settings.audio-provider')} items={local.providers} item-title="name" item-value="id" clearable hide-details density="compact" variant="outlined" />
          {/* WF4-REVIEW: or CardHeader subheader */}
          <Typography variant="body2" color="text.secondary" className="mt-1">
            {t("group.ai-provider-settings.audio-provider-description")}
          </Typography>
        </Grid>
        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
        <Grid cols="12">
          {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S]; v-model on complex expression "local.imageProviderId" [J] */}
          <Autocomplete label={t('group.ai-provider-settings.image-provider')} items={local.providers} item-title="name" item-value="id" clearable hide-details density="compact" variant="outlined" />
          {/* WF4-REVIEW: or CardHeader subheader */}
          <Typography variant="body2" color="text.secondary" className="mt-1">
            {t("group.ai-provider-settings.image-provider-description")}
          </Typography>
        </Grid>
      </Grid>
      <GroupAIProviderDialog value={dialogOpen} onChange={setDialogOpen} provider-id={editingProviderId ?? undefined} onCreate={(data) => onCreate?.(data)} onUpdate={(id, data) => onUpdate?.(id, data)} />
      <BaseCardSectionTitle title={t('group.ai-provider-settings.providers')} size="medium" className="pt-2">
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          <BaseButton text={t('group.ai-provider-settings.create-provider')} className="ms-auto my-2" create small onClick={openCreate} />
        </>
      </BaseCardSectionTitle>
      {local.providers.map(provider => (
        <Card key={provider.id} variant="tonal" className="pa-0 mb-4">
          <Grid container no-gutters>
            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
            <Grid cols={10}>
              <CardContent>
                {provider.name}
              </CardContent>
            </Grid>
            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
            <Grid cols={2}>
              <BaseButtonGroup buttons={[
              {
                icon: icons.edit,
                text: t('general.edit'),
                event: 'edit',
              },
              {
                icon: icons.delete,
                text: t('general.delete'),
                event: 'delete',
              },
            ]} onEdit={openEdit(provider.id)} onDelete={onDelete?.(provider.id)} />
            </Grid>
          </Grid>
        </Card>
      ))}
    </div>
  ) : null}
    </>
  );
}
