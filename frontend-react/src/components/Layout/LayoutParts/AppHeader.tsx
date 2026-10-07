import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppBar, Box, Button, TextField, Typography } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import type RecipeDialogSearch from "@/components/Domain/Recipe/RecipeDialogSearch";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  menu?: boolean;
}

export default function AppHeader({ menu = true }: Props) {
  const { t } = useTranslation();

  /* props via generated interface + destructured signature */
  const auth = useMealieAuth();
  const { loggedIn } = useLoggedInState();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  const { xs, smAndUp } = useDisplay();

  const routerLink = useMemo(() => groupSlug ? `/g/${groupSlug}` : "/", []); // WF4-REVIEW: dependency array
  const [domSearchDialog, setDomSearchDialog] = useState(null);

  function activateSearch() {
    domSearchDialog?.open();
  }

  function handleKeyEvent(e: KeyboardEvent) {
    const activeTag = document.activeElement?.tagName;
    if (e.key === "/" && activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
      e.preventDefault();
      activateSearch();
    }
  }

  /* WF4-REVIEW [J] */ onMounted(() => {
    document.addEventListener("keydown", handleKeyEvent);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("keydown", handleKeyEvent);
  });

  async function logout() {
    try {
      await auth.signOut("/login?direct=1");
    }
    catch (e) {
      console.error(e);
    }
  }

  return (
    <>
  {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-app-bar> */}
  <AppBar clipped-left density="compact" app color="primary" className="d-print-none">
    <slot />
    <RouterLink to={routerLink}>
      <Button icon color="white">
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={icons.primary} size="40" />
      </Button>
    </RouterLink>
    <div btn className="pl-2">
      <Typography variant="h6" style="cursor: pointer" onClick={$router.push(routerLink)}>
        Mealie
      </Typography>
    </div>
    <RecipeDialogSearch ref="domSearchDialog" />
    <Box sx={{ flexGrow: 1 }} />
    {(menu) ? (
      <>
        {(!xs) ? (
          /* WF4-REVIEW: aspect-ratio → sx aspectRatio */
          <Box max-width="250" onClick={activateSearch}>
            {/* WF4-REVIEW: rules/error-messages → error+helperText */}
            <TextField readonly className="mt-1" rounded variant="solo-filled" density="compact" flat prepend-inner-icon={icons.search} bg-color="primary-darken-1" placeholder={t('search.search-hint')} />
          </Box>
        ) : (
          <Button icon onClick={activateSearch}>
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={icons.search} />
          </Button>
        )}
        {(loggedIn) ? (
          <Button variant={smAndUp ? 'text' : undefined} icon={xs} onClick={logout()}>
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={icons.logout} start={smAndUp} />
            {smAndUp ? t("user.logout") : ""}
          </Button>
        ) : (
          <Button variant="text" nuxt to="/login">
            {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
            <MdiIcon name={icons.user} />
            {t("user.login")}
          </Button>
        )}
      </>
    ) : null}
  </AppBar>
    </>
  );
}
