import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, CardActions, CardContent, Container, Divider, FormControlLabel, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useUserApi } from "@/composables/api";
import { useAsyncKey } from "@/composables/use-utils";
import type { GroupEventNotifierCreate, GroupEventNotifierOut } from "@/lib/api/types/household";

export const handle = {
  middleware: ["auth", "advanced-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

interface OptionKey {
  text: string;
  key: keyof GroupEventNotifierOut["options"];
}

interface OptionSection {
  id: number;
  text: string;
  options: OptionKey[];
}

export default function Notifiers() {
  const { t } = useTranslation();

  const api = useUserApi();
  const { i18n } = useTranslation();

  useSeoMeta({
    title: i18n.t("profile.notifiers"),
  });

  const state = /* WF4-REVIEW [J] */ reactive({
    deleteDialog: false,
    createDialog: false,
    deleteTargetId: "",
  });

  const { data: notifiers } = useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await api.groupEventNotifier.getAll();
        if (cancelled) return;
          return data?.items;
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

  async function refreshNotifiers() {
    const { data } = await api.groupEventNotifier.getAll();
    notifiers = data?.items;
  }

  const createNotifierData: GroupEventNotifierCreate = /* WF4-REVIEW [J] */ reactive({
    name: "",
    enabled: true,
    appriseUrl: "",
  });

  async function createNewNotifier() {
    await api.groupEventNotifier.createOne(createNotifierData);
    refreshNotifiers();
  }

  function openDelete(notifier: GroupEventNotifierOut) {
    state.deleteDialog = true;
    state.deleteTargetId = notifier.id;
  }

  async function deleteNotifier(targetId: string) {
    await api.groupEventNotifier.deleteOne(targetId);
    refreshNotifiers();
    state.deleteTargetId = "";
  }

  async function saveNotifier(notifier: GroupEventNotifierOut) {
    await api.groupEventNotifier.updateOne(notifier.id, notifier);
    refreshNotifiers();
  }

  async function testNotifier(notifier: GroupEventNotifierOut) {
    await api.groupEventNotifier.test(notifier.id);
  }

  // ===============================================================
  // Options Definitions

  const optionsSections: OptionSection[] = [
    {
      id: 1,
      text: i18n.t("events.recipe-events"),
      options: [
        {
          text: i18n.t("general.create") as string,
          key: "recipeCreated",
        },
        {
          text: i18n.t("general.update") as string,
          key: "recipeUpdated",
        },
        {
          text: i18n.t("general.delete") as string,
          key: "recipeDeleted",
        },
      ],
    },
    {
      id: 2,
      text: i18n.t("events.user-events"),
      options: [
        {
          text: i18n.t("events.when-a-new-user-joins-your-group"),
          key: "userSignup",
        },
      ],
    },
    {
      id: 3,
      text: i18n.t("events.mealplan-events"),
      options: [
        {
          text: i18n.t("general.create") as string,
          key: "mealplanEntryCreated",
        },
        {
          text: i18n.t("general.update") as string,
          key: "mealplanEntryUpdated",
        },
        {
          text: i18n.t("general.delete") as string,
          key: "mealplanEntryDeleted",
        },
      ],
    },
    {
      id: 4,
      text: i18n.t("events.shopping-list-events"),
      options: [
        {
          text: i18n.t("general.create") as string,
          key: "shoppingListCreated",
        },
        {
          text: i18n.t("general.update") as string,
          key: "shoppingListUpdated",
        },
        {
          text: i18n.t("general.delete") as string,
          key: "shoppingListDeleted",
        },
      ],
    },
    {
      id: 5,
      text: i18n.t("events.cookbook-events"),
      options: [
        {
          text: i18n.t("general.create") as string,
          key: "cookbookCreated",
        },
        {
          text: i18n.t("general.update") as string,
          key: "cookbookUpdated",
        },
        {
          text: i18n.t("general.delete") as string,
          key: "cookbookDeleted",
        },
      ],
    },
    {
      id: 6,
      text: i18n.t("events.tag-events"),
      options: [
        {
          text: i18n.t("general.create") as string,
          key: "tagCreated",
        },
        {
          text: i18n.t("general.update") as string,
          key: "tagUpdated",
        },
        {
          text: i18n.t("general.delete") as string,
          key: "tagDeleted",
        },
      ],
    },
    {
      id: 7,
      text: i18n.t("events.category-events"),
      options: [
        {
          text: i18n.t("general.create") as string,
          key: "categoryCreated",
        },
        {
          text: i18n.t("general.update") as string,
          key: "categoryUpdated",
        },
        {
          text: i18n.t("general.delete") as string,
          key: "categoryDeleted",
        },
      ],
    },
    {
      id: 8,
      text: i18n.t("events.label-events"),
      options: [
        {
          text: i18n.t("general.create") as string,
          key: "labelCreated",
        },
        {
          text: i18n.t("general.update") as string,
          key: "labelUpdated",
        },
        {
          text: i18n.t("general.delete") as string,
          key: "labelDeleted",
        },
      ],
    },
  ];

  return (
    <>
  <Container className="narrow-container">
    {/* WF4-REVIEW: v-model on complex expression "state.deleteDialog" [J] */}
    <BaseDialog bottom-sheet color="error" title={t('general.confirm')} icon={icons.alertCircle} can-confirm onConfirm={deleteNotifier(state.deleteTargetId)}>
      <CardContent>
        {t("general.confirm-delete-generic")}
      </CardContent>
    </BaseDialog>
    {/* WF4-REVIEW: v-model on complex expression "state.createDialog" [J] */}
    <BaseDialog title={t('events.new-notification')} icon={icons.bellPlus} can-submit onSubmit={createNewNotifier}>
      <CardContent>
        {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "createNotifierData.name" [J] */}
        <TextField label={t('general.name')} />
        {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "createNotifierData.appriseUrl" [J] */}
        <TextField label={t('events.apprise-url')} />
      </CardContent>
    </BaseDialog>
    <BasePageTitle divider>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="100%" max-height="125" max-width="125" src="/svgs/manage-notifiers.svg" />
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t("events.event-notifiers")}
      </>
      {t("events.new-notification-form-description")}
      <div className="mt-3 d-flex flex-wrap justify-space-between mx-n2">
        <a href="https://github.com/caronc/apprise/wiki" target="_blanks" className="mx-2 text-primary">
          Apprise
        </a>
        <a href="https://github.com/caronc/apprise/wiki/Notify_gotify" target="_blanks" className="mx-2 text-primary">
          Gotify
        </a>
        <a href="https://github.com/caronc/apprise/wiki/Notify_discord" target="_blanks" className="mx-2 text-primary">
          Discord
        </a>
        <a href="https://github.com/caronc/apprise/wiki/Notify_homeassistant" target="_blanks" className="mx-2 text-primary">
          Home Assistant
        </a>
        <a href="https://github.com/caronc/apprise/wiki/Notify_matrix" target="_blanks" className="mx-2 text-primary">
          Matrix
        </a>
        <a href="https://github.com/caronc/apprise/wiki/Notify_pushover" target="_blanks" className="mx-2 text-primary">
          Pushover
        </a>
      </div>
    </BasePageTitle>
    <BaseButton create onClick={state.createDialog = true} />
    {(notifiers) ? (
      /* WF4-REVIEW: wrapper — accordion group semantics */
      <Box className="mt-2">
        {notifiers.map((notifier, index) => (
          <Accordion key={index} className="my-2 left-border rounded">
            <AccordionSummary disable-icon-rotate className="text-h6">
              <div className="d-flex align-center">
                {notifier.name}
              </div>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                <Button icon flat className="ml-2">
                  {/* WF4-REVIEW: icon name resolves via lib/icons */}
                  <MdiIcon name={icons.edit} />
                </Button>
              </>
            </AccordionSummary>
            <AccordionDetails>
              {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "notifiers[index].name" [J] */}
              <TextField label={t('general.name')} />
              {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "notifiers[index].appriseUrl" [J] */}
              <TextField label={t('events.apprise-url-skipped-if-blank')} hint={t('events.apprise-url-is-left-intentionally-blank')} />
              {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "notifiers[index].enabled" [J] */}
              <FormControlLabel label={t('events.enable-notifier')} density="compact" />
              <Divider />
              <p className="pt-4">
                {t("events.what-events")}
              </p>
              <div className="notifier-options">
                {optionsSections.map(sec => (
                  <section key={sec.id}>
                    <h4>
                      {sec.text}
                    </h4>
                    {sec.options.map(opt => (
                      /* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "notifiers[index].options[opt.key]" [J] */
                      <FormControlLabel key={opt.key} hide-details density="compact" label={opt.text} />
                    ))}
                  </section>
                ))}
              </div>
              <CardActions className="py-0">
                <Box sx={{ flexGrow: 1 }} />
                <BaseButtonGroup buttons={[
                {
                  icon: icons.delete,
                  text: t('general.delete'),
                  event: 'delete',
                },
                {
                  icon: icons.testTube,
                  text: t('general.test'),
                  event: 'test',
                },
                {
                  icon: icons.save,
                  text: t('general.save'),
                  event: 'save',
                },
              ]} onDelete={openDelete(notifier)} onSave={saveNotifier(notifier)} onTest={testNotifier(notifier)} />
              </CardActions>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    ) : null}
  </Container>
    </>
  );
}
