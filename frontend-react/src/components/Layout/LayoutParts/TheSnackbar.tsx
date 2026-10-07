import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, LinearProgress, Snackbar } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useNuxtApp } from "#app";
import { toastAlert, toastLoading } from "@/composables/use-toast";

export default function TheSnackbar() {
  const { t } = useTranslation();

  // icons imported directly (was $globals)
  const icon = useMemo(() => {
    switch (toastAlert.color) {
      case "error":
        return icons.alertOutline;
      case "success":
        return icons.checkBold;
      case "info":
        return icons.informationOutline;
      default:
        return icons.alertOutline;
    }
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  <div className="text-center">
    {/* WF4-REVIEW: v-model on complex expression "toastAlert.open" [J] */}
    <Snackbar location="top" color={toastAlert.color} timeout={toastAlert.timeout ?? 2000}>
      {(icon) ? (
        /* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "dark" on <v-icon>; dropped Vuetify-only prop "start" on <v-icon> */
        <MdiIcon icon={icon} />
      ) : null}
      {toastAlert.title}
      {toastAlert.text}
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        <Button variant="text" onClick={() => {
            toastAlert.action?.onClick();
            toastAlert.open = false
          }}>
          {toastAlert.action?.message ?? t('general.close')}
        </Button>
      </>
    </Snackbar>
    {/* WF4-REVIEW: v-model on complex expression "toastLoading.open" [J] */}
    <Snackbar content-class="py-2" density="compact" location="bottom" timeout={-1} color={toastLoading.color}>
      <div className="d-flex flex-column align-center justify-start" onClick={toastLoading.open = false}>
        <div className="mb-2 mt-0 text-subtitle-1 text-center">
          {toastLoading.text}
        </div>
        <LinearProgress indeterminate color="white-darken-2" />
      </div>
    </Snackbar>
  </div>
    </>
  );
}
