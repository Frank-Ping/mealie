import { useTranslation } from "react-i18next";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, CardContent, Container } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useGroupWebhooks, timeUTC } from "@/composables/use-group-webhooks";
import GroupWebhookEditor from "@/components/Domain/Household/GroupWebhookEditor";
import { alert } from "@/composables/use-toast";

export const handle = {
  middleware: ["auth", "advanced-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Webhooks() {
  const { t } = useTranslation();

  const { i18n } = useTranslation();
  const { actions, webhooks } = useGroupWebhooks();

  useSeoMeta({
    title: i18n.t("settings.webhooks.webhooks"),
  });

  return (
    <>
  <Container className="narrow-container">
    <BasePageTitle divider>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="100%" max-height="125" max-width="125" src="/svgs/manage-webhooks.svg" />
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t('settings.webhooks.webhooks')}
      </>
      <CardContent className="pb-0">
        {t('settings.webhooks.description')}
      </CardContent>
    </BasePageTitle>
    <BaseButton create onClick={actions.createOne()} />
    {/* WF4-REVIEW: wrapper — accordion group semantics */}
    <Box className="mt-2">
      {webhooks.map((webhook, index) => (
        <Accordion key={index} className="my-2 left-border rounded">
          <AccordionSummary disable-icon-rotate className="headline">
            <div className="d-flex align-center">
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={icons.webhook} size="large" color={webhook.enabled ? 'info' : undefined} />
              {webhook.name}
              -
              {$d(timeUTC(webhook.scheduledTime), "time")}
            </div>
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              <Button size="small" icon flat className="ml-2">
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={icons.edit} />
              </Button>
            </>
          </AccordionSummary>
          <AccordionDetails>
            <GroupWebhookEditor key={webhook.id} webhook={webhook} onSave={actions.updateOne($event)} onDelete={actions.deleteOne($event)} onTest={actions.testOne($event).then(() => alert.success(t('events.test-message-sent')))} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  </Container>
    </>
  );
}
