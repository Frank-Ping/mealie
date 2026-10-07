import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, Divider, FormControlLabel, List, ListItem, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import RecipeExplorerPageSearchFilters from "./RecipeExplorerPageSearchFilters";
import { useRecipeExplorerSearch, clearRecipeExplorerSearchState } from "@/composables/use-recipe-explorer-search";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function RecipeExplorerPageSearch() {
  const { t } = useTranslation();

  const emit = defineEmits<{
    ready: [];
  }>();

  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  // icons imported directly (was $globals)
  const { i18n } = useTranslation();
  const [showRandomLoading, setShowRandomLoading] = useState(false);

  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const {
    state,
    passedQueryWithSeed,
    search,
    reset,
    toggleOrderDirection,
    setOrderBy,
    setRandomOrderBy,
    filterItems,
    initialize,
  } = useRecipeExplorerSearch(groupSlug);

  defineExpose({
    passedQueryWithSeed,
    filterItems,
  });

  /* WF4-REVIEW [J] */ onMounted(async () => {
    await initialize();
    emit("ready");
  });

  /* WF4-REVIEW [J] */ onUnmounted(() => {
    // Clear the cache when component unmounts to ensure fresh state on remount
    clearRecipeExplorerSearchState(groupSlug);
  });

  const sortText = useMemo(() => {
    const sort = sortable.find(s => s === state.orderBy);
    if (!sort) return "";
    return `${sort.name}`;
  }, []); // WF4-REVIEW: dependency array

  const sortable = useMemo(() => [
    {
      icon: icons.orderAlphabeticalAscending,
      name: i18n.t("general.sort-alphabetically"),
      value: "name",
    },
    {
      icon: icons.newBox,
      name: i18n.t("general.created"),
      value: "created_at",
    },
    {
      icon: icons.chefHat,
      name: i18n.t("general.last-made"),
      value: "last_made",
    },
    {
      icon: icons.star,
      name: i18n.t("general.rating"),
      value: "rating",
    },
    {
      icon: icons.update,
      name: i18n.t("general.updated"),
      value: "updated_at",
    },
    {
      icon: icons.diceMultiple,
      name: i18n.t("general.random"),
      value: "random",
    },
  ], []); // WF4-REVIEW: dependency array

  // Methods
  const input: any /* WF4-REVIEW: was Ref */ = ref(null);

  function hideKeyboard() {
    input?.blur();
  }

  // function to show refresh icon
  async function setRandomOrderByWrapper() {
    if (!showRandomLoading) {
      setShowRandomLoading(true);
    }
    await setRandomOrderBy();
  }

  return (
    <>
  <div className="search-container pb-8">
    <form className="search-box pa-2" onSubmit={(e) => { e.preventDefault(); search; }}>
      <div className="d-flex justify-center mb-2">
        {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "state.search" [J] */}
        <TextField ref="input" variant="outlined" hide-details clearable color="primary" placeholder={t('search.search-placeholder')} prepend-inner-icon={icons.search} onKeyUp={hideKeyboard} />
      </div>
      <div className="search-row">
        <RecipeExplorerPageSearchFilters />
        {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
        <VMenu offset-y nudge-bottom="3">
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <Button className="ml-auto" size="small" color="accent" {...(props)}>
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={state.orderDirection === "asc" ? icons.sortDescending : icons.sortAscending} start={!$vuetify.display.xs} />
              {$vuetify.display.xs ? null : sortText}
            </Button>
          </>
          <Card>
            <List>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem slim density="comfortable" prepend-icon={state.orderDirection === 'asc' ? icons.sortAscending : icons.sortDescending} title={state.orderDirection === 'asc' ? t('general.sort-descending') : t('general.sort-ascending')} onClick={toggleOrderDirection} />
              <Divider />
              {sortable.map(v => (
                /* WF4-REVIEW: @click → ListItemButton */
                <ListItem key={v.name} active={state.orderBy === v} slim density="comfortable" onClick={(e) => { e.stopPropagation(); v === 'random' ? setRandomOrderByWrapper() : setOrderBy(v); }}>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {/* WF4-REVIEW: icon name resolves via lib/icons */}
                    <MdiIcon name={v.icon} />
                  </>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    <span>
                      {v.name}
                    </span>
                    {(v === 'random' && showRandomLoading) ? (
                      /* WF4-REVIEW: icon name resolves via lib/icons */
                      <MdiIcon name={icons.refreshCircle} size="small" className="ml-3" />
                    ) : null}
                  </>
                </ListItem>
              ))}
            </List>
          </Card>
        </VMenu>
        {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
        <VMenu offset-y bottom start nudge-bottom="3" close-on-content-click={false}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-btn> */}
            <Button size="small" color="accent" {...(props)}>
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={icons.cog} size="small" />
            </Button>
          </>
          <Card>
            <CardContent>
              {/* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "state.auto" [J] */}
              <FormControlLabel label={t('search.auto-search')} single-line color="primary" />
              <Button block color="primary" onClick={reset}>
                {t("general.reset")}
              </Button>
            </CardContent>
          </Card>
        </VMenu>
      </div>
      {(!state.auto) ? (
        <div className="search-button-container">
          <Button size="x-large" color="primary" type="submit" block>
            {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
            <MdiIcon name={icons.search} />
            {t("search.search")}
          </Button>
        </div>
      ) : null}
    </form>
  </div>
    </>
  );
}
