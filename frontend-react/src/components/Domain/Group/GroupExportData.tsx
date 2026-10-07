import { parseISO, formatDistanceToNow } from "date-fns";
import type { GroupDataExport } from "@/lib/api/types/group";

export default function GroupExportData() {
  defineProps<{
    exports: GroupDataExport[];
  }>();

  const i18n = useI18n();

  const headers = [
    { title: i18n.t("export.export"), value: "name" },
    { title: i18n.t("export.file-name"), value: "filename" },
    { title: i18n.t("export.size"), value: "size" },
    { title: i18n.t("export.link-expires"), value: "expires" },
    { title: "", value: "actions" },
  ];

  function getTimeToExpire(timeString: string) {
    const expiresAt = parseISO(timeString);

    return formatDistanceToNow(expiresAt, {
      addSuffix: false,
    });
  }

  function downloadData(_: any) {
    console.log("Downloading data...");
  }

  return (
    <>
  {/* WF4-REVIEW: unmapped <v-data-table> — judgement component, convert manually [J] */}
  <VDataTable item-key="id" headers={headers} items={exports} items-per-page={15} className="elevation-0" onClickRow={downloadData}>
    <template>
      {getTimeToExpire(item.expires)}
    </template>
    <template>
      <BaseButton download size="small" download-url={`/api/recipes/bulk-actions/export/${item.id}/download`} />
    </template>
  </VDataTable>
    </>
  );
}
