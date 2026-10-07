import { useTranslation } from "react-i18next";
import { FormControlLabel, TextField } from "@mui/material";
import type { ReadHouseholdPreferences } from "@/lib/api/types/household";

type Preference = {
  key: keyof ReadHouseholdPreferences;

export default function HouseholdPreferencesEditor() {
  const { t } = useTranslation();

  const preferences = defineModel<ReadHouseholdPreferences>({ required: true });
  const local = /* WF4-REVIEW [J] */ reactive({ ...preferences });
  /* WF4-REVIEW [J] */ watch(local, (newVal) => { preferences = { ...newVal }; });
  /* WF4-REVIEW [J] */ watch(preferences, (newVal) => { if (newVal) Object.assign(local, newVal); });

  const i18n = useI18n();


    label: string;
    description: string;
  };

  const recipePreferences: Preference[] = [
    {
      key: "recipePublic",
      label: i18n.t("group.allow-users-outside-of-your-group-to-see-your-recipes"),
      description: i18n.t("group.allow-users-outside-of-your-group-to-see-your-recipes-description"),
    },
    {
      key: "recipeShowNutrition",
      label: i18n.t("group.show-nutrition-information"),
      description: i18n.t("group.show-nutrition-information-description"),
    },
    {
      key: "recipeShowAssets",
      label: i18n.t("group.show-recipe-assets"),
      description: i18n.t("group.show-recipe-assets-description"),
    },
    {
      key: "recipeLandscapeView",
      label: i18n.t("group.default-to-landscape-view"),
      description: i18n.t("group.default-to-landscape-view-description"),
    },
    {
      key: "recipeDisableComments",
      label: i18n.t("group.disable-users-from-commenting-on-recipes"),
      description: i18n.t("group.disable-users-from-commenting-on-recipes-description"),
    },
  ];

  const allDays = [
    {
      name: i18n.t("general.sunday"),
      value: 0,
    },
    {
      name: i18n.t("general.monday"),
      value: 1,
    },
    {
      name: i18n.t("general.tuesday"),
      value: 2,
    },
    {
      name: i18n.t("general.wednesday"),
      value: 3,
    },
    {
      name: i18n.t("general.thursday"),
      value: 4,
    },
    {
      name: i18n.t("general.friday"),
      value: 5,
    },
    {
      name: i18n.t("general.saturday"),
      value: 6,
    },
  ];

  return (
    <>
  {(preferences) ? (
    <div>
      <BaseCardSectionTitle title={t('household.household-preferences')} />
      <div className="mb-6">
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "local.privateHousehold" [J] */}
        <FormControlLabel {/* WF4-REVIEW: v-model local.privateHousehold */} hide-details density="compact" label={t('household.private-household')} color="primary" />
        <div className="ml-8">
          <p className="text-subtitle-2 my-0 py-0">
            {t("household.private-household-description")}
          </p>
          <DocLink className="mt-2" link="/documentation/getting-started/faq/#how-do-private-groups-and-recipes-work" />
        </div>
      </div>
      <div className="mb-6">
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "local.lockRecipeEditsFromOtherHouseholds" [J] */}
        <FormControlLabel {/* WF4-REVIEW: v-model local.lockRecipeEditsFromOtherHouseholds */} hide-details density="compact" label={t('household.lock-recipe-edits-from-other-households')} color="primary" />
        <div className="ml-8">
          <p className="text-subtitle-2 my-0 py-0">
            {t("household.lock-recipe-edits-from-other-households-description")}
          </p>
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
      {/* WF4-REVIEW: items/item-title/item-value → MenuItem children; v-model on complex expression "local.firstDayOfWeek" [J] */}
      <TextField select {/* WF4-REVIEW: v-model local.firstDayOfWeek */} prepend-icon={$globals.icons.calendarWeekBegin} items={allDays} item-title="name" item-value="value" label={t('settings.first-day-of-week')} variant="underlined" flat />
      <BaseCardSectionTitle className="mt-5" title={t('household.household-recipe-preferences')}>
        {t("household.default-recipe-preferences-description")}
      </BaseCardSectionTitle>
      <div className="preference-container">
        {recipePreferences.map(p => (
          <div key={p.key}>
            {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "local[p.key]" [J] */}
            <FormControlLabel {/* WF4-REVIEW: v-model local[p.key] */} hide-details density="compact" label={p.label} color="primary" />
            <p className="ml-8 text-subtitle-2 my-0 py-0">
              {p.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  ) : null}
    </>
  );
}
