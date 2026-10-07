import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, Divider, LinearProgress, Toolbar, Typography } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useGlobalI18n } from "@/composables/use-global-i18n";

interface DialogProps {
  color?: string;
  title?: string;
  icon?: string | null;
  loading?: boolean;

  // submit
  submitIcon?: string | null;
  submitText?: string;
  submitDisabled?: boolean;

  // cancel
  cancelText?: string;

  // actions
  canDelete?: boolean;
  canConfirm?: boolean;
  canSubmit?: boolean;
}

interface DialogEmits {
  (e: "submit" | "cancel" | "confirm" | "delete"): void;
}

export default function BaseDialogContent({ color = "primary", title = "Modal Title", icon = null, loading = false, submitDisabled = false, canConfirm = false, canSubmit = false }: Props) {
  const { t } = useTranslation();

  // Using TypeScript interface with withDefaults for props
  /* props via destructured signature (was withDefaults(defineProps<DialogProps>) */
  const emit = defineEmits<DialogEmits>();

  const i18n = useGlobalI18n();

  const submitLabel = useMemo(() => submitText ?? i18n.t("general.create", []); // WF4-REVIEW: dependency array);
  const cancelLabel = useMemo(() => cancelText ?? i18n.t("general.cancel", []); // WF4-REVIEW: dependency array);

  return (
    <>
  <Card height="100%" loading={loading}>
    <template>
      <LinearProgress active={isActive} indeterminate />
    </template>
    {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-toolbar> */}
    <Toolbar density="comfortable" color={color} className="px-3 position-relative top-0 left-0 w-100">
      {/* WF4-REVIEW: icon name resolves via lib/icons */}
      <MdiIcon name={icon} size="large" />
      <Typography variant="h6" className="headline">
        {title}
      </Typography>
    </Toolbar>
    <div style="flex: 1 1 auto; min-height: 0; overflow: auto">
      <slot />
    </div>
    <Box sx={ flexGrow: 1 } />
    <Divider />
    <CardActions className={$vuetify.display.xs ? 'pb-4 grid-small' : undefined}>
      <slot name="card-actions">
        <Button variant="text" color="grey" onClick={emit('cancel')}>
          {cancelLabel}
        </Button>
        {(!$vuetify.display.xs) ? (
          <Box sx={ flexGrow: 1 } />
        ) : null}
        <slot name="custom-card-action" />
        {(canDelete) ? (
          <BaseButton delete onClick={emit('delete')} />
        ) : null}
        {(canConfirm) ? (
          <BaseButton color={color} type="submit" disabled={submitDisabled} onClick={emit('confirm')}>
            <template>
              {$globals.icons.check}
            </template>
            {t("general.confirm")}
          </BaseButton>
        ) : null}
        {(canSubmit) ? (
          <BaseButton type="submit" disabled={submitDisabled || loading} onClick={emit('submit')}>
            {submitLabel}
            {(submitIcon) ? (
              <template>
                {submitIcon}
              </template>
            ) : null}
          </BaseButton>
        ) : null}
      </slot>
    </CardActions>
  </Card>
    </>
  );
}
