import { useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Container } from "@mui/material";
import { icons } from "@/lib/icons";
import type { MenuItem } from "@/components/global/BaseOverflowButton";
import AdvancedOnly from "@/components/global/AdvancedOnly";
import { useGroupSelf } from "@/composables/use-groups";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  middleware: ["auth", "group-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Create() {
  const { t } = useTranslation();

  const { i18n } = useTranslation();
  const auth = useMealieAuth();
  // icons imported directly (was $globals)
  const { group } = useGroupSelf();

  useSeoMeta({
    title: i18n.t("general.create"),
  });

  const subpages = useMemo(() => [
    {
      icon: icons.link,
      text: i18n.t("recipe.import-with-url"),
      value: "url",
    },
    {
      icon: icons.link,
      text: i18n.t("recipe.bulk-url-import"),
      value: "bulk",
    },
    {
      icon: icons.codeTags,
      text: i18n.t("recipe.import-from-html-or-json"),
      value: "html",
    },
    {
      icon: icons.autoFix,
      text: i18n.t("recipe.import-with-ai"),
      value: "ai",
      hide: !group?.aiProviderSettings?.aiEnabled,
    },
    {
      icon: icons.edit,
      text: i18n.t("recipe.create-recipe"),
      value: "new",
    },
    {
      icon: icons.zip,
      text: i18n.t("recipe.import-with-zip"),
      value: "zip",
    },
    {
      icon: icons.robot,
      text: i18n.t("recipe.debug-scraper"),
      value: "debug",
    },
  ], []); // WF4-REVIEW: dependency array

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const navigate = useNavigate();
  const groupSlug = useMemo(() => route.params.groupSlug || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const subpage = computed({
    set(subpage: string) {
      navigate({ path: `/g/${groupSlug}/r/create/${subpage}`, query: route.query });
    },
    get() {
      return route.path.split("/").pop() ?? "url";
    },
  });

  return (
    <>
  <div>
    <Container className="flex-column">
      <BasePageTitle divider>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {/* WF4-REVIEW: cover → objectFit */}
          <Box component="img" width="100%" max-height="175" max-width="175" src="/svgs/recipes-create.svg" />
        </>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {t('recipe.recipe-creation')}
        </>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          <div className="flex-1-1 d-flex flex-column justify-center align-center ga-2">
            <p>
              {t('recipe.select-one-of-the-various-ways-to-create-a-recipe')}
            </p>
            <div className="ml-auto">
              <BaseOverflowButton value={subpage} onChange={/* WF4-REVIEW: setter */ setSubpage} rounded items={subpages} />
            </div>
          </div>
        </>
      </BasePageTitle>
      <section>
        <Outlet />
      </section>
    </Container>
    <AdvancedOnly>
      <Container className="d-flex justify-center align-center my-4">
        <router-link to={`/group/migrations`} className="text-primary">
          {t('recipe.looking-for-migrations')}
        </router-link>
      </Container>
    </AdvancedOnly>
  </div>
    </>
  );
}
