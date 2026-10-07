import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Slide } from "@mui/material";
import TheSnackbar from "@/components/Layout/LayoutParts/TheSnackbar";

export default function Blank() {
  const { t } = useTranslation();

  return (
    <>
  {/* WF4-REVIEW: app shell — see rules §2; dropped Vuetify-only prop "dark" on <v-app> */}
  <Box>
    <TheSnackbar />
    {($appInfo.demoStatus) ? (
      /* WF4-REVIEW: full-width styling */
      <Alert sticky>
        <div className="text-center">
          <b>
            {t("demo.info_message_with_version", { version: $appInfo.version })}
          </b>
        </div>
      </Alert>
    ) : null}
    <Box component="main">
      {/* WF4-REVIEW: transition direction/appear semantics — MUI Slide needs explicit in */}
      <Slide in={true}>
        <div>
          <Outlet />
        </div>
      </Slide>
    </Box>
  </Box>
    </>
  );
}
