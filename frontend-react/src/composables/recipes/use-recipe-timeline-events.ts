import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { icons } from "@/lib/icons";
import type { TimelineEventType } from "@/lib/api/types/recipe";

export interface TimelineEventTypeData {
  value: TimelineEventType;
  label: string;
  icon: string;
}

export const useTimelineEventTypes = () => {
  const { i18n } = useTranslation();
  // icons imported directly (was $globals)
  const eventTypeOptions = useMemo(() => {
    return [
      {
        value: "comment",
        label: i18n.t("recipe.comment"),
        icon: icons.commentTextMultiple,
      },
      {
        value: "info",
        label: i18n.t("settings.theme.info"),
        icon: icons.informationVariant,
      },
      {
        value: "system",
        label: i18n.t("general.system"),
        icon: icons.cog,
      },
    ];
  }, []); // WF4-REVIEW: dependency array

  return {
    eventTypeOptions,
  };
};
