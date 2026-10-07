import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Slide } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import AppHeader from "@/components/Layout/LayoutParts/AppHeader";
import AppSidebar from "@/components/Layout/LayoutParts/AppSidebar";
import TheSnackbar from "@/components/Layout/LayoutParts/TheSnackbar";
import type { SidebarLinks } from "@/types/application-types";
import { useGlobalI18n } from "@/composables/use-global-i18n";

export default function Admin() {
  const { t } = useTranslation();

  const i18n = useGlobalI18n();
  const display = useDisplay();
  // icons imported directly (was $globals)

  const [sidebar, setSidebar] = useState(false);
  /* WF4-REVIEW [J] */ onMounted(() => {
    setSidebar(display.lgAndUp);
  });

  const topLinks: SidebarLinks = [
    {
      icon: icons.cog,
      to: "/admin/site-settings",
      title: i18n.t("sidebar.site-settings"),
      restricted: true,
    },

    // {
    //   icon: icons.chart,
    //   to: "/admin/analytics",
    //   title: "Analytics",
    //   restricted: true,
    // },
    {
      icon: icons.user,
      to: "/admin/manage/users",
      title: i18n.t("user.users"),
      restricted: true,
    },
    {
      icon: icons.household,
      to: "/admin/manage/households",
      title: i18n.t("household.households"),
      restricted: true,
    },
    {
      icon: icons.group,
      to: "/admin/manage/groups",
      title: i18n.t("group.groups"),
      restricted: true,
    },
    {
      icon: icons.database,
      to: "/admin/backups",
      title: i18n.t("sidebar.backups"),
      restricted: true,
    },
  ];

  const developerLinks: SidebarLinks = [
    {
      icon: icons.wrench,
      to: "/admin/maintenance",
      title: i18n.t("sidebar.maintenance"),
      restricted: true,
    },
    {
      icon: icons.robot,
      title: i18n.t("recipe.debug"),
      restricted: true,
      children: [
        {
          icon: icons.robot,
          to: "/admin/debug/openai",
          title: i18n.t("admin.openai"),
          restricted: true,
        },
        {
          icon: icons.slotMachine,
          to: "/admin/debug/parser",
          title: i18n.t("sidebar.parser"),
          restricted: true,
        },
      ],
    },
  ];

  return (
    <>
  {/* WF4-REVIEW: app shell — see rules §2; dropped Vuetify-only prop "dark" on <v-app> */}
  <Box>
    <TheSnackbar />
    <AppHeader>
      <Button icon onClick={(e) => { e.stopPropagation(); setSidebar(!sidebar); }}>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={icons.menu} />
      </Button>
    </AppHeader>
    <AppSidebar value={sidebar} onChange={setSidebar} top-link={topLinks} user={{ data: true }} secondary-header={t('sidebar.developer')} secondary-links={developerLinks} />
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
