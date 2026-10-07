import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardActions, CardContent, CardHeader, Container, TextField, form } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useUserApi } from "@/composables/api";
import { alert } from "@/composables/use-toast";
import { validators } from "@/composables/use-validators";
import type { VForm } from "@/types/auto-forms";

export const handle = {
  layout: "basic",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function ForgotPassword() {
  const { t } = useTranslation();

  const [form, setForm] = useState(null);

  const state = /* WF4-REVIEW [J] */ reactive({
    email: "",
    loading: false,
    error: false,
  });

  const i18n = useI18n();

  // Set page title
  useSeoMeta({
    title: i18n.t("user.login"),
  });

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
    const { response } = await api.email.sendForgotPassword({ email: state.email });

    state.loading = false;

    if (response?.status === 200) {
      state.error = false;
      alert.success(i18n.t("profile.email-sent"));
      await navigateTo("/login");
    }
    else {
      state.error = true;
      alert.error(i18n.t("profile.error-sending-email"));
    }
  }

  return (
    <>
  <Container fill-height fluid className="d-flex justify-center align-center">
    <Card color="background d-flex flex-column align-center" flat width="600px">
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader className="headline justify-center">
        {t('user.forgot-password')}
      </CardHeader>
      <BaseDivider />
      <CardContent>
        {/* WF4-REVIEW: validation semantics [J] */}
        <form ref="form" onSubmit={(e) => { e.preventDefault(); requestLink(); }}>
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "state.email" [J] */}
          <TextField {/* WF4-REVIEW: v-model state.email */} prepend-inner-icon={$globals.icons.email} variant="solo-filled" flat autofocus name="login" label={t('user.email')} type="text" rules={[validators.email]} />
          <p className="text-center">
            {t('user.forgot-password-text')}
          </p>
          <CardActions className="justify-center">
            <div className="max-button">
              <Button loading={state.loading} color="primary" type="submit" size="large" rounded className="rounded-xl" block>
                {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                <MdiIcon name={$globals.icons.email} />
                {t("user.reset-password")}
              </Button>
            </div>
          </CardActions>
        </form>
      </CardContent>
      <Button className="mx-auto" variant="text" nuxt to="/login">
        {t("user.login")}
      </Button>
    </Card>
  </Container>
    </>
  );
}
