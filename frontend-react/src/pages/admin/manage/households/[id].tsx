import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Card, CardContent, Container, TextField, form } from "@mui/material";
import HouseholdPreferencesEditor from "@/components/Domain/Household/HouseholdPreferencesEditor";
import { useGroups } from "@/composables/use-groups";
import { useAdminApi } from "@/composables/api";
import { alert } from "@/composables/use-toast";
import { validators } from "@/composables/use-validators";
import type { VForm } from "vuetify/components";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Id() {
  const { t } = useTranslation();

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const i18n = useI18n();

  const { groups } = useGroups();
  const householdId = route.params.id as string; // was computed — plain read stays reactive

  // ==============================================
  // New User Form

  const [refHouseholdEditForm, setRefHouseholdEditForm] = useState(null);

  const adminApi = useAdminApi();

  const [userError, setUserError] = useState(false);

  const { data: household } = useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (!householdId) {
            return null;
          }
          const { data, error } = await adminApi.households.getOne(householdId);
          if (cancelled) return;

          if (error?.response?.status === 404) {
            alert.error(i18n.t("user.user-not-found"));
            setUserError(true);
          }
          return data;
        }, { watch: [householdId]
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

  async function handleSubmit() {
    if (!refHouseholdEditForm?.validate() || household === null) {
      return;
    }

    const { response, data } = await adminApi.households.updateOne(household.id, household);
    if (response?.status === 200 && data) {
      household = data;
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
      <BasePageTitle>
        <template>
          {/* WF4-REVIEW: cover → objectFit */}
          <Box component="img" width="100%" max-height="125" max-width="125" src="/svgs/manage-group-settings.svg" />
        </template>
        <template>
          {t('household.admin-household-management')}
        </template>
      </BasePageTitle>
      <AppToolbar back />
      <CardContent>
        {t('household.household-id-value', [household.id])}
      </CardContent>
      {(!userError) ? (
        /* WF4-REVIEW: validation semantics [J] */
        <form ref="refHouseholdEditForm" onSubmit={(e) => { e.preventDefault(); handleSubmit; }}>
          <Card variant="outlined" style="border-color: lightgrey;">
            <CardContent>
              {(groups) ? (
                /* WF4-REVIEW: items/item-title/item-value → MenuItem children; v-model on complex expression "household.groupId" [J] */
                <TextField select {/* WF4-REVIEW: v-model household.groupId */} disabled items={groups} variant="solo-filled" flat item-title="name" item-value="id" return-object={false} label={t('group.user-group')} rules={[validators.required]} />
              ) : null}
              {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "household.name" [J] */}
              <TextField {/* WF4-REVIEW: v-model household.name */} variant="solo-filled" flat label={t('household.household-name')} rules={[validators.required]} />
              {(household.preferences) ? (
                /* WF4-REVIEW: v-model on complex expression "household.preferences" [J] */
                <HouseholdPreferencesEditor {/* WF4-REVIEW: v-model household.preferences */} variant="solo-filled" flat />
              ) : null}
            </CardContent>
          </Card>
          <div className="d-flex pa-2">
            <BaseButton type="submit" edit className="ml-auto">
              {t("general.update")}
            </BaseButton>
          </div>
        </form>
      ) : null}
    </Container>
  ) : null}
    </>
  );
}
