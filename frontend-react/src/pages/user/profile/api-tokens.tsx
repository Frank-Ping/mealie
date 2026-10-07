import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Card, CardActions, CardContent, CardHeader, Container, Divider, List, ListItem, ListItemText, TextField, form } from "@mui/material";
import { useUserApi } from "@/composables/api";
import type { VForm } from "@/types/auto-forms";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  middleware: ["auth", "advanced-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function ApiTokens() {
  const { t } = useTranslation();

  const { i18n } = useTranslation();
  const auth = useMealieAuth();

  useSeoMeta({
    title: i18n.t("settings.token.api-tokens"),
  });

  const user = useMemo(() => {
    return auth.user;
  }, []); // WF4-REVIEW: dependency array

  const api = useUserApi();

  const [domNewTokenForm, setDomNewTokenForm] = useState(null);

  const [createdToken, setCreatedToken] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  function resetCreate() {
    setCreatedToken("");
    setLoading(false);
    setName("");
    auth.getSession();
  }

  async function createToken(name: string) {
    if (loading) {
      resetCreate();
      return;
    }

    setLoading(true);

    if (!domNewTokenForm?.validate()) {
      return;
    }

    const { data } = await api.users.createAPIToken({ name });

    if (data) {
      setCreatedToken(data.token);
    }
  }

  async function deleteToken(id: number) {
    const { data } = await api.users.deleteAPIToken(id);
    auth.getSession();
    return data;
  }

  return (
    <>
  <Container className="narrow-container">
    <BasePageTitle divider>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="100%" max-height="200px" max-width="200px" src="/svgs/manage-api-tokens.svg" />
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t("settings.token.api-tokens")}
      </>
      {t('settings.token.you-have-token-count', user.tokens!.length)}
    </BasePageTitle>
    <section className="d-flex justify-center">
      <Card className="mt-4 pa-4" width="100%" flat>
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="px-0">
          {t("settings.token.create-an-api-token")}
        </CardHeader>
        <CardContent className="px-0">
          {/* WF4-REVIEW: validation semantics [J] */}
          <form ref="domNewTokenForm" onSubmit={(e) => { e.preventDefault(); ; }}>
            {/* WF4-REVIEW: rules/error-messages → error+helperText */}
            <TextField value={name} onChange={setName} label={t('settings.token.token-name')} />
          </form>
          {(createdToken != '') ? (
            <>
              <TextField multiline value={createdToken} onChange={setCreatedToken} className="mb-0 pb-0" label={t('settings.token.api-token')} readonly rows="3" />
              <p>
                {t(
                  "settings.token.copy-this-token-for-use-with-an-external-application-this-token-will-not-be-viewable-again",
                )}
              </p>
            </>
          ) : null}
        </CardContent>
        <CardActions className="px-0">
          {(createdToken) ? (
            <BaseButton cancel onClick={resetCreate()}>
              {t('general.close')}
            </BaseButton>
          ) : null}
          <Box sx={{ flexGrow: 1 }} />
          {(createdToken) ? (
            <AppButtonCopy icon={false} color="info" copy-text={createdToken} />
          ) : (
            <BaseButton key="generate-button" disabled={name == ''} onClick={createToken(name)}>
              {t('settings.token.generate')}
            </BaseButton>
          )}
        </CardActions>
      </Card>
    </section>
    <BaseCardSectionTitle className="mt-10" title={t('settings.token.active-tokens')} />
    <section className="d-flex flex-column">
      <List>
        {user.tokens.map((token, index) => (
          <div key={index}>
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem>
              {/* WF4-REVIEW: content → primary prop */}
              <ListItemText>
                {token.name}
              </ListItemText>
              {/* WF4-REVIEW: content → secondary prop */}
              <ListItemText>
                {t('general.created-on-date', [$d(new Date(token.createdAt!))])}
              </ListItemText>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                <BaseButton delete small onClick={deleteToken(token.id)} />
              </>
            </ListItem>
            <Divider className="mx-2 my-2" />
          </div>
        ))}
      </List>
    </section>
  </Container>
    </>
  );
}
