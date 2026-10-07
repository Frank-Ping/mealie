import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CardActions, CardContent, FormControlLabel, TextField } from "@mui/material";
import type { ReadWebhook } from "@/lib/api/types/household";
import { timeLocalToUTC, timeUTCToLocal } from "@/composables/use-group-webhooks";

export default function GroupWebhookEditor() {
  const { t } = useTranslation();

  const props = defineProps<{
    webhook: ReadWebhook;
  }>();

  const emit = defineEmits<{
    delete: [id: string];
    save: [webhook: ReadWebhook];
    test: [id: string];
  }>();

  const i18n = useI18n();
  const [itemUTC, setItemUTC] = useState(props.webhook.scheduledTime);
  const [itemLocal, setItemLocal] = useState(timeUTCToLocal(props.webhook.scheduledTime););

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const scheduledTime = computed({
    get() {
      return itemLocal;
    },
    set(v: string) {
      setItemUTC(timeLocalToUTC(v));
      setItemLocal(v);
    },
  });

  const [webhookCopy, setWebhookCopy] = useState({ ...props.webhook });

  function handleSave() {
    webhookCopy.scheduledTime = itemLocal;
    emit("save", webhookCopy);
  }

  // Set page title using useSeoMeta
  useSeoMeta({
    title: i18n.t("settings.webhooks.webhooks"),
  });

  return (
    <>
  <div>
    <CardContent>
      {/* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "webhookCopy.enabled" [J] */}
      <FormControlLabel {/* WF4-REVIEW: v-model webhookCopy.enabled */} color="primary" label={t('general.enabled')} />
      {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "webhookCopy.name" [J] */}
      <TextField {/* WF4-REVIEW: v-model webhookCopy.name */} label={t('settings.webhooks.webhook-name')} variant="underlined" />
      {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "webhookCopy.url" [J] */}
      <TextField {/* WF4-REVIEW: v-model webhookCopy.url */} label={t('settings.webhooks.webhook-url')} variant="underlined" />
      {/* WF4-REVIEW: rules/error-messages → error+helperText */}
      <TextField value={scheduledTime} onChange={/* WF4-REVIEW: setter */ setScheduledTime} type="time" clearable variant="underlined" />
    </CardContent>
    <CardActions className="py-0 justify-end">
      <BaseButtonGroup buttons={[
          {
            icon: $globals.icons.delete,
            text: t('general.delete'),
            event: 'delete',
          },
          {
            icon: $globals.icons.testTube,
            text: t('general.test'),
            event: 'test',
          },
          {
            icon: $globals.icons.save,
            text: t('general.save'),
            event: 'save',
          },
        ]} onDelete={onDelete?.(webhookCopy.id)} onSave={handleSave} onTest={onTest?.(webhookCopy.id)} />
    </CardActions>
  </div>
    </>
  );
}
