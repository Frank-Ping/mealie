import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";

interface Props {
  link: string;
}

export default function DocLink({ link }: Props) {
  const { t } = useTranslation();

  const props = /* props via generated interface + destructured signature */

  const href = useMemo(() => {
    // TODO: dynamically set docs link based off env
    return `https://docs.mealie.io${link}`;
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  <Button size="x-small" to={href} color="primary" target="_blank">
    {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
    <MdiIcon name={icons.folderOutline} size="small" />
    {t("about.docs")}
  </Button>
    </>
  );
}
