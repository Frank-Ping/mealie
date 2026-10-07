import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardActions, CardContent, CardHeader, Container, Divider, FormControlLabel, List, ListItem, ListItemText, TextField, Toolbar, Typography, form } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useDark } from "@vueuse/core";
import { States, RegistrationType, useRegistration } from "./states";
import { useUserRegistrationForm } from "@/composables/use-users/user-registration-form";
import { useRouteQuery } from "@/composables/use-router";
import { validators, useAsyncValidator } from "@/composables/use-validators";
import { useUserApi } from "@/composables/api";
import { alert } from "@/composables/use-toast";
import type { CreateUserRegistration } from "@/lib/api/types/user";
import { usePublicApi } from "@/composables/api/api-client";
import { useLocales } from "@/composables/use-locales";
import UserRegistrationForm from "@/components/Domain/User/UserRegistrationForm";
import type { VForm } from "@/types/auto-forms";

export const handle = {
  layout: "blank",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function RegisterPage() {
  const { t } = useTranslation();

  const inputAttrs = {
    variant: "filled",
    validateOnBlur: true,
  };

  const { i18n } = useTranslation();
  const isDark = useDark();

  // Registration Context
  const state = useRegistration();

  // Handle Token URL / Initialization
  const token = useRouteQuery("token");
  function initialUser() {
    return false;
  }
  /* WF4-REVIEW [J] */ onMounted(() => {
    if (token) {
      state.setState(States.ProvideAccountDetails);
      state.setType(RegistrationType.JoinGroup);
    }
    if (initialUser()) {
      state.setState(States.ProvideGroupDetails);
      state.setType(RegistrationType.InitialGroup);
    }
  });

  // Initial
  const initial = {
    createGroup: () => {
      state.setState(States.ProvideGroupDetails);
      state.setType(RegistrationType.CreateGroup);
      if (token != null) {
        token = null;
      }
    },
    joinGroup: () => {
      state.setState(States.ProvideToken);
      state.setType(RegistrationType.JoinGroup);
    },
  };

  // Provide Token
  const [domTokenForm, setDomTokenForm] = useState(null);
  function validateToken() {
    return Boolean(token && token.trim());
  }
  const isTokenValid = useMemo(() => validateToken(), []); // WF4-REVIEW: dependency array
  const provideToken = {
    next: async () => {
      if (!await safeValidate(domTokenForm as Ref<VForm>)) {
        return;
      }
      if (validateToken()) {
        state.setState(States.ProvideAccountDetails);
      }
    },
  };

  // Provide Group Details
  const publicApi = usePublicApi();
  const [domGroupForm, setDomGroupForm] = useState(null);
  const [isGroupFormValid, setIsGroupFormValid] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSeed, setGroupSeed] = useState(false);
  const [groupPrivate, setGroupPrivate] = useState(false);
  const [groupErrorMessages, setGroupErrorMessages] = useState([]);
  const { validate: validGroupName, valid: groupNameValid } = useAsyncValidator(
    groupName,
    (v: string) => publicApi.validators.group(v),
    i18n.t("validation.group-name-is-taken"),
    groupErrorMessages,
  );
  async function validateGroup() {
    if (!groupName || !groupName.trim()) {
      setGroupErrorMessages([i18n.t("validation.required")]);
      return false;
    }
    setGroupErrorMessages([]);
    await validGroupName();

    if (!groupNameValid) {
      return false;
    }

    return true;
  }
  const groupDetails = {
    groupName,
    groupSeed,
    groupPrivate,
    next: async () => {
      if (!await validateGroup()) {
        return;
      }
      state.setState(States.ProvideAccountDetails);
    },
  };

  const [isAccountFormValid, setIsAccountFormValid] = useState(false);
  const {
    accountDetails,
    credentials,
    safeValidate,
  } = useUserRegistrationForm();
  async function accountDetailsNext() {
    if (!await accountDetails.validate()) {
      return;
    }
    state.setState(States.Confirmation);
  }

  // Locale
  const { locale } = useLocales();
  const [langDialog, setLangDialog] = useState(false);

  // Confirmation
  const confirmationData = useMemo(() => {
    return [
      {
        display: state.ctx.type === RegistrationType.CreateGroup,
        text: i18n.t("group.group"),
        value: groupName,
      },
      {
        display: state.ctx.type === RegistrationType.CreateGroup,
        text: i18n.t("data-pages.seed-data"),
        value: groupSeed ? i18n.t("general.yes") : i18n.t("general.no"),
      },
      {
        display: state.ctx.type === RegistrationType.CreateGroup,
        text: i18n.t("group.settings.keep-my-recipes-private"),
        value: groupPrivate ? i18n.t("general.yes") : i18n.t("general.no"),
      },
      {
        display: true,
        text: i18n.t("user.email"),
        value: accountDetails.email,
      },
      {
        display: true,
        text: i18n.t("user.full-name"),
        value: accountDetails.fullName,
      },
      {
        display: true,
        text: i18n.t("user.username"),
        value: accountDetails.username,
      },
      {
        display: true,
        text: i18n.t("user.enable-advanced-content"),
        value: accountDetails.advancedOptions ? i18n.t("general.yes") : i18n.t("general.no"),
      },
    ];
  }, []); // WF4-REVIEW: dependency array

  const api = useUserApi();
  const navigate = useNavigate();
  async function submitRegistration() {
    const payload: CreateUserRegistration = {
      email: accountDetails.email,
      username: accountDetails.username,
      fullName: accountDetails.fullName,
      password: credentials.password1,
      passwordConfirm: credentials.password2,
      locale: locale,
      advanced: accountDetails.advancedOptions,
    };
    if (state.ctx.type === RegistrationType.CreateGroup) {
      payload.group = groupName;
      payload.private = groupPrivate;
      payload.seedData = groupSeed;
    }
    else {
      payload.groupToken = token;
    }
    const { response, error } = await api.register.register(payload);
    if (response?.status === 201) {
      accountDetails.reset();
      credentials.reset();
      alert.success(i18n.t("user-registration.registration-success"));
      navigate("/login");
    }
    // The Axios interceptor already shows detail.message errors.
    else if (!error?.response?.data?.detail?.message) {
      alert.error(i18n.t("events.something-went-wrong"));
    }
  }

  return (
    <>
  <Container fill-height fluid className="d-flex justify-center align-center flex-column fill-height" className={{
      'bg-off-white': !$vuetify.theme.current.dark && !isDark,
    }}>
    <Card className="d-flex flex-column w-100" max-width="1200px" min-height="700px">
      <div>
        {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-toolbar> */}
        <Toolbar width="100%" color="primary" style="margin-bottom: 4rem">
          <Typography variant="h6" className="text-h4 text-center">
            Mealie
          </Typography>
        </Toolbar>
        <AppLogo />
      </div>
      <div className="d-flex justify-center grow items-center my-4">
        {(state.ctx.state === States.Initial) ? (
          <>
            <Container>
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader className="text-h5 my-4 mb-5 pb-0 text-center">
                {t("user-registration.user-registration")}
              </CardHeader>
              <div className="d-flex flex-wrap justify-center flex-md-nowrap pa-4" style="gap: 1em">
                {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-card> */}
                <Card color="primary" hover width="320px" onClick={initial.joinGroup}>
                  {/* WF4-REVIEW: title text moves to the title prop */}
                  <CardHeader className="d-flex align-center justify-center py-3">
                    {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                    <MdiIcon name={icons.group} size="large" />
                    {t("user-registration.join-a-group")}
                  </CardHeader>
                </Card>
                {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-card> */}
                <Card color="primary" hover width="320px" onClick={initial.createGroup}>
                  {/* WF4-REVIEW: title text moves to the title prop */}
                  <CardHeader className="d-flex align-center justify-center py-3">
                    {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                    <MdiIcon name={icons.user} size="large" />
                    {t("user-registration.create-a-new-group")}
                  </CardHeader>
                </Card>
              </div>
            </Container>
          </>
        ) : (state.ctx.state === States.ProvideToken) ? (
          <>
            <div>
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={icons.group} size="large" className="mr-3" />
                <span>
                  {t("user-registration.join-a-group")}
                </span>
              </CardHeader>
              <Divider />
              <CardContent>
                {t("user-registration.provide-registration-token-description")}
                {/* WF4-REVIEW: validation semantics [J] */}
                <form ref="domTokenForm" className="mt-4" onSubmit={(e) => { e.preventDefault(); ; }}>
                  {/* WF4-REVIEW: rules/error-messages → error+helperText */}
                  <TextField value={token} onChange={/* WF4-REVIEW: setter */ setToken} {...(inputAttrs)} label={t('group.group-token')} rules={[validators.required]} />
                </form>
              </CardContent>
              <Divider />
              <CardActions className="mt-auto justify-space-between">
                <BaseButton cancel onClick={state.back}>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {icons.back}
                  </>
                  {t("general.back")}
                </BaseButton>
                <BaseButton icon-right disabled={!isTokenValid} onClick={provideToken.next}>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {icons.forward}
                  </>
                  {t("general.next")}
                </BaseButton>
              </CardActions>
            </div>
          </>
        ) : (state.ctx.state === States.ProvideGroupDetails) ? (
          <>
            <div className="preferred-width">
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={icons.group} size="large" className="mr-3" />
                <span>
                  {t("user-registration.group-details")}
                </span>
              </CardHeader>
              <CardContent>
                {t("user-registration.group-details-description")}
              </CardContent>
              <Divider />
              <CardContent>
                {/* WF4-REVIEW: validation semantics [J] */}
                <form ref="domGroupForm" value={isGroupFormValid} onChange={setIsGroupFormValid} onSubmit={(e) => { e.preventDefault(); ; }}>
                  {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "groupDetails.groupName" [J] */}
                  <TextField {...(inputAttrs)} label={t('group.group-name')} rules={[validators.required]} error-messages={groupErrorMessages} onBlur={validGroupName} />
                  <div className="mt-n4 px-2">
                    {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "groupDetails.groupPrivate" [J] */}
                    <FormControlLabel hide-details label={t('group.settings.keep-my-recipes-private')} />
                    <p className="text-caption mt-1">
                      {t("group.settings.keep-my-recipes-private-description")}
                    </p>
                    {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "groupDetails.groupSeed" [J] */}
                    <FormControlLabel hide-details label={t('data-pages.seed-data')} />
                    <p className="text-caption mt-1">
                      {t("user-registration.use-seed-data-description")}
                    </p>
                  </div>
                </form>
              </CardContent>
              <Divider />
              <CardActions className="justify-space-between">
                <BaseButton cancel onClick={state.back}>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {icons.back}
                  </>
                  {t("general.back")}
                </BaseButton>
                <BaseButton icon-right disabled={!isGroupFormValid || !groupNameValid} onClick={groupDetails.next}>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {icons.forward}
                  </>
                  {t("general.next")}
                </BaseButton>
              </CardActions>
            </div>
          </>
        ) : (state.ctx.state === States.ProvideAccountDetails) ? (
          <>
            <div>
              <UserRegistrationForm value={isAccountFormValid} onChange={setIsAccountFormValid} />
              <Divider />
              <CardActions className="justify-space-between">
                <BaseButton cancel onClick={state.back}>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {icons.back}
                  </>
                  {t("general.back")}
                </BaseButton>
                <BaseButton icon-right disabled={!isAccountFormValid} onClick={accountDetailsNext}>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {icons.forward}
                  </>
                  {t("general.next")}
                </BaseButton>
              </CardActions>
            </div>
          </>
        ) : (state.ctx.state === States.Confirmation) ? (
          <>
            <div className="preferred-width">
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader className="mb-0 pb-0">
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={icons.user} size="large" className="mr-3" />
                <span>
                  {t("general.confirm")}
                </span>
              </CardHeader>
              <List>
                {confirmationData.map((item, idx) => (
                  <>
                    {(item.display) ? (
                      /* WF4-REVIEW: @click → ListItemButton */
                      <ListItem key={idx}>
                        {/* WF4-REVIEW: content → primary prop */}
                        <ListItemText>
                          {item.text}
                        </ListItemText>
                        {/* WF4-REVIEW: content → secondary prop */}
                        <ListItemText>
                          {item}
                        </ListItemText>
                      </ListItem>
                    ) : null}
                    {(idx !== confirmationData.length - 1) ? (
                      <Divider key={`divider-${idx}`} />
                    ) : null}
                  </>
                ))}
              </List>
              <Divider />
              <CardActions className="justify-space-between">
                <BaseButton cancel onClick={state.back}>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {icons.back}
                  </>
                  {t("general.back")}
                </BaseButton>
                <BaseButton onClick={submitRegistration}>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {icons.check}
                  </>
                  {t("general.submit")}
                </BaseButton>
              </CardActions>
            </div>
          </>
        ) : null}
      </div>
      <CardActions className="justify-center flex-column py-8">
        <Button variant="text" className="mb-2" to="/login">
          {t("user.login")}
        </Button>
        <BaseButton size="large" color="primary" icon={icons.translate} onClick={() => setLangDialog(true)}>
          {t("language-dialog.choose-language")}
        </BaseButton>
      </CardActions>
    </Card>
    <LanguageDialog value={langDialog} onChange={setLangDialog} />
  </Container>
    </>
  );
}
