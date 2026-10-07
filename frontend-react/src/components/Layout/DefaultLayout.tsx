import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Divider, List, ListItem, ListItemText, Slide } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import type { SideBarLink } from "@/types/application-types";
import { useGroupSelf } from "@/composables/use-groups";
import { useCookbookPreferences } from "@/composables/use-users/preferences";
import { useCookbookStore, usePublicCookbookStore } from "@/composables/store/use-cookbook-store";
import type { ReadCookBook } from "@/lib/api/types/cookbook";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function DefaultLayout() {
  const { t } = useTranslation();

  const i18n = useI18n();
  // icons imported directly (was $globals)
  const display = useDisplay();
  const auth = useMealieAuth();
  const { isOwnGroup } = useLoggedInState();
  const { group } = useGroupSelf();

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const cookbookPreferences = useCookbookPreferences();
  const ownCookbookStore = useMemo(() => isOwnGroup ? useCookbookStore(i18n, []); // WF4-REVIEW: dependency array : null);
  const publicCookbookStoreCache = ref<Record<string, ReturnType<typeof usePublicCookbookStore>>>({});

  function getPublicCookbookStore(slug: string) {
    if (!publicCookbookStoreCache.value[slug]) {
      publicCookbookStoreCache.value[slug] = usePublicCookbookStore(slug, i18n);
    }
    return publicCookbookStoreCache.value[slug];
  }

  const cookbooks = useMemo(() =>  {
    if (ownCookbookStore, []); // WF4-REVIEW: dependency array {
      return ownCookbookStore.store;
    }
    else if (groupSlug) {
      const publicStore = getPublicCookbookStore(groupSlug);
      return unref(publicStore.store);
    }
    return [];
  });

  const showAIImport = group?.aiProviderSettings?.aiEnabled; // was computed — plain read stays reactive

  const [sidebar, setSidebar] = useState(false);
  /* WF4-REVIEW [J] */ onMounted(() => {
    setSidebar(display.lgAndUp);
  });

  function cookbookAsLink(cookbook: ReadCookBook): SideBarLink {
    return {
      key: cookbook.slug || "",
      icon: icons.pages,
      title: cookbook.name,
      to: `/g/${groupSlug}/cookbooks/${cookbook.slug || ""}`,
      restricted: false,
    };
  }

  const currentUserHouseholdId = auth.user?.householdId; // was computed — plain read stays reactive
  const cookbookLinks = useMemo(() =>  {
    if (!cookbooks?.length, []); // WF4-REVIEW: dependency array {
      return [];
    }

    const sortedCookbooks = [...cookbooks].sort((a, b) => (a.position || 0) - (b.position || 0));

    const ownLinks: SideBarLink[] = [];
    const links: SideBarLink[] = [];
    const cookbooksByHousehold = sortedCookbooks.reduce((acc, cookbook) => {
      const householdName = cookbook.household?.name || "";
      (acc[householdName] ||= []).push(cookbook);
      return acc;
    }, {} as Record<string, ReadCookBook[]>);

    Object.entries(cookbooksByHousehold).forEach(([householdName, cookbooks]) => {
      if (!cookbooks.length) {
        return;
      }
      if (cookbooks[0].householdId === currentUserHouseholdId) {
        ownLinks.push(...cookbooks.map(cookbookAsLink));
      }
      else {
        links.push({
          key: householdName,
          icon: icons.book,
          title: householdName,
          children: cookbooks.map(cookbookAsLink),
          restricted: false,
        });
      }
    });

    links.sort((a, b) => a.title.localeCompare(b.title));
    if (auth.user && cookbookPreferences.hideOtherHouseholds) {
      return ownLinks;
    }
    else {
      return [...ownLinks, ...links];
    }
  });

  const createLinks = useMemo(() => [
    {
      insertDivider: false,
      icon: icons.link,
      title: i18n.t("general.import", []); // WF4-REVIEW: dependency array,
      subtitle: i18n.t("new-recipe.import-by-url"),
      to: `/g/${groupSlug}/r/create/url`,
      restricted: true,
      hide: false,
    },
    {
      insertDivider: false,
      icon: icons.autoFix,
      title: i18n.t("recipe.import-with-ai"),
      subtitle: i18n.t("recipe.import-with-ai-subtitle"),
      to: `/g/${groupSlug}/r/create/ai`,
      restricted: true,
      hide: !showAIImport,
    },
    {
      insertDivider: true,
      icon: icons.edit,
      title: i18n.t("general.create"),
      subtitle: i18n.t("new-recipe.create-manually"),
      to: `/g/${groupSlug}/r/create/new`,
      restricted: true,
      hide: false,
    },
  ]);

  const topLinks = useMemo(() => [
    {
      icon: icons.silverwareForkKnife,
      to: `/g/${groupSlug}`,
      title: i18n.t("general.recipes", []); // WF4-REVIEW: dependency array,
      restricted: false,
    },
    {
      icon: icons.search,
      to: `/g/${groupSlug}/recipes/finder`,
      title: i18n.t("recipe-finder.recipe-finder"),
      restricted: false,
    },
    {
      icon: icons.calendarMultiselect,
      title: i18n.t("meal-plan.meal-planner"),
      to: "/household/mealplan/planner/view",
      restricted: true,
    },
    {
      icon: icons.formatListCheck,
      title: i18n.t("shopping-list.shopping-lists"),
      to: "/shopping-lists",
      restricted: true,
    },
    {
      icon: icons.timelineText,
      title: i18n.t("recipe.timeline"),
      to: `/g/${groupSlug}/recipes/timeline`,
      restricted: true,
    },
    {
      icon: icons.book,
      to: `/g/${groupSlug}/cookbooks`,
      title: i18n.t("cookbook.cookbooks"),
      restricted: true,
    },
    {
      icon: icons.organizers,
      title: i18n.t("general.organizers"),
      restricted: true,
      children: [
        {
          icon: icons.categories,
          to: `/g/${groupSlug}/recipes/categories`,
          title: i18n.t("sidebar.categories"),
          restricted: true,
        },
        {
          icon: icons.tags,
          to: `/g/${groupSlug}/recipes/tags`,
          title: i18n.t("sidebar.tags"),
          restricted: true,
        },
        {
          icon: icons.potSteam,
          to: `/g/${groupSlug}/recipes/tools`,
          title: i18n.t("tool.tools"),
          restricted: true,
        },
      ],
    },
  ]);

  return (
    <>
  {/* WF4-REVIEW: app shell — see rules §2; dropped Vuetify-only prop "dark" on <v-app> */}
  <Box>
    <TheSnackbar />
    <AppHeader>
      <Button icon onClick={(e) => { e.stopPropagation(); sidebar = !sidebar; }}>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={$globals.icons.menu} />
      </Button>
    </AppHeader>
    <AppSidebar value={sidebar} onChange={setSidebar} top-link={topLinks} secondary-links={cookbookLinks || []}>
      {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
      <VMenu offset-y nudge-bottom="5" close-delay="50" nudge-right="15">
        <template>
          {(isOwnGroup) ? (
            <Button rounded size="large" className="ml-2 mt-3" {...(props)} variant="elevated" elevation="2" color={$vuetify.theme.current.dark ? 'background-lighten-1' : 'background-darken-1'}>
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={$globals.icons.createAlt} size="large" color="primary" />
              {t("general.create")}
            </Button>
          ) : null}
        </template>
        <List density="comfortable" className="mb-0 mt-1 py-0" variant="flat">
          {createLinks.map((item, index) => (
            <template>
              {(!item.hide) ? (
                <div key={item.title}>
                  {(item.insertDivider) ? (
                    <Divider key={index} className="mx-2" />
                  ) : null}
                  {(!item.restricted || isOwnGroup) ? (
                    /* WF4-REVIEW: @click → ListItemButton */
                    <ListItem key={item.title} to={item.to} exact className="my-1">
                      <template>
                        {/* WF4-REVIEW: icon name resolves via lib/icons */}
                        <MdiIcon size="40" icon={item.icon} />
                      </template>
                      {/* WF4-REVIEW: content → primary prop */}
                      <ListItemText className="font-weight-medium" style="font-size: small;">
                        {item.title}
                      </ListItemText>
                      {/* WF4-REVIEW: content → secondary prop */}
                      <ListItemText className="font-weight-medium" style="font-size: small;">
                        {item.subtitle}
                      </ListItemText>
                    </ListItem>
                  ) : null}
                </div>
              ) : null}
            </template>
          ))}
        </List>
      </VMenu>
    </AppSidebar>
    <Box component="main" className="pt-12">
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
