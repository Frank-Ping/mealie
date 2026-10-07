import { useTranslation } from "react-i18next";
import { FormControlLabel } from "@mui/material";
import type { ReadGroupPreferences } from "@/lib/api/types/user";

export default function GroupPreferencesEditor() {
  const { t } = useTranslation();

  const preferences = defineModel<ReadGroupPreferences>({ required: true });
  const local = /* WF4-REVIEW [J] */ reactive({ ...preferences });
  /* WF4-REVIEW [J] */ watch(local, (newVal) => { preferences = { ...newVal }; });
  /* WF4-REVIEW [J] */ watch(preferences, (newVal) => { if (newVal) Object.assign(local, newVal); });

  return (
    <>
  {(preferences) ? (
    <div>
      <BaseCardSectionTitle title={t('group.group-preferences')} />
      <div className="mb-6">
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "local.privateGroup" [J] */}
        <FormControlLabel {/* WF4-REVIEW: v-model local.privateGroup */} hide-details density="compact" color="primary" label={t('group.private-group')} />
        <div className="ml-8">
          <p className="text-subtitle-2 my-0 py-0">
            {t("group.private-group-description")}
          </p>
          <DocLink className="mt-2" link="/documentation/getting-started/faq/#how-do-private-groups-and-recipes-work" />
        </div>
      </div>
      <div className="mb-6">
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "local.showAnnouncements" [J] */}
        <FormControlLabel {/* WF4-REVIEW: v-model local.showAnnouncements */} hide-details density="compact" color="primary" label={t('announcements.show-announcements-from-mealie')} />
        <div className="ml-8">
          <p className="text-subtitle-2 my-0 py-0">
            {t("announcements.show-announcements-setting-description")}
          </p>
        </div>
      </div>
    </div>
  ) : null}
    </>
  );
}
