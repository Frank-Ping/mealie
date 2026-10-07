import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { fieldTypes } from "../forms";
import { validators } from "../use-validators";
import type { AutoFormItems } from "@/types/auto-forms";

export const useCommonSettingsForm = () => {
  const { i18n } = useTranslation();

  const commonSettingsForm = useMemo(() => [
    {
      section: i18n.t("profile.group-settings"),
      label: i18n.t("group.enable-public-access"),
      hint: i18n.t("group.enable-public-access-description"),
      varName: "makeGroupRecipesPublic",
      type: fieldTypes.BOOLEAN,
      rules: [validators.required],
    },
    {
      section: i18n.t("data-pages.data-management"),
      label: i18n.t("user-registration.use-seed-data"),
      hint: i18n.t("user-registration.use-seed-data-description"),
      varName: "useSeedData",
      type: fieldTypes.BOOLEAN,
      rules: [validators.required],
    },
  ], []); // WF4-REVIEW: dependency array

  return {
    commonSettingsForm,
  };
};
