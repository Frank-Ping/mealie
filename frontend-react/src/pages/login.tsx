import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Button, Card, CardActions, CardContent, CardHeader, Container, Divider, FormControlLabel, TextField, Toolbar, Typography, form } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useDark, useSessionStorage, whenever } from "@vueuse/core";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { usePasswordField } from "@/composables/use-passwords";
import { alert } from "@/composables/use-toast";
import { useAsyncKey } from "@/composables/use-utils";
import { isSafeRedirectTarget } from "@/lib/validators/redirect";
import type { AppStartupInfo } from "@/lib/api/types/admin";
import { useUserActivityPreferences } from "@/composables/use-users/preferences";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  layout: "blank",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Login() {
  const { t } = useTranslation();

  const isDark = useDark();

  const navigate = useNavigate();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const { i18n } = useTranslation();
  const auth = useMealieAuth();
  const { $appInfo, $axios } = useNuxtApp();
  const { loggedIn } = useLoggedInState();
  const groupSlug = auth.user?.groupSlug; // was computed — plain read stays reactive
  const [isDemo, setIsDemo] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const activityPreferences = useUserActivityPreferences();
  const { getDefaultActivityRoute } = useDefaultActivity();

  // Survives the page reload that happens during OIDC redirect
  const pendingShareRedirect = useSessionStorage<string | null>("pwa_share_redirect", null);

  useSeoMeta({
    title: i18n.t("user.login"),
  });

  const form = /* WF4-REVIEW [J] */ reactive({
    email: "",
    password: "",
    // Defaults on: this is a self-hosted app people mostly reach from their own devices, and an
    // unticked box now ends the session when the browser closes.
    // Ideally this is off by default, but we've trained users for years to ignore this checkbox,
    // so turning it off would cause a headache for the majority of users.
    // Maybe we can revisit this in the future.
    remember: true,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiClient.get<AppStartupInfo>("/api/app/about/startup-info");
        if (cancelled) return;
          setIsDemo(data.data.isDemo);
          setIsFirstLogin(data.data.isFirstLogin);

          if (data.data.isFirstLogin) {
            form.email = "changeme@example.com";
            form.password = "MyPassword";
          }
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

  whenever(
    () => loggedIn && groupSlug,
    () => {
      // First-login setup always takes priority
      if (!isDemo && isFirstLogin && auth.user?.admin) {
        navigate("/admin/setup");
        return;
      }

      // After login, honour a pending PWA share redirect.
      // The redirect param can arrive via the URL query string (password login)
      // or via sessionStorage (OIDC login, where the OIDC provider reload clears
      // the query string).
      const redirectFromQuery = route.query.redirect as string | undefined;
      const redirectTarget = redirectFromQuery ?? pendingShareRedirect;
      if (isSafeRedirectTarget(redirectTarget)) {
        pendingShareRedirect = null;
        navigate(redirectTarget);
        return;
      }

      const defaultActivityRoute = getDefaultActivityRoute(
        activityPreferences.defaultActivity,
        groupSlug,
      );
      if (defaultActivityRoute) {
        navigate(defaultActivityRoute);
      }
      else {
        navigate(`/g/${groupSlug || ""}`);
      }
    },
    { immediate: true },
  );

  const [loggingIn, setLoggingIn] = useState(false);
  const [oidcLoggingIn, setOidcLoggingIn] = useState(false);

  const { passwordIcon, inputType, togglePasswordShow } = usePasswordField();

  whenever(
    () => $appInfo.enableOidc && $appInfo.oidcRedirect && !isCallback() && !isDirectLogin() /* && !auth.check().valid */,
    () => oidcAuthenticate(),
    { immediate: true },
  );

  onBeforeMount(async () => {
    if (isCallback()) {
      await oidcAuthenticate(true);
    }
  });

  function isCallback() {
    const params = new URLSearchParams(window.location.search);
    return params.has("code") || params.has("error");
  }

  function isDirectLogin() {
    const params = new URLSearchParams(window.location.search);
    return params.has("direct") && params.get("direct") === "1";
  }

  async function oidcAuthenticate(callback = false) {
    if (callback) {
      setOidcLoggingIn(true);
      try {
        await auth.oauthSignIn();
      }
      catch (error) {
        await navigate(/* WF4-REVIEW: replace+query */ "/login?direct=1");
        alertOnError(error);
      }
      setOidcLoggingIn(false);
    }
    else {
      // Save any pending PWA share redirect before leaving for the OIDC provider.
      // The OIDC callback reloads the page, which clears the query string, so we
      // persist the target in sessionStorage and restore it after login.
      const redirectTarget = route.query.redirect as string | undefined;
      if (isSafeRedirectTarget(redirectTarget)) {
        pendingShareRedirect = redirectTarget;
      }
      navigateTo("/api/auth/oauth", { external: true }); // start the redirect process
    }
  }

  async function authenticate() {
    if (form.email.length === 0 || form.password.length === 0) {
      alert.error(i18n.t("user.please-enter-your-email-and-password"));
      return;
    }

    setLoggingIn(true);
    const formData = new FormData();
    formData.append("username", form.email);
    formData.append("password", form.password);
    formData.append("remember_me", String(form.remember));

    try {
      await auth.signIn(formData);
    }
    catch (error) {
      console.log(error);
      alertOnError(error);
    }
    setLoggingIn(false);
  }

  function alertOnError(error: any) {
    // TODO Check if error is an AxiosError, but isAxiosError is not working right now
    // See https://github.com/nuxt-community/axios-module/issues/550
    // Import $axios from useContext()
    // if (apiClient.isAxiosError(error) && error.response?.status === 401) {
    if (error.response?.status === 401) {
      alert.error(i18n.t("user.invalid-credentials"));
    }
    else if (error.response?.status === 423) {
      alert.error(i18n.t("user.account-locked-please-try-again-later"));
    }
    else {
      alert.error(i18n.t("events.something-went-wrong"));
    }
  }

  return (
    <>
  <Container fluid className="d-flex justify-center align-center flex-column fill-height" className={{
      'bg-off-white': !$vuetify.theme.current.dark && !isDark,
    }}>
    {(isFirstLogin) ? (
      <Alert className="my-4" type="info" icon={icons.information} style={{ flex: 'none' }}>
        <div>
          <p className="mb-3">
            {t('user.it-looks-like-this-is-your-first-time-logging-in')}
          </p>
          <p className="mb-1">
            <strong>
              {t('user.username')}
              :
            </strong>
            changeme@example.com
            <AppButtonCopy copy-text="changeme@example.com" color="info" btn-class="h-auto" />
          </p>
          <p className="mb-3">
            <strong>
              {t('user.password')}
              :
            </strong>
            MyPassword
            <AppButtonCopy copy-text="MyPassword" color="info" btn-class="h-auto" />
          </p>
          <p>
            {t('user.dont-want-to-see-this-anymore-be-sure-to-change-your-email')}
          </p>
        </div>
      </Alert>
    ) : null}
    <Card tag="section" className="d-flex flex-column align-center w-100" max-width="600">
      {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-toolbar> */}
      <Toolbar color="primary" className="d-flex justify-center mb-4">
        <Typography variant="h6" className="text-h4 text-center">
          Mealie
        </Typography>
      </Toolbar>
      <AppLogo size={100} />
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader className="text-h5 justify-center pb-3">
        {t('user.sign-in')}
      </CardHeader>
      <CardContent className="w-100">
        {/* WF4-REVIEW: validation semantics [J] */}
        <form onSubmit={(e) => { e.preventDefault(); authenticate; }}>
          {($appInfo.allowPasswordLogin) ? (
            /* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "form.email" [J] */
            <TextField id="username" prepend-inner-icon={icons.email} variant="solo-filled" flat width="100%" autofocus autocomplete="username" name="username" label={t('user.email-or-username')} type="text" />
          ) : null}
          {($appInfo.allowPasswordLogin) ? (
            /* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "form.password" [J] */
            <TextField id="password" prepend-inner-icon={icons.lock} append-inner-icon={passwordIcon} variant="solo-filled" flat autocomplete="current-password" name="password" label={t('user.password')} type={inputType} onClickAppendInner={togglePasswordShow} />
          ) : null}
          {($appInfo.allowPasswordLogin) ? (
            /* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "form.remember" [J] */
            <FormControlLabel className="ml-2 mt-n2" label={t('user.remember-me')} />
          ) : null}
          {($appInfo.allowPasswordLogin) ? (
            <CardActions className="justify-center pt-0">
              <div className="max-button">
                <Button loading={loggingIn} disabled={oidcLoggingIn} variant="elevated" color="primary" type="submit" size="large" rounded className="rounded-xl" block>
                  {t("user.login")}
                </Button>
              </div>
            </CardActions>
          ) : null}
          {($appInfo.enableOidc && $appInfo.allowPasswordLogin) ? (
            <div className="d-flex my-4 justify-center align-center" width="80%">
              <Divider className="div-width" />
              <span className="absolute px-2" className={{
                'bg-white': !$vuetify.theme.current.dark && !isDark,
                'bg-grey-darken-4': $vuetify.theme.current.dark || isDark,
              }}>
                {t("user.or")}
              </span>
            </div>
          ) : null}
          {($appInfo.enableOidc) ? (
            <CardActions className="justify-center">
              <div className="max-button">
                <Button loading={oidcLoggingIn} color="primary" size="large" variant="elevated" rounded className="rounded-xl" block onClick={() => oidcAuthenticate()}>
                  {t("user.login-oidc")}
                  {$appInfo.oidcProviderName}
                </Button>
              </div>
            </CardActions>
          ) : null}
        </form>
      </CardContent>
      <CardActions className="d-flex justify-center flex-column flex-sm-row">
        {($appInfo.allowSignup && $appInfo.allowPasswordLogin) ? (
          <Button variant="text" to="/register">
            {t("user.register")}
          </Button>
        ) : (
          <Button variant="text" disabled>
            {t("user.invite-only")}
          </Button>
        )}
        {($appInfo.allowPasswordLogin) ? (
          <Button className="mr-auto" variant="text" to="/forgot-password">
            {t("user.reset-password")}
          </Button>
        ) : null}
      </CardActions>
      <CardContent className="d-flex justify-center flex-column flex-sm-row">
        {[
            {
              text: t('about.sponsor'),
              icon: icons.heart,
              href: 'https://github.com/sponsors/hay-kot',
            },
            {
              text: t('about.github'),
              icon: icons.github,
              href: 'https://github.com/mealie-recipes/mealie',
            },
            {
              text: t('about.docs'),
              icon: icons.folderOutline,
              href: 'https://docs.mealie.io/',
            },
          ].map(link => (
          <div key={link.text} className="text-center">
            <Button variant="text" to={link.href} target="_blank">
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={link.icon} />
              {link.text}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  </Container>
    </>
  );
}
