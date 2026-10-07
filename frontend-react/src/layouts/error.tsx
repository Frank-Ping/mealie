import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, CardActions, CardHeader } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useGlobalI18n } from "@/composables/use-global-i18n";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  error?: Record<string, unknown>;
}

export const handle = {
  layout: "basic",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Error({ error = null }: Props) {
  const { t } = useTranslation();

  const props = /* props via generated interface + destructured signature */



  const i18n = useGlobalI18n();
  const auth = useMealieAuth();
  // icons imported directly (was $globals)
  const [ready, setReady] = useState(false);

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const navigate = useNavigate();

  async function insertGroupSlugIntoRoute() {
    const [groupSlug, setGroupSlug] = useState(auth.user?.groupSlug);
    if (!groupSlug) {
      return;
    }

    let replaceRoute = false;
    let routeVal = route.fullPath || "/";
    if (routeVal[0] !== "/") {
      routeVal = `/${routeVal}`;
    }

    // replace "recipe" in URL with "r"
    if (routeVal.includes("/recipe/")) {
      replaceRoute = true;
      routeVal = routeVal.replace("/recipe/", "/r/");
    }

    // insert groupSlug into URL
    const routeComponents = routeVal.split("/");
    if (routeComponents.length < 2 || routeComponents[1].toLowerCase() !== "g") {
      replaceRoute = true;
      routeVal = `/g/${groupSlug}${routeVal}`;
    }

    if (replaceRoute) {
      await navigate(/* WF4-REVIEW: replace+query */ routeVal);
    }
  }

  async function handle404() {
    const normalizedRoute = route.fullPath.replace(/\/$/, "");
    const newRoute = normalizedRoute.replace(/^\/group\/(mealplan|members|notifiers|webhooks)(\/.*)?$/, "/household/$1$2");

    if (newRoute !== normalizedRoute) {
      await navigate(/* WF4-REVIEW: replace+query */ newRoute);
    }
    else {
      await insertGroupSlugIntoRoute();
    }

    setReady(true);
  }

  if (error.statusCode === 404) {
    handle404();
  }
  else {
    setReady(true);
  }

  useSeoMeta({
    title:
          error.statusCode === 404
            ? (i18n.t("page.404-not-found") as string)
            : (i18n.t("page.an-error-occurred") as string),
  });

  const buttons = [
    { icon: icons.home, to: "/", text: i18n.t("general.home") },
  ];

  return (
    <>
  {(ready) ? (
    /* WF4-REVIEW: app shell — see rules §2; dropped Vuetify-only prop "dark" on <v-app> */
    <Box>
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader>
        <slot>
          <h1 className="mx-auto">
            {t("page.404-page-not-found")}
          </h1>
        </slot>
      </CardHeader>
      <div className="d-flex justify-space-around">
        <div className="d-flex align-center">
          <p className="primary--text">
            4
          </p>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={$globals.icons.primary} color="primary" className="mx-auto mb-0" size="200" />
          <p className="primary--text">
            4
          </p>
        </div>
      </div>
      <CardActions>
        <Box sx={ flexGrow: 1 } />
        <slot name="actions">
          {buttons.map((button, index) => (
            <Button key={index} nuxt component={Link} to={button.to} color="primary">
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={button.icon} />
              {button.text}
            </Button>
          ))}
        </slot>
        <Box sx={ flexGrow: 1 } />
      </CardActions>
    </Box>
  ) : null}
    </>
  );
}
