import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardActions, CardContent, FormControlLabel, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { downloadAsJson } from "@/composables/use-utils";

interface Props {

}

export interface TableConfig {
  hideColumns: boolean;
  canExport: boolean;
}

export interface TableHeaders {
  text: string;
  value: string;
  show: boolean;
  align?: "start" | "center" | "end";
  sortable?: boolean;
  sort?: (a: any, b: any) => number;
}

export interface BulkAction {
  icon: string;
  text: string;
  event: string;
}

export default function CrudTable() {
  const { t } = useTranslation();

  const props = /* props via generated interface + destructured signature */,
    },
    headers: {
      type: Array as () => TableHeaders[],
      required: true,
    },
    data: {
      type: Array as () => any[],
      required: true,
    },
    bulkActions: {
      type: Array as () => BulkAction[],
      default: () => [],
    },
    initialSort: {
      type: String,
      default: "id",
    },
    initialSortDesc: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits<{
    (e: "delete-one" | "edit-one", item: any): void;
    (e: "bulk-action", event: string, items: any[]): void;
  }>();

  const sortBy = useMemo(() => [{
    key: initialSort,
    order: initialSortDesc ? "desc" : "asc",
  }], []); // WF4-REVIEW: dependency array

  // ===========================================================
  // Reactive Headers
  // Create a local reactive copy of headers that we can modify
  const [localHeaders, setLocalHeaders] = useState([...headers]);

  // Watch for changes in headers and update local copy
  /* WF4-REVIEW [J] */ watch(() => headers, (newHeaders) => {
    setLocalHeaders([...newHeaders]);
  }, { deep: true });

  const filteredHeaders = useMemo(() => {
    return localHeaders.filter(header => header.show).map(header => header);
  }, []); // WF4-REVIEW: dependency array

  const headersWithoutActions = useMemo(() => localHeaders
      .filter(header => filteredHeaders.includes(header))
      .map(header => ({
        ...header,
        title: header.text,
      })),, []); // WF4-REVIEW: dependency array

  const activeHeaders = useMemo(() => [
    ...headersWithoutActions,
    { title: "", value: "actions", show: true, align: "end" },
  ], []); // WF4-REVIEW: dependency array

  const [selected, setSelected] = useState([]);

  // ===========================================================
  // Bulk Action Event Handler

  const bulkActionListener = useMemo(() => {
    const handlers: { [key: string]: () => void } = {};

    bulkActions.forEach((action) => {
      handlers[action.event] = () => {
        emit("bulk-action", action.event, selected);
        // clear selection
        setSelected([]);
      };
    });

    return handlers;
  }, []); // WF4-REVIEW: dependency array

  const [search, setSearch] = useState("");

  return (
    <>
  <div>
    <CardActions className="flex-wrap">
      {(tableConfig.hideColumns) ? (
        /* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */
        <VMenu offset-y bottom nudge-bottom="6" close-on-content-click={false}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <Button color="accent" variant="elevated" {...(activatorProps)}>
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={icons.cog} />
            </Button>
          </>
          <Card>
            <CardContent>
              {localHeaders.map(itemValue => (
                /* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "itemValue.show" [J] */
                <FormControlLabel key={itemValue.text + itemValue.show} density="compact" flat inset label={itemValue.text} hide-details />
              ))}
            </CardContent>
          </Card>
        </VMenu>
      ) : null}
      {(bulkActions.length > 0) ? (
        <BaseOverflowButton disabled={selected.length < 1} mode="event" color="info" variant="elevated" items={bulkActions} onClick={bulkActionListener} />
      ) : null}
      <slot name="button-row" />
    </CardActions>
    <div className="mx-2 clip-width">
      {/* WF4-REVIEW: rules/error-messages → error+helperText */}
      <TextField value={search} onChange={setSearch} variant="underlined" label={t('search.search')} />
    </div>
    {/* WF4-REVIEW: unmapped <v-data-table> — judgement component, convert manually [J] */}
    <VDataTable value={selected} onChange={setSelected} return-object headers={activeHeaders} show-select={bulkActions.length > 0} sort-by={sortBy} items={data || []} items-per-page={15} search={search} className="elevation-2">
      {headersWithoutActions.map(header => (
        /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
        <>
          <slot name={'item.' + header} {...({ item })}>
            {item[header]}
          </slot>
        </>
      ))}
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        <BaseButtonGroup buttons={[
            {
              icon: icons.edit,
              text: t('general.edit'),
              event: 'edit',
            },
            {
              icon: icons.delete,
              text: t('general.delete'),
              event: 'delete',
            },
          ]} onDelete={onDeleteOne?.(item)} onEdit={onEditOne?.(item)} />
      </>
    </VDataTable>
    <CardActions className="justify-end">
      <slot name="button-bottom" />
      <BaseButton color="info" onClick={downloadAsJson(data, 'export.json')}>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {icons.download}
        </>
        {t("general.download")}
      </BaseButton>
    </CardActions>
  </div>
    </>
  );
}
