import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Chip, CircularProgress, List, TextField } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useIntersectionObserver, watchDebounced } from "@vueuse/core";
import RecipeCardLineItem from "./RecipeCardLineItem";
import SearchFilter from "@/components/Domain/SearchFilter";
import { useLazyRecipes } from "@/composables/recipes";
import { useCategoryStore, useTagStore } from "@/composables/store";
import type { Recipe, RecipeCategory, RecipeSummary, RecipeTag } from "@/lib/api/types/recipe";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { RecipeSearchQuery } from "@/lib/api/user/recipes/recipe";

interface Props {
  queryFilter?: string | null;
  height?: string;
}

export default function RecipeSelector({ queryFilter = null, height = "100%" }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const modelValue = defineModel<RecipeSummary | null>({ default: null });

  const PER_PAGE = 20;

  const { fetchMore } = useLazyRecipes();
  const { store: categories } = useCategoryStore();
  const { store: tags } = useTagStore();

  const [search, setSearch] = useState("");
  const selectedCategories = ref<NoUndefinedField<RecipeCategory>[]>([]);
  const selectedTags = ref<NoUndefinedField<RecipeTag>[]>([]);

  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // discards the results of any request that was superseded while it was in flight
  let latestRequest = 0;

  const query = useMemo(() =>  {
    return {
      search: search || "",
      categories: selectedCategories.map(category => category.id, []); // WF4-REVIEW: dependency array,
      tags: selectedTags.map(tag => tag.id),
    };
  });

  function select(recipe: RecipeSummary | null) {
    modelValue = recipe;
  }

  function reset() {
    setSearch("");
    selectedCategories = [];
    selectedTags = [];
  }

  defineExpose({ reset });

  async function fetchPage(pageNumber: number, perPage: number) {
    return await fetchMore(pageNumber, perPage, "name", "asc", null, query, queryFilter);
  }

  async function reload() {
    const requestId = ++latestRequest;
    setLoading(true);

    // we double-up the first call so the results overflow their container,
    // otherwise there's nothing to scroll and no more recipes are ever loaded
    const newRecipes = await fetchPage(1, PER_PAGE * 2);
    if (requestId !== latestRequest) {
      return;
    }

    setRecipes(newRecipes);
    setHasMore(newRecipes.length >= PER_PAGE * 2);
    setPage(2);
    setLoading(false);
  }

  async function loadMore() {
    if (!hasMore || loading) {
      return;
    }

    const requestId = ++latestRequest;
    setLoading(true);
    page += 1;

    const newRecipes = await fetchPage(page, PER_PAGE);
    if (requestId !== latestRequest) {
      return;
    }

    setRecipes([...recipes, ...newRecipes]);
    setHasMore(newRecipes.length >= PER_PAGE);
    setLoading(false);
  }

  const [resultsContainer, setResultsContainer] = useState(null);
  const [sentinel, setSentinel] = useState(null);
  useIntersectionObserver(
    sentinel,
    ([entry]) => {
      if (entry?.isIntersecting) {
        loadMore();
      }
    },
    { root: resultsContainer },
  );

  watchDebounced(
    [query, () => queryFilter],
    async () => {
      await reload();
    },
    { debounce: 300 },
  );

  /* WF4-REVIEW [J] */ onMounted(async () => {
    await reload();
  });

  return (
    <>
  <div className="recipe-selector d-flex flex-column" style={{ height }}>
    {/* WF4-REVIEW: rules/error-messages → error+helperText */}
    <TextField value={search} onChange={setSearch} className="flex-grow-0" variant="outlined" density="compact" color="primary" autofocus hide-details clearable placeholder={t('search.search-placeholder')} prepend-inner-icon={$globals.icons.search} />
    <div className="d-flex flex-wrap align-start ga-2 mt-3">
      {(categories.length) ? (
        <SearchFilter value={selectedCategories} onChange={/* WF4-REVIEW: setter */ setSelectedCategories} items={categories}>
          {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
          <MdiIcon name={$globals.icons.categories} />
          {t("category.categories")}
        </SearchFilter>
      ) : null}
      {(tags.length) ? (
        <SearchFilter value={selectedTags} onChange={/* WF4-REVIEW: setter */ setSelectedTags} items={tags}>
          {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
          <MdiIcon name={$globals.icons.tags} />
          {t("tag.tags")}
        </SearchFilter>
      ) : null}
      <slot name="filters" />
    </div>
    {(modelValue) ? (
      <div className="d-flex align-center ga-2 mt-3">
        <span className="text-caption text-medium-emphasis">
          {t("general.selected")}
        </span>
        <Chip label color="primary" closable prepend-icon={$globals.icons.silverwareForkKnife} onClickClose={select(null)}>
          {modelValue.name}
        </Chip>
      </div>
    ) : null}
    <div ref="resultsContainer" className="recipe-results mt-3">
      {(recipes.length) ? (
        <List className="py-0">
          {recipes.map(recipe => (
            <RecipeCardLineItem key={recipe.id!} recipe={recipe} active={recipe.id === modelValue?.id} disable-link onClick={select(recipe)} />
          ))}
        </List>
      ) : (!loading) ? (
        <div className="py-2">
          <slot name="no-results">
            <Alert type="info" variant="tonal" text={t('search.no-results')} />
          </slot>
        </div>
      ) : null}
      <div ref="sentinel" />
      {(loading) ? (
        <CircularProgress indeterminate color="primary" className="d-block mx-auto my-3" />
      ) : null}
    </div>
  </div>
    </>
  );
}
