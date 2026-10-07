import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, CardContent, Container } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useUserApi } from "@/composables/api";
import type { ReportOut } from "@/lib/api/types/reports";

export const handle = {
  middleware: ["auth"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Id() {
  const { t } = useTranslation();

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const id = route.params.id as string;

  const api = useUserApi();

  const [report, setReport] = useState(null);

  async function getReport() {
    const { data } = await api.groupReports.getOne(id);
    setReport(data ?? null);
  }

  /* WF4-REVIEW [J] */ onMounted(async () => {
    await getReport();
  });

  const itemHeaders = [
    { title: "Success", value: "success" },
    { title: "Message", value: "message" },
    { title: "Timestamp", value: "timestamp" },
  ];

  return (
    <>
  <Container>
    <BasePageTitle divider>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="100%" max-height="200" max-width="200" className="mb-2" src="/svgs/data-reports.svg" />
      </>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {t('group.report')}
      </>
    </BasePageTitle>
    {(report) ? (
      <Container>
        <BaseCardSectionTitle title={report.name} />
        <CardContent>
          {t('group.report-with-id', { id: id })}
        </CardContent>
        {/* WF4-REVIEW: unmapped <v-data-table> — judgement component, convert manually [J] */}
        <VDataTable headers={itemHeaders} items={report.entries} items-per-page={50} show-expand>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={item.success ? icons.checkboxMarkedCircle : icons.close} color={item.success ? 'success' : 'error'} />
          </>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {$d(Date.parse(item.timestamp!), "short")}
          </>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {(item.exception) ? (
              <td className="pa-6" colspan={headers.length}>
                {item.exception}
              </td>
            ) : null}
          </>
        </VDataTable>
      </Container>
    ) : null}
  </Container>
    </>
  );
}
