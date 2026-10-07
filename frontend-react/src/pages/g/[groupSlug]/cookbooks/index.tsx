import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, CardActions, CardContent, Container, FormControlLabel } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { VueDraggable } from "vue-draggable-plus";
import { useCookbookStore } from "@/composables/store/use-cookbook-store";
import { useHouseholdSelf } from "@/composables/use-households";
import CookbookEditor from "@/components/Domain/Cookbook/CookbookEditor";
import type { CreateCookBook, ReadCookBook } from "@/lib/api/types/cookbook";
import { useCookbookPreferences } from "@/composables/use-users/preferences";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  middleware: ["auth", "group-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function CookbooksPage() {
  const { t } = useTranslation();

  const dialogStates = /* WF4-REVIEW [J] */ reactive({
    create: false,
    delete: false,
  });

  const { i18n } = useTranslation();

  // Set page title
  useSeoMeta({
    title: i18n.t("cookbook.cookbooks"),
  });

  const auth = useMealieAuth();
  const { store: allCookbooks, actions, updateAll } = useCookbookStore();

  // Make a local reactive copy of myCookbooks
  const [myCookbooks, setMyCookbooks] = useState([]);
  /* WF4-REVIEW [J] */ watch(
    allCookbooks,
    (cookbooks) => {
      setMyCookbooks(cookbooks?.filter(
          cookbook => cookbook.householdId === auth.user?.householdId,
        ).sort((a, b) => a.position > b.position) ?? []);
    },
    { immediate: true },
  );

  const { household } = useHouseholdSelf();
  const cookbookPreferences = useCookbookPreferences();

  // create
  const [createTargetKey, setCreateTargetKey] = useState(0);
  const [createTarget, setCreateTarget] = useState(null);
  async function createCookbook() {
    const name = i18n.t("cookbook.household-cookbook-name", [
      household?.name || "",
      String((myCookbooks?.length ?? 0) + 1),
    ]) as string;

    const data = { name } as CreateCookBook;
    await actions.createOne(data).then((cookbook) => {
      if (!cookbook) {
        return;
      }

      myCookbooks.push(cookbook);
      setCreateTarget(cookbook as ReadCookBook);
      createTargetKey++;
    });
    dialogStates.create = true;
  }

  // delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  function deleteEventHandler(item: ReadCookBook) {
    setDeleteTarget(item);
    dialogStates.delete = true;
  }
  async function deleteCookbook() {
    if (!deleteTarget) {
      return;
    }
    await actions.deleteOne(deleteTarget.id);
    setMyCookbooks(myCookbooks.filter(c => c.id !== deleteTarget?.id));
    dialogStates.delete = false;
    setDeleteTarget(null);
  }

  async function deleteCreateTarget() {
    if (!createTarget?.id) {
      return;
    }
    await actions.deleteOne(createTarget.id);
    setMyCookbooks(myCookbooks.filter(c => c.id !== createTarget?.id));
    dialogStates.create = false;
    setCreateTarget(null);
  }
  function handleUnmount() {
    if (!createTarget?.id || createTarget.queryFilterString) {
      return;
    }
    deleteCreateTarget();
  }
  /* WF4-REVIEW [J] */ onMounted(() => {
    window.addEventListener("beforeunload", handleUnmount);
  });
  onBeforeUnmount(() => {
    handleUnmount();
    window.removeEventListener("beforeunload", handleUnmount);
  });

  return (
    <>
  <div>
    {(createTarget) ? (
      /* WF4-REVIEW: v-model on complex expression "dialogStates.create" [J] */
      <BaseDialog width="100%" max-width="1100px" icon={icons.pages} title={t('cookbook.create-a-cookbook')} submit-icon={icons.save} submit-text={t('general.save')} submit-disabled={!createTarget.queryFilterString} can-submit onSubmit={actions.updateOne(createTarget)} onCancel={deleteCreateTarget()}>
        <CardContent>
          <CookbookEditor key={createTargetKey} value={createTarget} onChange={setCreateTarget} />
        </CardContent>
      </BaseDialog>
    ) : null}
    {/* WF4-REVIEW: v-model on complex expression "dialogStates.delete" [J] */}
    <BaseDialog bottom-sheet title={t('general.delete-with-name', { name: t('cookbook.cookbook') })} icon={icons.alertCircle} color="error" can-confirm onConfirm={deleteCookbook()}>
      <CardContent>
        <p>
          {t("general.confirm-delete-generic-with-name", { name: t("cookbook.cookbook") })}
        </p>
        {(deleteTarget) ? (
          <p className="mt-4 ml-4">
            {deleteTarget.name}
          </p>
        ) : null}
      </CardContent>
    </BaseDialog>
    <Container className="lg-container">
      <BasePageTitle divider>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {/* WF4-REVIEW: cover → objectFit */}
          <Box component="img" width="100%" max-height="100" max-width="100" src="/svgs/manage-cookbooks.svg" />
        </>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {t("cookbook.cookbooks")}
        </>
        {t("cookbook.description")}
      </BasePageTitle>
      <div className="my-6">
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "cookbookPreferences.hideOtherHouseholds" [J] */}
        <FormControlLabel label={t('cookbook.hide-cookbooks-from-other-households')} hide-details color="primary" />
        <div className="ml-10 mt-n3">
          <p className="text-subtitle-2 my-0 py-0">
            {t("cookbook.hide-cookbooks-from-other-households-description")}
          </p>
        </div>
      </div>
      <BaseButton create onClick={createCookbook} />
      {/* WF4-REVIEW: wrapper — accordion group semantics */}
      <Box className="mt-2">
        <VueDraggable value={myCookbooks} onChange={setMyCookbooks} handle=".handle" delay={250} delay-on-touch-only={true} style="width: 100%" onEnd={updateAll(myCookbooks)}>
          {myCookbooks.map((cookbook, index) => (
            <Accordion key={cookbook.id} className="my-2 left-border rounded">
              <AccordionSummary disable-icon-rotate className="text-h6 opacity-80">
                <div className="d-flex align-center">
                  {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                  <MdiIcon name={icons.pages} size="large" />
                  {cookbook.name}
                </div>
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  <div className="d-flex align-center">
                    <Button icon variant="text" className="ml-2">
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={icons.edit} />
                    </Button>
                    {/* WF4-REVIEW: icon name resolves via lib/icons */}
                    <MdiIcon name={icons.arrowUpDown} className="handle" size={40} />
                  </div>
                </>
              </AccordionSummary>
              <AccordionDetails>
                {/* WF4-REVIEW: v-model on complex expression "myCookbooks[index]" [J] */}
                <CookbookEditor collapsable={false} />
                <CardActions>
                  <Box sx={{ flexGrow: 1 }} />
                  <BaseButtonGroup buttons={[
                    {
                      icon: icons.delete,
                      text: t('general.delete'),
                      event: 'delete',
                    },
                    {
                      icon: icons.save,
                      text: t('general.save'),
                      event: 'save',
                      disabled: !cookbook.queryFilterString,
                    },
                  ]} onDelete={deleteEventHandler(myCookbooks[index])} onSave={actions.updateOne(myCookbooks[index])} />
                </CardActions>
              </AccordionDetails>
            </Accordion>
          ))}
        </VueDraggable>
      </Box>
    </Container>
  </div>
    </>
  );
}
