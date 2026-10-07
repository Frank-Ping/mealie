import { useMemo, useState } from "react";
import { Dialog, Drawer } from "@mui/material";
import { useGlobalI18n } from "@/composables/use-global-i18n";

interface DialogProps {
  modelValue: boolean;
  color?: string;
  title?: string;
  icon?: string | null;
  width?: number | string;
  maxWidth?: number | string | null;
  loading?: boolean;
  top?: boolean | null;
  keepOpen?: boolean;
  bottomSheet?: boolean;

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
  disableSubmitOnEnter?: boolean;
}

interface DialogEmits {
  (e: "update:modelValue", value: boolean): void;
  (e: "submit" | "cancel" | "confirm" | "delete" | "close"): void;
}

export default function BaseDialog({ color = "primary", title = "Modal Title", icon = null, width = "500", maxWidth = null, loading = false, top = null, keepOpen = false, bottomSheet = false, submitDisabled = false, canConfirm = false, canSubmit = false, disableSubmitOnEnter = false }: Props) {
  const i18n = useGlobalI18n();





  // Using TypeScript interface with withDefaults for props
  /* props via destructured signature (was withDefaults(defineProps<DialogProps>) */
  const emit = defineEmits<DialogEmits>();

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const dialog = computed({
    get: () => modelValue,
    set: val => emit("update:modelValue", val),
  });

  const [submitted, setSubmitted] = useState(false);

  const determineClose = useMemo(() => {
    return submitted && !loading && !keepOpen;
  }, []); // WF4-REVIEW: dependency array

  /* WF4-REVIEW [J] */ watch(determineClose, (shouldClose) => {
    if (shouldClose) {
      setSubmitted(false);
      dialog = false;
    }
  });

  /* WF4-REVIEW [J] */ watch(dialog, (val) => {
    if (val) setSubmitted(false);
    if (!val) emit("close");
  });

  function submitEvent() {
    emit("submit");
    setSubmitted(true);
  }

  function submitOnEnter() {
    if (disableSubmitOnEnter) {
      return;
    }

    if (canConfirm) {
      if (!submitDisabled) {
        emit("confirm");
        dialog = false;
      }
      return;
    }

    submitEvent();
  }

  function deleteEvent() {
    emit("delete");
    setSubmitted(true);
  }

  function open() {
    dialog = true;
  }

  const bindings = useMemo(() => ({
    color: color,
    title: title,
    icon: icon,
    loading: loading,
    submitIcon: submitIcon,
    submitText: submitText ?? i18n.t("general.create"),
    submitDisabled: submitDisabled,
    cancelText: cancelText ?? i18n.t("general.cancel"),
    canDelete: canDelete,
    canConfirm: canConfirm,
    canSubmit: canSubmit,
    onCancel: () => {
      emit("cancel");
      dialog = false;
    },
    onConfirm: () => {
      emit("confirm");
      dialog = false;
    },
    onSubmit: submitEvent,
    onDelete: deleteEvent,
  }), []); // WF4-REVIEW: dependency array

  return (
    <>
  <div>
    <slot name="activator" {...({ open })} />
    {(bottomSheet && $vuetify.display.xs) ? (
      /* WF4-REVIEW: swipeable? */
      <Drawer anchor="bottom" value={dialog} onChange={/* WF4-REVIEW: setter */ setDialog} content-class="rounded-t-xl" content-props={{
        style: 'overflow: hidden',
      }} max-width={maxWidth ?? undefined} onKeyDown={submitOnEnter} onClickOutside={emit('cancel')} onKeyDown={emit('cancel')}>
        <BaseDialogContent {...(bindings)}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <slot {...({ submitEvent })} />
          </>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <slot name="card-actions" />
          </>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <slot name="custom-card-action" />
          </>
        </BaseDialogContent>
      </Drawer>
    ) : (
      /* WF4-REVIEW: max-width/scrollable */
      <Dialog open={dialog} onClose={/* WF4-REVIEW: setter */ setDialog} width={width} max-width={maxWidth ?? undefined} content-class={top ? 'top-dialog' : undefined} fullscreen={$vuetify.display.xs} onKeyDown={submitOnEnter} onClickOutside={emit('cancel')} onKeyDown={emit('cancel')}>
        <BaseDialogContent {...(bindings)}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <slot {...({ submitEvent })} />
          </>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <slot name="card-actions" />
          </>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <slot name="custom-card-action" />
          </>
        </BaseDialogContent>
      </Dialog>
    )}
  </div>
    </>
  );
}
