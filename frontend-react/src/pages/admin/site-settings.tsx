import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Card, CardContent, Container, Divider, ListItem, ListItemText, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useAdminApi, useUserApi } from "@/composables/api";
import { validators } from "@/composables/use-validators";
import { useAsyncKey } from "@/composables/use-utils";
import StatsCards from "@/components/global/StatsCards";
import type { AppStatistics, CheckAppConfig } from "@/lib/api/types/admin";
import AppLoader from "@/components/global/AppLoader";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

interface SimpleCheck {
  id: string;
  text: string;
  status: boolean | undefined;
  successText: string;
  errorText: string;
  color: string;
  icon: string;
}

interface AuthProvider {
  id: string;
  // Shown as-is rather than translated, since these are acronyms
  name: string;
  // The environment variable that turns the provider on
  envVar: string;
  ready: boolean;
  disabled: boolean;
}

export default function SiteSettings() {
  const { t } = useTranslation();

  interface CheckApp extends CheckAppConfig {
    isSiteSecure?: boolean;
  }



  // For some reason the layout is not set automatically, so we set it here,
  // even though it's defined above in the page meta.
  /* WF4-REVIEW [J] */ onMounted(() => {
    setPageLayout("admin");
  });

  // icons imported directly (was $globals)
  const { i18n } = useTranslation();

  const state = /* WF4-REVIEW [J] */ reactive({
    loading: false,
    address: "",
    success: false,
    error: "",
    tested: false,
  });

  // Set page title
  useSeoMeta({
    title: i18n.t("settings.site-settings"),
  });

  const [appConfig, setAppConfig] = useState({
    emailReady: true,
    baseUrlSet: true,
    isSiteSecure: true,
    isUpToDate: false,
    ldapReady: false,
    ldapDisabled: false,
    oidcReady: false,
    oidcDisabled: false,
  });
  const [adminStats, setAdminStats] = useState({
    totalRecipes: 0,
    totalUsers: 0,
    totalHouseholds: 0,
    totalGroups: 0,
    uncategorizedRecipes: 0,
    untaggedRecipes: 0,
  });
  function isLocalHostOrHttps() {
    return window.location.hostname === "localhost" || window.location.protocol === "https:";
  }
  const api = useUserApi();
  const adminApi = useAdminApi();

  const adminStatsText: { [key: string]: string } = {
    totalRecipes: i18n.t("general.recipes"),
    totalUsers: i18n.t("user.users"),
    totalHouseholds: i18n.t("household.households"),
    totalGroups: i18n.t("group.groups"),
    uncategorizedRecipes: i18n.t("settings.uncategorized-recipes"),
    untaggedRecipes: i18n.t("settings.untagged-recipes"),
  };

  function getAdminStatsTitle(key: string) {
    return adminStatsText[key] ?? key;
  }

  const adminStatsIcon: { [key: string]: string } = {
    totalRecipes: icons.primary,
    totalUsers: icons.user,
    totalHouseholds: icons.household,
    totalGroups: icons.group,
    uncategorizedRecipes: icons.categories,
    untaggedRecipes: icons.tags,
  };

  function getAdminStatsIcon(key: string) {
    return adminStatsIcon[key] ?? icons.primary;
  }

  const adminStatsTo = useMemo(() => {
    return {
      totalUsers: "/admin/manage/users",
      totalHouseholds: "/admin/manage/households",
      totalGroups: "/admin/manage/groups",
    };
  }, []); // WF4-REVIEW: dependency array

  function getAdminStatsTo(key: string) {
    return adminStatsTo.value[key] ?? undefined;
  }

  /* WF4-REVIEW [J] */ onMounted(async () => {
    const { data } = await adminApi.about.checkApp();
    if (data) {
      setAppConfig({ ...data, isSiteSecure: false });
    }
    appConfig.isSiteSecure = isLocalHostOrHttps();
    const { data: adminData } = await adminApi.about.statistics();
    if (adminData) {
      setAdminStats(adminData);
    }
  });
  const goodIcon = icons.checkboxMarkedCircle;
  const badIcon = icons.alert;
  const warningIcon = icons.alertCircle;
  const disabledIcon = icons.minusCircle;
  const goodColor = "success";
  const badColor = "error";
  const warningColor = "warning";
  const disabledColor = "grey";

  // Auth providers (LDAP, OIDC) have three states rather than two: turned off
  // entirely, enabled and fully configured, or enabled but missing configuration.
  // When a provider is disabled its incomplete configuration isn't a problem, so
  // it's reported neutrally instead of as a warning.


  function authCheckText({ name, ready, disabled }: AuthProvider): string {
    if (disabled) {
      return i18n.t("settings.auth-provider-disabled", { provider: name });
    }
    return ready
      ? i18n.t("settings.auth-provider-ready", { provider: name })
      : i18n.t("settings.auth-provider-not-ready", { provider: name });
  }

  function authCheckColor({ ready, disabled }: AuthProvider): string {
    if (disabled) {
      return disabledColor;
    }
    return ready ? goodColor : warningColor;
  }

  function authCheckIcon({ ready, disabled }: AuthProvider): string {
    if (disabled) {
      return disabledIcon;
    }
    return ready ? goodIcon : warningIcon;
  }

  function authProviderCheck(provider: AuthProvider): SimpleCheck {
    return {
      id: provider.id,
      text: authCheckText(provider),
      status: provider.ready,
      errorText: provider.disabled
        ? i18n.t("settings.auth-provider-disabled-text", { envVar: provider.envVar })
        : i18n.t("settings.auth-provider-error-text", { provider: provider.name }),
      successText: i18n.t("settings.auth-provider-success-text", { provider: provider.name }),
      color: authCheckColor(provider),
      icon: authCheckIcon(provider),
    };
  }

  const simpleChecks = useMemo(() => {
    const data: SimpleCheck[] = [
      {
        id: "application-version",
        text: i18n.t("settings.application-version"),
        status: appConfig.isUpToDate,
        errorText: i18n.t("settings.application-version-error-text", [rawAppInfo.version, rawAppInfo.versionLatest]),
        successText: i18n.t("settings.mealie-is-up-to-date"),
        color: appConfig.isUpToDate ? goodColor : warningColor,
        icon: appConfig.isUpToDate ? goodIcon : warningIcon,
      },
      {
        id: "secure-site",
        text: i18n.t("settings.secure-site"),
        status: appConfig.isSiteSecure,
        errorText: i18n.t("settings.secure-site-error-text"),
        successText: i18n.t("settings.secure-site-success-text"),
        color: appConfig.isSiteSecure ? goodColor : badColor,
        icon: appConfig.isSiteSecure ? goodIcon : badIcon,
      },
      {
        id: "server-side-base-url",
        text: i18n.t("settings.server-side-base-url"),
        status: appConfig.baseUrlSet,
        errorText: i18n.t("settings.server-side-base-url-error-text"),
        successText: i18n.t("settings.server-side-base-url-success-text"),
        color: appConfig.baseUrlSet ? goodColor : badColor,
        icon: appConfig.baseUrlSet ? goodIcon : badIcon,
      },
      authProviderCheck({
        id: "ldap-ready",
        name: "LDAP",
        envVar: "LDAP_AUTH_ENABLED",
        ready: appConfig.ldapReady,
        disabled: appConfig.ldapDisabled,
      }),
      authProviderCheck({
        id: "oidc-ready",
        name: "OIDC",
        envVar: "OIDC_AUTH_ENABLED",
        ready: appConfig.oidcReady,
        disabled: appConfig.oidcDisabled,
      }),
    ];
    return data;
  }, []); // WF4-REVIEW: dependency array
  async function testEmail() {
    state.loading = true;
    state.tested = false;
    const { data } = await api.email.test({ email: state.address });
    if (data) {
      if (data.success) {
        state.success = true;
      }
      else {
        state.error = data.error ?? "";
        state.success = false;
      }
    }
    state.loading = false;
    state.tested = true;
  }
  const validEmail = useMemo(() => {
    if (state.address === "") {
      return false;
    }
    const valid = validators.email(state.address);
    // Explicit bool check because validators.email sometimes returns a string
    if (valid === true) {
      return true;
    }
    return false;
  }, []); // WF4-REVIEW: dependency array
  // ============================================================
  // General About Info
  const [rawAppInfo, setRawAppInfo] = useState({
    version: "null",
    versionLatest: "null",
  });
  function getAppInfo() {
    const { data: statistics } = useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await adminApi.about.about();
        if (cancelled) return;
            if (data) {
              rawAppInfo.version = data.version;
              rawAppInfo.versionLatest = data.versionLatest;
              const prettyInfo = [
                {
                  slot: "version",
                  name: i18n.t("about.version"),
                  icon: icons.information,
                  value: data.version,
                },
                {
                  slot: "build",
                  name: i18n.t("settings.build"),
                  icon: icons.information,
                  value: data.buildId,
                },
                {
                  name: i18n.t("about.application-mode"),
                  icon: icons.devTo,
                  value: data.production ? i18n.t("about.production") : i18n.t("about.development"),
                },
                {
                  name: i18n.t("about.demo-status"),
                  icon: icons.testTube,
                  value: data.demoStatus ? i18n.t("about.demo") : i18n.t("about.not-demo"),
                },
                {
                  name: i18n.t("about.api-port"),
                  icon: icons.api,
                  value: data.apiPort,
                },
                {
                  name: i18n.t("about.api-docs"),
                  icon: icons.file,
                  value: data.apiDocs ? i18n.t("general.enabled") : i18n.t("general.disabled"),
                },
                {
                  name: i18n.t("about.database-type"),
                  icon: icons.database,
                  value: data.dbType,
                },
                {
                  name: i18n.t("about.database-url"),
                  icon: icons.database,
                  value: data.dbUrl,
                },
                {
                  name: i18n.t("about.default-group"),
                  icon: icons.group,
                  value: data.defaultGroup,
                },
                {
                  name: i18n.t("about.default-household"),
                  icon: icons.household,
                  value: data.defaultHousehold,
                },
                {
                  slot: "recipe-scraper",
                  name: i18n.t("settings.recipe-scraper-version"),
                  icon: icons.primary,
                  value: data.recipeScraperVersion,
                },
              ];
              return prettyInfo;
            }
            return data;
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow
    return statistics;
  }
  const appInfo = getAppInfo();
  const [bugReportDialog, setBugReportDialog] = useState(false);
  const bugReportText = useMemo(() => {
    const ignore = {
      [i18n.t("about.database-url")]: true,
      [i18n.t("about.default-group")]: true,
    };
    let text = "**Details**\n";
    appInfo?.forEach((item) => {
      if (ignore[item.name as string]) {
        return;
      }
      text += `${item.name as string}: ${item as string}\n`;
    });
    const ignoreChecks: {
      [key: string]: boolean;
    } = {
      "application-version": true,
    };
    text += "\n**Checks**\n";
    simpleChecks.forEach((item) => {
      if (ignoreChecks[item.id]) {
        return;
      }
      const status = item.status ? i18n.t("general.yes") : i18n.t("general.no");
      text += `${item.text.toString()}: ${status}\n`;
    });
    text += `${i18n.t("settings.email-configured")}: ${appConfig.emailReady ? i18n.t("general.yes") : i18n.t("general.no")}\n`;
    return text;
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  <Container fluid className="narrow-container">
    <BasePageTitle divider>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="100%" max-height="200" max-width="150" src="/svgs/admin-site-settings.svg" />
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t("settings.site-settings")}
      </>
    </BasePageTitle>
    <BaseDialog value={bugReportDialog} onChange={setBugReportDialog} bottom-sheet title={t('settings.bug-report')} width={800} icon={icons.github}>
      <CardContent>
        <div className="pb-4">
          {t('settings.bug-report-information')}
        </div>
        <TextField multiline value={bugReportText} onChange={/* WF4-REVIEW: setter */ setBugReportText} variant="outlined" rows="18" readonly />
        <div className="d-flex justify-end" style="gap: 5px">
          <BaseButton color="gray" secondary target="_blank" href="https://github.com/mealie-recipes/mealie/issues/new/choose">
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              {icons.github}
            </>
            {t('settings.tracker')}
          </BaseButton>
          <AppButtonCopy copy-text={bugReportText} color="info" icon={false} />
        </div>
      </CardContent>
    </BaseDialog>
    <div className="d-flex justify-end">
      <BaseButton color="info" onClick={() => setBugReportDialog(true;)}>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {icons.github}
        </>
        {t('settings.bug-report')}
      </BaseButton>
    </div>
    <section>
      <BaseCardSectionTitle className="pb-0" icon={icons.cog} title={t('settings.configuration')} />
      <Card className="mb-4">
        {simpleChecks.map((check, idx) => (
          <>
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem title={check.text}>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={check.icon} color={check.color} className="opacity-100" />
              </>
              {/* WF4-REVIEW: content → secondary prop */}
              <ListItemText className="wrap-word">
                {check.status ? check.successText : check.errorText}
              </ListItemText>
            </ListItem>
            <Divider />
          </>
        ))}
      </Card>
    </section>
    <section>
      <BaseCardSectionTitle className="pt-2" icon={icons.email} title={t('user.email')} />
      <Alert border="start" border-color={appConfig.emailReady ? 'success' : 'error'} variant="text" elevation="2">
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={appConfig.emailReady ? icons.checkboxMarkedCircle : icons.alertCircle} color={appConfig.emailReady ? 'success' : 'warning'} />
        </>
        <div className="font-weight-medium">
          {t('settings.email-configuration-status')}
        </div>
        <div>
          {appConfig.emailReady ? t('settings.ready') : t('settings.not-ready')}
        </div>
        <div>
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "state.address" [J] */}
          <TextField className="mr-4" label={t('user.email')} rules={[validators.email]} />
          <BaseButton color="info" variant="elevated" disabled={!appConfig.emailReady || !validEmail} loading={state.loading} className="opacity-100" onClick={testEmail}>
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              {icons.email}
            </>
            {t("general.test")}
          </BaseButton>
          {(state.tested) ? (
            <>
              <Divider className="my-x mt-6" />
              <CardContent className="px-0">
                <h4>
                  {t("settings.email-test-results")}
                </h4>
                <span className="pl-4">
                  {state.success ? t('settings.succeeded') : t('settings.failed')}
                </span>
              </CardContent>
            </>
          ) : null}
        </div>
      </Alert>
    </section>
    <section>
      <BaseCardSectionTitle className="pt-2" icon={icons.chart} title={t('settings.site-statistics')} />
      <div className="d-flex flex-wrap justify-center align-center" style="gap: 0.8rem">
        {adminStats.map((value, key) => (
          <StatsCards key={`${key}-${value}`} min-width={$vuetify.display.xs ? '100%' : '158'} icon={getAdminStatsIcon(key)} to={getAdminStatsTo(key)}>
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              {getAdminStatsTitle(key)}
            </>
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              {value}
            </>
          </StatsCards>
        ))}
      </div>
    </section>
    <section className="mt-4">
      <BaseCardSectionTitle className="pb-0" icon={icons.cog} title={t('settings.general-about')} />
      <Card className="mb-4">
        {(appInfo && appInfo.length) ? (
          <>
            {appInfo.map((property, idx) => (
              <>
                {/* WF4-REVIEW: @click → ListItemButton */}
                <ListItem title={property.name} prepend-icon={property.icon || icons.user}>
                  {(property.slot === 'recipe-scraper') ? (
                    <>
                      {/* WF4-REVIEW: content → secondary prop */}
                      <ListItemText>
                        <a className="text-primary" target="_blank" to={`https://github.com/hhursev/recipe-scrapers/releases/tag/${property}`}>
                          {property}
                        </a>
                      </ListItemText>
                    </>
                  ) : (property.slot === 'build') ? (
                    <>
                      {/* WF4-REVIEW: content → secondary prop */}
                      <ListItemText>
                        <a className="text-primary" target="_blank" to={`https://github.com/mealie-recipes/mealie/commit/${property}`}>
                          {property}
                        </a>
                      </ListItemText>
                    </>
                  ) : (property.slot === 'version' && property !== 'develop' && property !== 'nightly') ? (
                    <>
                      {/* WF4-REVIEW: content → secondary prop */}
                      <ListItemText>
                        <a className="text-primary" target="_blank" to={`https://github.com/mealie-recipes/mealie/releases/tag/${property}`}>
                          {property}
                        </a>
                      </ListItemText>
                    </>
                  ) : (
                    <>
                      {/* WF4-REVIEW: content → secondary prop */}
                      <ListItemText>
                        {property}
                      </ListItemText>
                    </>
                  )}
                </ListItem>
                {(appInfo && idx !== appInfo.length - 1) ? (
                  <Divider key={`divider-${property.name}`} />
                ) : null}
              </>
            ))}
          </>
        ) : (
          <>
            <AppLoader />
          </>
        )}
      </Card>
    </section>
  </Container>
    </>
  );
}
