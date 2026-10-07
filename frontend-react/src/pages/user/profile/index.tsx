import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardActions, CardContent, CardHeader, Container, Divider, Grid } from "@mui/material";
import { icons } from "@/lib/icons";
import UserProfileLinkCard from "@/components/Domain/User/UserProfileLinkCard";
import { useUserApi } from "@/composables/api";
import UserAvatar from "@/components/Domain/User/UserAvatar";
import { useAsyncKey } from "@/composables/use-utils";
import StatsCards from "@/components/global/StatsCards";
import type { UserOut } from "@/lib/api/types/user";
import UserInviteDialog from "@/components/Domain/User/UserInviteDialog";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  name: "UserProfile",
  middleware: ["auth"],
  scrollToTop: true,
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function ProfilePage() {
  const { t } = useTranslation();

  const { i18n } = useTranslation();
  const auth = useMealieAuth();
  const { $appInfo } = useNuxtApp();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  useSeoMeta({
    title: i18n.t("settings.profile"),
  });

  const user = useMemo(() => {
    const authUser = auth.user;
    if (!authUser) return null;

    // Override canInvite if password login is disabled
    const canInvite = !$appInfo.allowPasswordLogin ? false : authUser.canInvite;

    return {
      ...authUser,
      canInvite,
    };
  }, []); // WF4-REVIEW: dependency array

  const [inviteDialog, setInviteDialog] = useState(false);
  const api = useUserApi();

  const { data: stats } = useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await api.households.statistics();
        if (cancelled) return;

          if (data) {
            return data;
          }
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

  const filteredStats = useMemo(() => {
    const statsData = stats;
    if (!statsData) return {};
    if (!user?.canManage) {
      const { totalUsers, ...rest } = statsData;
      return rest;
    }
    return statsData;
  }, []); // WF4-REVIEW: dependency array

  const statsText: { [key: string]: string } = {
    totalRecipes: i18n.t("general.recipes"),
    totalUsers: i18n.t("user.users"),
    totalCategories: i18n.t("sidebar.categories"),
    totalTags: i18n.t("sidebar.tags"),
    totalTools: i18n.t("tool.tools"),
  };

  function getStatsTitle(key: string) {
    return statsText[key] ?? "unknown";
  }

  // icons imported directly (was $globals)

  const iconText: { [key: string]: string } = {
    totalUsers: icons.user,
    totalCategories: icons.categories,
    totalTags: icons.tags,
    totalTools: icons.potSteam,
  };

  function getStatsIcon(key: string) {
    return iconText[key] ?? icons.primary;
  }

  const statsTo = useMemo(() => {
    return {
      totalRecipes: `/g/${groupSlug}/`,
      totalUsers: "/household/members",
      totalCategories: `/g/${groupSlug}/recipes/categories`,
      totalTags: `/g/${groupSlug}/recipes/tags`,
      totalTools: `/g/${groupSlug}/recipes/tools`,
    };
  }, []); // WF4-REVIEW: dependency array

  function getStatsTo(key: string) {
    return statsTo.value[key] ?? "unknown";
  }

  return (
    <>
  {(user) ? (
    <Container className="mb-8">
      <section className="d-flex flex-column align-center mt-4">
        <UserAvatar tooltip={false} size="96" user-id={user.id} />
        <h2 className="text-h4 text-center">
          {t('profile.welcome-user', [user.fullName])}
        </h2>
        <p className="subtitle-1 mb-0 text-center">
          {t('profile.description')}
        </p>
        <Card flat color="transparent" width="100%" max-width="600px">
          <CardActions className="d-flex justify-center my-4">
            {(user.canInvite) ? (
              <Button variant="outlined" rounded prepend-icon={icons.createAlt} text={t('profile.get-invite-link')} onClick={() => setInviteDialog(true)} />
            ) : null}
          </CardActions>
          <UserInviteDialog value={inviteDialog} onChange={setInviteDialog} />
        </Card>
      </section>
      <section className="my-3">
        <div>
          <h3 className="text-h5">
            {t('profile.account-summary')}
          </h3>
          <p>
            {t('profile.account-summary-description')}
          </p>
        </div>
        <Grid container tag="section">
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols="12" sm="12" md="12">
            <Card variant="outlined" style="border-color: lightgray;" className="mt-4 pa-2">
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader className="text-h6 pb-0">
                {t('profile.household-statistics')}
              </CardHeader>
              <CardContent className="py-0">
                {t('profile.household-statistics-description')}
              </CardContent>
              <CardContent className="d-flex flex-wrap justify-center align-center" style="gap: 0.8rem">
                {filteredStats.map((value, key) => (
                  <StatsCards key={`${key}-${value}`} min-width={$vuetify.display.xs ? '100%' : '158'} icon={getStatsIcon(key)} to={getStatsTo(key)}>
                    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                    <>
                      {getStatsTitle(key)}
                    </>
                    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                    <>
                      {value}
                    </>
                  </StatsCards>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </section>
      <Divider className="my-7" />
      <section>
        <div>
          <h3 className="text-h6">
            {t('profile.personal')}
          </h3>
          <p>
            {t('profile.personal-description')}
          </p>
        </div>
        <Grid container tag="section">
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols="12" sm="12" md="6">
            <UserProfileLinkCard link={{ text: t('profile.manage-user-profile'), to: `/user/profile/edit` }} image="/svgs/manage-profile.svg">
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {t('profile.user-settings')}
              </>
              {t('profile.user-settings-description')}
            </UserProfileLinkCard>
          </Grid>
          <AdvancedOnly>
            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
            <Grid cols="12" sm="12" md="6">
              <UserProfileLinkCard link={{ text: t('profile.manage-your-api-tokens'), to: `/user/profile/api-tokens` }} image="/svgs/manage-api-tokens.svg">
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {t('settings.token.api-tokens')}
                </>
                {t('profile.api-tokens-description')}
              </UserProfileLinkCard>
            </Grid>
          </AdvancedOnly>
        </Grid>
      </section>
      <Divider className="my-7" />
      <section>
        <div>
          <h3 className="text-h6">
            {t('household.household')}
          </h3>
          <p>
            {t('profile.household-description')}
          </p>
        </div>
        <Grid container tag="section">
          {(user.canManageHousehold) ? (
            /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
            <Grid cols="12" sm="12" md="6">
              <UserProfileLinkCard link={{ text: t('profile.household-settings'), to: `/household` }} image="/svgs/manage-group-settings.svg">
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {t('profile.household-settings')}
                </>
                {t('profile.household-settings-description')}
              </UserProfileLinkCard>
            </Grid>
          ) : null}
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols="12" sm="12" md="6">
            <UserProfileLinkCard link={{ text: t('profile.manage-cookbooks'), to: `/g/${groupSlug}/cookbooks` }} image="/svgs/manage-cookbooks.svg">
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {t('sidebar.cookbooks')}
              </>
              {t('profile.cookbooks-description')}
            </UserProfileLinkCard>
          </Grid>
          {(user.canManage) ? (
            /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
            <Grid cols="12" sm="12" md="6">
              <UserProfileLinkCard link={{ text: t('profile.manage-members'), to: `/household/members` }} image="/svgs/manage-members.svg">
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {t('profile.members')}
                </>
                {t('profile.members-description')}
              </UserProfileLinkCard>
            </Grid>
          ) : null}
          <AdvancedOnly>
            {(user.advanced) ? (
              /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
              <Grid cols="12" sm="12" md="6">
                <UserProfileLinkCard link={{ text: t('profile.manage-webhooks'), to: `/household/webhooks` }} image="/svgs/manage-webhooks.svg">
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {t('settings.webhooks.webhooks')}
                  </>
                  {t('profile.webhooks-description')}
                </UserProfileLinkCard>
              </Grid>
            ) : null}
          </AdvancedOnly>
          <AdvancedOnly>
            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
            <Grid cols="12" sm="12" md="6">
              <UserProfileLinkCard link={{ text: t('profile.manage-notifiers'), to: `/household/notifiers` }} image="/svgs/manage-notifiers.svg">
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {t('profile.notifiers')}
                </>
                {t('profile.notifiers-description')}
              </UserProfileLinkCard>
            </Grid>
          </AdvancedOnly>
        </Grid>
      </section>
      <Divider className="my-7" />
      {(user.canManage || user.canOrganize || user.advanced) ? (
        <section>
          <div>
            <h3 className="text-h6">
              {t('group.group')}
            </h3>
            <p>
              {t('profile.group-description')}
            </p>
          </div>
          <Grid container tag="section">
            {(user.canManage) ? (
              /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
              <Grid cols="12" sm="12" md="6">
                <UserProfileLinkCard link={{ text: t('profile.group-settings'), to: `/group` }} image="/svgs/manage-group-settings.svg">
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {t('profile.group-settings')}
                  </>
                  {t('profile.group-settings-description')}
                </UserProfileLinkCard>
              </Grid>
            ) : null}
            {(user.canOrganize) ? (
              /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
              <Grid cols="12" sm="12" md="6">
                <UserProfileLinkCard link={{ text: t('profile.manage-data'), to: `/group/data/foods` }} image="/svgs/manage-recipes.svg">
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {t('profile.manage-data')}
                  </>
                  {t('profile.manage-data-description')}
                </UserProfileLinkCard>
              </Grid>
            ) : null}
            <AdvancedOnly>
              {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
              <Grid cols="12" sm="12" md="6">
                <UserProfileLinkCard link={{ text: t('profile.manage-data-migrations'), to: `/group/migrations` }} image="/svgs/manage-data-migrations.svg">
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {t('profile.data-migrations')}
                  </>
                  {t('profile.data-migrations-description')}
                </UserProfileLinkCard>
              </Grid>
            </AdvancedOnly>
          </Grid>
        </section>
      ) : null}
    </Container>
  ) : null}
    </>
  );
}
