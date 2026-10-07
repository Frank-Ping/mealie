import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useUserApi } from "@/composables/api";

interface Props {
  cancel?: boolean;
  create?: boolean;
  update?: boolean;
  edit?: boolean;
  save?: boolean;
  delete?: boolean;
  download?: boolean;
  downloadUrl?: string;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  xSmall?: boolean;
  secondary?: boolean;
  minor?: boolean;
  to?: string;
  color?: string;
  text?: string;
  icon?: string;
  iconRight?: boolean;
}

export default function BaseButton({ cancel = false, create = false, update = false, edit = false, save = false, delete = false, download = false, downloadUrl = "", loading = false, disabled = false, small = false, xSmall = false, secondary = false, minor = false, to = null, color = null, text = null, icon = null, iconRight = false }: Props) {
  const { t } = useTranslation();

  const props = /* props via generated interface + destructured signature */

  const { i18n } = useTranslation();
  // icons imported directly (was $globals)

  const buttonOptions = {
    create: {
      text: i18n.t("general.create"),
      icon: icons.createAlt,
      color: "success",
    },
    update: {
      text: i18n.t("general.update"),
      icon: icons.edit,
      color: "success",
    },
    save: {
      text: i18n.t("general.save"),
      icon: icons.save,
      color: "success",
    },
    edit: {
      text: i18n.t("general.edit"),
      icon: icons.edit,
      color: "info",
    },
    delete: {
      text: i18n.t("general.delete"),
      icon: icons.delete,
      color: "error",
    },
    cancel: {
      text: i18n.t("general.cancel"),
      icon: icons.close,
      color: "grey",
    },
    download: {
      text: i18n.t("general.download"),
      icon: icons.download,
      color: "info",
    },
  };

  const btnAttrs = useMemo(() => {
    if (delete) {
      return buttonOptions.delete;
    }
    if (update) {
      return buttonOptions.update;
    }
    if (edit) {
      return buttonOptions.edit;
    }
    if (cancel) {
      return buttonOptions.cancel;
    }
    if (save) {
      return buttonOptions.save;
    }
    if (download) {
      return buttonOptions.download;
    }
    return buttonOptions.create;
  }, []); // WF4-REVIEW: dependency array

  const buttonStyles = {
    defaults: { text: false, outlined: false },
    secondary: { text: false, outlined: true },
    minor: { text: true, outlined: false },
  };

  const btnStyle = useMemo(() => {
    if (secondary) {
      return buttonStyles.secondary;
    }
    if (minor || cancel) {
      return buttonStyles.minor;
    }
    return buttonStyles.defaults;
  }, []); // WF4-REVIEW: dependency array

  const api = useUserApi();
  function downloadFile() {
    api.utils.download(downloadUrl);
  }

  return (
    <>
  <Button color={color || btnAttrs.color} size={small ? 'small' : 'default'} x-small={xSmall} loading={loading} disabled={disabled} variant={disabled ? 'tonal' : btnStyle.outlined ? 'outlined' : btnStyle.text ? 'text' : 'elevated'} component={Link} to={to} {...($attrs)} onClick={download ? downloadFile() : undefined}>
    {(!iconRight) ? (
      /* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */
      <MdiIcon />
    ) : null}
    <slot name="default">
      {text || btnAttrs.text}
    </slot>
    {(iconRight) ? (
      /* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "end" on <v-icon> */
      <MdiIcon />
    ) : null}
  </Button>
    </>
  );
}
