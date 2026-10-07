import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Badge, Box, Button, Card, CardContent, Checkbox, Divider, FormControlLabel, Grid, ListItem, ListItemSecondaryAction, RadioGroup, TextField, ToggleButtonGroup } from "@mui/material";
import type { ISearchableItem } from "@/composables/use-search";
import { useSearch } from "@/composables/use-search";

interface Props {
  items: unknown[];
  requireAll?: boolean;
  radio?: boolean;
}

export default function SearchFilter({ items, requireAll = undefined, radio = false }: Props) {
  const { t } = useTranslation();

  const props = /* props via generated interface + destructured signature */

  const modelValue = defineModel<ISearchableItem[]>();

  const emit = defineEmits<{
    (e: "update:requireAll", value: boolean | undefined): void;
  }>();

  const state = /* WF4-REVIEW [J] */ reactive({
    menu: false,
  });

  // Use the search composable
  const { search: searchInput, filtered } = useSearch(computed(() => items));

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const combinator = computed({
    get: () => (requireAll ? "hasAll" : "hasAny"),
    set: (value: string) => {
      emit("update:requireAll", value === "hasAll");
    },
  });

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const selected = computed({
    get: () => modelValue ?? [],
    set: (value: ISearchableItem[]) => {
      modelValue = value;
    },
  });

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const selectedRadio = computed({
    get: () => (selected.length > 0 ? selected.value[0] : null),
    set: (value: ISearchableItem | null) => {
      const next = value ? [value] : [];
      selected = next;
    },
  });

  const selectedCount = selected.length; // was computed — plain read stays reactive
  const selectedIds = useMemo(() => new Set(selected.map(item => item.id)), []); // WF4-REVIEW: dependency array

  const handleRadioClick = (item: ISearchableItem) => {
    if (selectedRadio === item) {
      selectedRadio = null;
    }
  };

  function clearSelection() {
    selected = [];
    selectedRadio = null;
    searchInput = "";
  }

  return (
    <>
  <div>
    {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J]; v-model on complex expression "state.menu" [J] */}
    <VMenu offset-y bottom nudge-bottom="3" close-on-content-click={false}>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: content → badgeContent */}
        <Badge model-value={selectedCount > 0} size="small" color="primary" content={selectedCount}>
          {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-btn> */}
          <Button size="small" color="accent" {...(menuProps)}>
            <slot />
          </Button>
        </Badge>
      </>
      <Card width="400">
        <CardContent>
          {/* WF4-REVIEW: rules/error-messages → error+helperText */}
          <TextField value={searchInput} onChange={/* WF4-REVIEW: setter */ setSearchInput} className="mb-2" hide-details density="comfortable" variant={'underlined'} label={t('search.search')} clearable />
          <div />
          <div className="d-flex flex-wrap py-4 px-1 align-center">
            {(requireAll != undefined) ? (
              /* WF4-REVIEW: value/selection API */
              <ToggleButtonGroup value={combinator} onChange={/* WF4-REVIEW: setter */ setCombinator} mandatory density="compact" variant="outlined" color="primary" className="my-1">
                <Button value="hasAll">
                  {t('search.has-all')}
                </Button>
                <Button value="hasAny">
                  {t('search.has-any')}
                </Button>
              </ToggleButtonGroup>
            ) : null}
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" color="accent" className="my-1" onClick={clearSelection}>
              {t("search.clear-selection")}
            </Button>
          </div>
          {(filtered.length > 0) ? (
            <Card flat variant="text">
              {(radio) ? (
                <RadioGroup value={selectedRadio} onChange={/* WF4-REVIEW: setter */ setSelectedRadio} className="ma-0 pa-0">
                  {/* WF4-REVIEW: unmapped <v-virtual-scroll> — judgement component, convert manually [J] */}
                  <VVirtualScroll items={filtered} height="300">
                    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                    <>
                      {/* WF4-REVIEW: @click → ListItemButton */}
                      <ListItem key={`radio-${item.id}`} value={item} title={item.name}>
                        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                        <>
                          <ListItemSecondaryAction start>
                            {(radio) ? (
                              /* WF4-REVIEW: control={<Radio/>} */
                              <FormControlLabel value={item} color="primary" onClick={handleRadioClick(item)} />
                            ) : null}
                          </ListItemSecondaryAction>
                        </>
                      </ListItem>
                      <Divider />
                    </>
                  </VVirtualScroll>
                </RadioGroup>
              ) : null}
              <Grid container className="mt-1">
                {/* WF4-REVIEW: unmapped <v-virtual-scroll> — judgement component, convert manually [J] */}
                <VVirtualScroll items={filtered} height="300">
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {/* WF4-REVIEW: @click → ListItemButton */}
                    <ListItem key={`checkbox-${item.id}`} value={item} title={item.name}>
                      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                      <>
                        <ListItemSecondaryAction start>
                          <Checkbox value={selected} onChange={/* WF4-REVIEW: setter */ setSelected} value={item} color="primary" />
                        </ListItemSecondaryAction>
                      </>
                    </ListItem>
                    <Divider />
                  </>
                </VVirtualScroll>
              </Grid>
            </Card>
          ) : (
            <div>
              <Alert type="info" text={t('search.no-results')} className="mb-0" />
            </div>
          )}
        </CardContent>
      </Card>
    </VMenu>
  </div>
    </>
  );
}
