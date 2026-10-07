import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardActions, CardContent, CardHeader, Container, TextField, form } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useUserApi } from "@/composables/api";
import { alert } from "@/composables/use-toast";
import { validators } from "@/composables/use-validators";
import { useRouteQuery } from "@/composables/use-router";
import type { VForm } from "@/types/auto-forms";

export const handle = {
  layout: "basic",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function ResetPassword() {
  const { t } = useTranslation();

  const state = /* WF4-REVIEW [J] */ reactive({
    email: "",
    password: "",
    passwordConfirm: "",
    loading: false,
    error: false,
  });

  const [form, setForm] = useState(null);

  const { i18n } = useTranslation();
  const passwordMatch = () => state.password === state.passwordConfirm || i18n.t("user.password-must-match");

  // Set page title
  useSeoMeta({
    title: i18n.t("user.login"),
  });

  // ===================
  // Token Getter
  const token = useRouteQuery("token", "");

  // ===================
  // API
  const api = useUserApi();
  async function requestLink() {
    if (!form) {
      return;
    };

    const { valid } = await form.validate();
    if (!valid) {
      return;
    };

    state.loading = true;
    // TODO: Fix Response to send meaningful error
    const { response } = await api.users.resetPassword({
      token: token,
      email: state.email,
      password: state.password,
      passwordConfirm: state.passwordConfirm,
    });

    state.loading = false;

    if (response?.status === 200) {
      state.error = false;
      alert.success(i18n.t("user.password-updated"));
      await navigateTo("/login");
    }
    else {
      state.error = true;
      alert.error(i18n.t("events.something-went-wrong"));
    }
  }

  return (
    <>
  <Container fill-height fluid className="d-flex justify-center align-center">
    <Card color="background d-flex flex-column align-center" flat width="600px">
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader className="text-h5 justify-center">
        {t("user.reset-password")}
      </CardHeader>
      <BaseDivider />
      <CardContent>
        {/* WF4-REVIEW: validation semantics [J] */}
        <form ref="form" onSubmit={(e) => { e.preventDefault(); requestLink(); }}>
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "state.email" [J] */}
          <TextField prepend-inner-icon={icons.email} variant="solo-filled" flat autofocus name="login" label={t('user.email')} type="text" />
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "state.password" [J] */}
          <TextField variant="solo-filled" flat prepend-inner-icon={icons.lock} name="password" label={t('user.password')} type="password" rules={[validators.required]} />
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "state.passwordConfirm" [J] */}
          <TextField variant="solo-filled" flat validate-on="blur" prepend-inner-icon={icons.lock} name="password" label={t('user.confirm-password')} type="password" rules={[validators.required, passwordMatch]} />
          <p className="text-center">
            {t("user.please-enter-password")}
          </p>
          <CardActions className="justify-center">
            <div className="max-button">
              <Button loading={state.loading} color="primary" disabled={token === ''} type="submit" size="large" rounded className="rounded-xl" block>
                {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                <MdiIcon name={icons.lock} />
                {token === "" ? "Token Required" : t("user.reset-password")}
              </Button>
            </div>
          </CardActions>
        </form>
      </CardContent>
      <Button className="mx-auto" variant="text" to="/login">
        {t("user.login")}
      </Button>
    </Card>
  </Container>
    </>
  );
}
