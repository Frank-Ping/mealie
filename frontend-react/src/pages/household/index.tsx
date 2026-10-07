import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Card, CardContent, Container, form } from "@mui/material";
import HouseholdPreferencesEditor from "@/components/Domain/Household/HouseholdPreferencesEditor";
import { useHouseholdSelf } from "@/composables/use-households";
import { alert } from "@/composables/use-toast";
import type { VForm } from "@/types/auto-forms";

export const handle = {
  middleware: ["auth", "can-manage-household-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function HouseholdPage() {
  const { t } = useTranslation();

  const { household, actions: householdActions } = useHouseholdSelf();
  const { i18n } = useTranslation();

  useSeoMeta({
    title: i18n.t("household.household"),
  });

  // useHouseholdSelf() caches data in a module-level singleton for the lifetime of the tab,
  // so revisiting this page via client-side navigation can otherwise show stale
  // preferences if they were changed elsewhere (e.g. Admin Households panel) in the
  // same session. Force a revalidation whenever this page is entered.
  /* WF4-REVIEW [J] */ onMounted(() => {
    householdActions.refresh();
  });

  const [refHouseholdEditForm, setRefHouseholdEditForm] = useState(null);

  async function handleSubmit() {
    if (!refHouseholdEditForm?.validate() || !household?.preferences) {
      console.log(refHouseholdEditForm?.validate());
      return;
    }

    const data = await householdActions.updatePreferences();
    if (data) {
      alert.success(i18n.t("settings.settings-updated"));
    }
    else {
      alert.error(i18n.t("settings.settings-update-failed"));
    }
  }

  return (
    <>
  {(household) ? (
    <Container className="narrow-container">
      <BasePageTitle className="mb-5">
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {/* WF4-REVIEW: cover → objectFit */}
          <Box component="img" width="100%" max-height="100" max-width="100" src="/svgs/manage-group-settings.svg" />
        </>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {t("profile.household-settings")}
        </>
        {t("profile.household-description")}
      </BasePageTitle>
      {/* WF4-REVIEW: validation semantics [J] */}
      <form ref="refHouseholdEditForm" onSubmit={(e) => { e.preventDefault(); handleSubmit; }}>
        <Card variant="outlined" style="border-color: lightgray;">
          <CardContent>
            {(household.preferences) ? (
              /* WF4-REVIEW: v-model on complex expression "household.preferences" [J] */
              <HouseholdPreferencesEditor />
            ) : null}
          </CardContent>
        </Card>
        <div className="d-flex pa-2">
          <BaseButton type="submit" edit className="ml-auto">
            {t("general.update")}
          </BaseButton>
        </div>
      </form>
    </Container>
  ) : null}
    </>
  );
}
