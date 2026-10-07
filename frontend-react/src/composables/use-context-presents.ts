import { icons } from "@/lib/icons";

export interface ContextMenuItem {
  title: string;
  icon: string;
  event: string;
  color?: string;
}

export interface ContextMenuPresets {
  delete: ContextMenuItem;
  edit: ContextMenuItem;
  save: ContextMenuItem;
}

export function useContextPresets(): ContextMenuPresets {
  const i18n = useI18n();
  // icons imported directly (was $globals)

  return {
    delete: {
      title: i18n.t("general.delete"),
      icon: icons.delete,
      event: "delete",
    },
    edit: {
      title: i18n.t("general.edit"),
      icon: icons.edit,
      event: "edit",
    },
    save: {
      title: i18n.t("general.save"),
      icon: icons.save,
      event: "save",
    },
  };
}
