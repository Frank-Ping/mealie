import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge, Button, Divider, Drawer, List, ListItem, ListItemText } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import type { SidebarLinks } from "@/types/application-types";
import AnnouncementDialog from "@/components/Domain/Announcement/AnnouncementDialog";
import UserAvatar from "@/components/Domain/User/UserAvatar";
import { useToggleDarkMode } from "@/composables/use-utils";
import { useAnnouncements } from "@/composables/use-announcements";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  user?: Record<string, unknown>;
  topLink: unknown[];
  secondaryLinks?: unknown[];
}

export default function AppSidebar({ user = null, topLink, secondaryLinks = null }: Props) {
  const { t } = useTranslation();

  const props = /* props via generated interface + destructured signature */

  const modelValue = defineModel<boolean>({ default: false });

  const auth = useMealieAuth();
  const sessionUser = auth.user; // was computed — plain read stays reactive
  const { loggedIn, isOwnGroup } = useLoggedInState();
  const isAdmin = auth.user?.admin; // was computed — plain read stays reactive
  const canManage = auth.user?.canManage; // was computed — plain read stays reactive

  const userFavoritesLink = useMemo(() => auth.user ? `/user/${auth.user.id}/favorites` : undefined, []); // WF4-REVIEW: dependency array
  const userProfileLink = useMemo(() => auth.user ? "/user/profile" : undefined, []); // WF4-REVIEW: dependency array

  const toggleDark = useToggleDarkMode();

  const [showAnnouncementsDialog, setShowAnnouncementsDialog] = useState(false);
  const { announcementsEnabled, newAnnouncements } = useAnnouncements();

  const state = /* WF4-REVIEW [J] */ reactive({
    dropDowns: {} as Record<string, boolean>,
    secondarySelected: null as string[] | null,
    bottomSelected: null as string[] | null,
    languageDialog: false as boolean,
  });

  const allLinks = useMemo(() => [...topLink, ...(secondaryLinks || [])], []); // WF4-REVIEW: dependency array
  function initDropdowns() {
    allLinks.forEach((link) => {
      state.dropDowns[link.title] = link.childrenStartExpanded || false;
    });
  }
  /* WF4-REVIEW [J] */ watch(
    () => allLinks,
    () => {
      initDropdowns();
    },
    {
      deep: true,
    },
  );

  return (
    <>
  {/* WF4-REVIEW: persistent/temporary variants */}
  <Drawer value={modelValue} onChange={/* WF4-REVIEW: setter */ setModelValue} className="d-flex flex-column d-print-none position-fixed" touchless>
    <AnnouncementDialog value={showAnnouncementsDialog} onChange={setShowAnnouncementsDialog} />
    {/* WF4-REVIEW: v-model on complex expression "state.languageDialog" [J] */}
    <LanguageDialog />
    {(loggedIn && sessionUser) ? (
      <>
        {/* WF4-REVIEW: @click → ListItemButton */}
        <ListItem lines="two" to={userProfileLink} exact>
          <div className="d-flex align-center ga-2">
            <UserAvatar list user-id={sessionUser.id} tooltip={false} />
            <div className="d-flex flex-column justify-start">
              {/* WF4-REVIEW: content → primary prop */}
              <ListItemText className="pr-2 pl-1">
                {sessionUser.fullName}
              </ListItemText>
              {/* WF4-REVIEW: content → secondary prop */}
              <ListItemText className="opacity-100">
                {(isOwnGroup) ? (
                  <Button className="px-2 pa-0" variant="text" component={Link} to={userFavoritesLink} size="small">
                    {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                    <MdiIcon name={icons.heart} size="small" />
                    {t("user.favorite-recipes")}
                  </Button>
                ) : null}
              </ListItemText>
            </div>
          </div>
        </ListItem>
        <Divider />
      </>
    ) : null}
    <slot />
    {(topLink) ? (
      <>
        {/* WF4-REVIEW: v-model on complex expression "state.secondarySelected" [J] */}
        <List nav density="comfortable" color="primary">
          {topLink.map(nav => (
            <>
              {(!nav.restricted || isOwnGroup) ? (
                <div key={nav.key || nav.title}>
                  {(nav.children) ? (
                    /* WF4-REVIEW: unmapped <v-list-group> — judgement component, convert manually [J]; v-model on complex expression "state.dropDowns[nav.title]" [J] */
                    <VListGroup key={(nav.key || nav.title) + 'multi-item'} color="primary" prepend-icon={nav.icon} fluid={true}>
                      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                      <>
                        {/* WF4-REVIEW: @click → ListItemButton */}
                        <ListItem {...(hoverProps)} prepend-icon={nav.icon} title={nav.title} />
                      </>
                      {nav.children.map(child => (
                        /* WF4-REVIEW: @click → ListItemButton */
                        <ListItem key={child.key || child.title} exact to={child.to} prepend-icon={child.icon} title={child.title} className="ml-4" />
                      ))}
                    </VListGroup>
                  ) : null}
                  <>
                    {/* WF4-REVIEW: @click → ListItemButton */}
                    <ListItem key={(nav.key || nav.title) + 'single-item'} exact link to={nav.to} prepend-icon={nav.icon} title={nav.title} />
                  </>
                </div>
              ) : null}
            </>
          ))}
        </List>
      </>
    ) : null}
    {(secondaryLinks.length > 0) ? (
      <>
        <Divider className="mt-2" />
        {/* WF4-REVIEW: v-model on complex expression "state.secondarySelected" [J] */}
        <List nav density="compact" exact>
          {secondaryLinks.map(nav => (
            <>
              {(!nav.restricted || isOwnGroup) ? (
                <div key={nav.key || nav.title}>
                  {(nav.children) ? (
                    /* WF4-REVIEW: unmapped <v-list-group> — judgement component, convert manually [J]; v-model on complex expression "state.dropDowns[nav.title]" [J] */
                    <VListGroup key={(nav.key || nav.title) + 'multi-item'} color="primary" prepend-icon={nav.icon} fluid>
                      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                      <>
                        {/* WF4-REVIEW: @click → ListItemButton */}
                        <ListItem {...(hoverProps)} prepend-icon={nav.icon} title={nav.title} />
                      </>
                      {nav.children.map(child => (
                        /* WF4-REVIEW: @click → ListItemButton */
                        <ListItem key={child.key || child.title} exact to={child.to} className="ml-2" prepend-icon={child.icon} title={child.title} />
                      ))}
                    </VListGroup>
                  ) : null}
                  {/* WF4-REVIEW: @click → ListItemButton */}
                  <ListItem key={(nav.key || nav.title) + 'single-item'} exact link to={nav.to}>
                    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                    <>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={nav.icon} />
                    </>
                    {/* WF4-REVIEW: content → primary prop */}
                    <ListItemText>
                      {nav.title}
                    </ListItemText>
                  </ListItem>
                </div>
              ) : null}
            </>
          ))}
        </List>
      </>
    ) : null}
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      {/* WF4-REVIEW: v-model on complex expression "state.bottomSelected" [J] */}
      <List nav density="comfortable">
        {(loggedIn && announcementsEnabled) ? (
          /* WF4-REVIEW: @click → ListItemButton */
          <ListItem title={t('announcements.announcements')} onClick={() => showAnnouncementsDialog = !showAnnouncementsDialog}>
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              {/* WF4-REVIEW: content → badgeContent */}
              <Badge model-value={!!newAnnouncements.length} color="accent" content={newAnnouncements.length || undefined} offset-x="-2">
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={icons.bullhornVariant} />
              </Badge>
            </>
          </ListItem>
        ) : null}
        {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
        <VMenu location="end bottom" offset={15}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem {...(hoverProps)} prepend-icon={icons.cog} title={t('general.settings')} />
          </>
          <List density="comfortable" color="primary">
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem prepend-icon={icons.translate} title={t('sidebar.language')} onClick={state.languageDialog=true} />
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem prepend-icon={$vuetify.theme.current.dark ? icons.weatherSunny : icons.weatherNight} title={$vuetify.theme.current.dark ? t('settings.theme.light-mode') : t('settings.theme.dark-mode')} onClick={toggleDark} />
            {(loggedIn) ? (
              <Divider className="my-2" />
            ) : null}
            {(loggedIn) ? (
              /* WF4-REVIEW: @click → ListItemButton */
              <ListItem prepend-icon={icons.cog} title={t('profile.user-settings')} to="/user/profile" />
            ) : null}
            {(canManage) ? (
              /* WF4-REVIEW: @click → ListItemButton */
              <ListItem prepend-icon={icons.manageData} title={t('data-pages.data-management')} to="/group/data" />
            ) : null}
            {(isAdmin) ? (
              <Divider className="my-2" />
            ) : null}
            {(isAdmin) ? (
              /* WF4-REVIEW: @click → ListItemButton */
              <ListItem prepend-icon={icons.wrench} title={t('settings.admin-settings')} to="/admin/site-settings" />
            ) : null}
          </List>
        </VMenu>
      </List>
    </>
  </Drawer>
    </>
  );
}
