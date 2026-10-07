import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import type { ReportSummary } from "@/lib/api/types/reports";

interface Props {
  items: unknown[];
}

export default function ReportTable({ items }: Props) {
  const { t } = useTranslation();

  /* props via generated interface + destructured signature */

  const emit = defineEmits<{
    (e: "delete", id: string): void;
  }>();

  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const headers = useMemo(() => [
    { title: i18n.t("category.category"), value: "category", key: "category" },
    { title: i18n.t("general.name"), value: "name", key: "name" },
    { title: i18n.t("general.timestamp"), value: "timestamp", key: "timestamp" },
    { title: i18n.t("general.status"), value: "status", key: "status" },
    { title: i18n.t("general.delete"), value: "actions", key: "actions" },
  ], []); // WF4-REVIEW: dependency array

  function handleRowClick(item: ReportSummary) {
    if (item.status === "in-progress") {
      return;
    }

    navigate(`/group/reports/${item.id}`);
  }

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function deleteReport(id: string) {
    emit("delete", id);
  }

  return (
    <>
  {/* WF4-REVIEW: unmapped <v-data-table> — judgement component, convert manually [J] */}
  <VDataTable headers={headers} items={items} item-key="id" className="elevation-0" items-per-page={50} onClickRow={($event, { item }) => handleRowClick(item)}>
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      {capitalize(item.category)}
    </>
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      {$d(Date.parse(item.timestamp!), "long")}
    </>
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      {capitalize(item.status!)}
    </>
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      <Button icon onClick={(e) => { e.stopPropagation(); deleteReport(item.id); }}>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={icons.delete} />
      </Button>
    </>
  </VDataTable>
    </>
  );
}
