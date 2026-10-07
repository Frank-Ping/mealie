import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Container, Slide } from "@mui/material";

export const handle = {
  middleware: ["auth", "can-organize-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Data() {
  const { t } = useTranslation();

  const { i18n } = useTranslation();
  const buttonLookup: { [key: string]: string } = {
    recipes: i18n.t("general.recipes"),
    recipeActions: i18n.t("recipe.recipe-actions"),
    foods: i18n.t("general.foods"),
    units: i18n.t("general.units"),
    labels: i18n.t("data-pages.labels.labels"),
    categories: i18n.t("category.categories"),
    tags: i18n.t("tag.tags"),
    tools: i18n.t("tool.tools"),
  };

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]

  const DATA_TYPE_OPTIONS = useMemo(() => [
    {
      text: i18n.t("general.recipes"),
      value: "new",
      to: "/group/data/recipes",
    },
    {
      text: i18n.t("recipe.recipe-actions"),
      value: "new",
      to: "/group/data/recipe-actions",
      divider: true,
    },
    {
      text: i18n.t("general.foods"),
      value: "url",
      to: "/group/data/foods",
    },
    {
      text: i18n.t("general.units"),
      value: "new",
      to: "/group/data/units",
    },
    {
      text: i18n.t("data-pages.labels.labels"),
      value: "new",
      to: "/group/data/labels",
      divider: true,
    },
    {
      text: i18n.t("category.categories"),
      value: "new",
      to: "/group/data/categories",
    },
    {
      text: i18n.t("tag.tags"),
      value: "new",
      to: "/group/data/tags",
    },
    {
      text: i18n.t("tool.tools"),
      value: "new",
      to: "/group/data/tools",
    },
  ], []); // WF4-REVIEW: dependency array

  const buttonText = useMemo(() => {
    const last = route.path
      .split("/")
      .pop()
    // convert hypenated-values to camelCase
      ?.replace(/-([a-z])/g, function (g) {
        return g[1].toUpperCase();
      });

    if (last) {
      return buttonLookup[last];
    }

    return i18n.t("data-pages.select-data");
  }, []); // WF4-REVIEW: dependency array

  useSeoMeta({
    title: i18n.t("data-pages.data-management"),
  });

  return (
    <>
  <Container>
    <BasePageTitle>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="100%" max-height="175" max-width="175" src="/svgs/manage-recipes.svg" />
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t('data-pages.data-management')}
      </>
      {t('data-pages.data-management-description')}
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        <div>
          <BaseOverflowButton btn-text={buttonText} mode="link" rounded items={DATA_TYPE_OPTIONS} />
        </div>
      </>
    </BasePageTitle>
    <section>
      {/* WF4-REVIEW: transition direction/appear semantics — MUI Slide needs explicit in */}
      <Slide in={true}>
        <div>
          <Outlet />
        </div>
      </Slide>
    </section>
  </Container>
    </>
  );
}
