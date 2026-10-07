import { Outlet } from "react-router-dom";
import { Box, Slide } from "@mui/material";
import TheSnackbar from "@/components/Layout/LayoutParts/TheSnackbar";
import AppHeader from "@/components/Layout/LayoutParts/AppHeader";
import { useGlobalI18n } from "@/composables/use-global-i18n";

export default function Basic() {
  useGlobalI18n(); // ensure i18n is initialized

  return (
    <>
  {/* WF4-REVIEW: app shell — see rules §2; dropped Vuetify-only prop "dark" on <v-app> */}
  <Box>
    <TheSnackbar />
    <AppHeader menu={false} />
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
