import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { watchDebounced } from "@vueuse/shared";
import type { IngredientFood, RecipeCategory, RecipeTag, RecipeTool } from "@/lib/api/types/recipe";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { HouseholdSummary } from "@/lib/api/types/household";
import type { RecipeSearchQuery } from "@/lib/api/user/recipes/recipe";
import {
  useCategoryStore,
  usePublicCategoryStore,
  useFoodStore,
  usePublicFoodStore,
  useHouseholdStore,
  usePublicHouseholdStore,
  useTagStore,
  usePublicTagStore,
  useToolStore,
  usePublicToolStore,
} from "@/composables/store";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { useUserSearchQuerySession, useUserSortPreferences } from "@/composables/use-users/preferences";

// Type for the composable return value
interface RecipeExplorerSearchState {
  state: {
    auto: boolean;
    ready: boolean;
    search: string;
    orderBy: string;
    orderDirection: "asc" | "desc";
    requireAllCategories: boolean;
    requireAllTags: boolean;
    requireAllTools: boolean;
    requireAllFoods: boolean;
    randomSeed: number;
  } /* WF4-REVIEW: was Ref */;
  selectedCategories: NoUndefinedField<RecipeCategory /* WF4-REVIEW: was Ref */[]>;
  selectedFoods: IngredientFood[] /* WF4-REVIEW: was Ref */;
  selectedHouseholds: NoUndefinedField<HouseholdSummary /* WF4-REVIEW: was Ref */[]>;
  selectedTags: NoUndefinedField<RecipeTag /* WF4-REVIEW: was Ref */[]>;
  selectedTools: NoUndefinedField<RecipeTool /* WF4-REVIEW: was Ref */[]>;
  passedQueryWithSeed: RecipeSearchQuery & { _searchSeed: string } /* WF4-REVIEW: was ComputedRef */;
  search: () => Promise<void>;
  reset: () => void;
  toggleOrderDirection: () => void;
  setOrderBy: (value: string) => void;
  setRandomOrderBy: () => void;
  filterItems: (item: RecipeCategory | RecipeTag | RecipeTool, urlPrefix: string) => void;
  initialize: () => Promise<void>;
}

// Memo storage for singleton instances
const memo: Record<string, RecipeExplorerSearchState> = {};

function createRecipeExplorerSearchState(groupSlug: string /* WF4-REVIEW: was ComputedRef */): RecipeExplorerSearchState {
  const navigate = useNavigate();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]

  const { isOwnGroup } = useLoggedInState();
  const searchQuerySession = useUserSearchQuerySession();
  const sortPreferences = useUserSortPreferences();

  // State management
  const [state, setState] = useState({
    auto: true,
    ready: false,
    search: "",
    orderBy: "created_at",
    orderDirection: "desc" as "asc" | "desc",
    requireAllCategories: false,
    requireAllTags: false,
    requireAllTools: false,
    requireAllFoods: false,
    randomSeed: 0,
  });

  // Store references
  const categories = isOwnGroup ? useCategoryStore() : usePublicCategoryStore(groupSlug);
  const foods = isOwnGroup ? useFoodStore() : usePublicFoodStore(groupSlug);
  const households = isOwnGroup ? useHouseholdStore() : usePublicHouseholdStore(groupSlug);
  const tags = isOwnGroup ? useTagStore() : usePublicTagStore(groupSlug);
  const tools = isOwnGroup ? useToolStore() : usePublicToolStore(groupSlug);

  // Selected items
  const selectedCategories = ref<NoUndefinedField<RecipeCategory>[]>([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const selectedHouseholds = ref<NoUndefinedField<HouseholdSummary>[]>([]);
  const selectedTags = ref<NoUndefinedField<RecipeTag>[]>([]);
  const selectedTools = ref<NoUndefinedField<RecipeTool>[]>([]);

  // Query defaults
  const queryDefaults = {
    search: "",
    orderBy: "created_at",
    orderDirection: "desc" as "asc" | "desc",
    requireAllCategories: false,
    requireAllTags: false,
    requireAllTools: false,
    requireAllFoods: false,
  };

  // Sync sort preferences
  /* WF4-REVIEW [J] */ watch(() => state.orderBy, (newValue) => {
    sortPreferences.orderBy = newValue;
  });

  /* WF4-REVIEW [J] */ watch(() => state.orderDirection, (newValue) => {
    sortPreferences.orderDirection = newValue;
  });

  // Utility functions
  function toIDArray(array: { id: string }[]) {
    return array.map(item => item.id).sort();
  }

  function calcPassedQuery(): RecipeSearchQuery {
    return {
      search: state.search ? state.search : "",
      categories: toIDArray(selectedCategories),
      foods: toIDArray(selectedFoods),
      households: toIDArray(selectedHouseholds),
      tags: toIDArray(selectedTags),
      tools: toIDArray(selectedTools),
      requireAllCategories: state.requireAllCategories,
      requireAllTags: state.requireAllTags,
      requireAllTools: state.requireAllTools,
      requireAllFoods: state.requireAllFoods,
      orderBy: state.orderBy,
      orderDirection: state.orderDirection,
    };
  }

  const [passedQuery, setPassedQuery] = useState(calcPassedQuery(););

  const passedQueryWithSeed = useMemo(() =>  {
    return {
      ...passedQuery,
      _searchSeed: Date.now(, []); // WF4-REVIEW: dependency array.toString(),
      _randomSeed: state.randomSeed,
    };
  });

  // Update the seed to trigger a new search
  function setRandomOrderBy() {
    state.orderBy = "random";
    state.randomSeed = Date.now();
  }

  // Wait utility for async hydration
  function waitUntilAndExecute(
    condition: () => boolean,
    callback: () => void,
    opts = { timeout: 2000, interval: 500 },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const state = {
        timeout: undefined as number | undefined,
        interval: undefined as number | undefined,
      };

      const check = () => {
        if (condition()) {
          clearInterval(state.interval);
          clearTimeout(state.timeout);
          callback();
          resolve();
        }
      };

      state.interval = setInterval(check, opts.interval) as unknown as number;
      state.timeout = setTimeout(() => {
        clearInterval(state.interval);
        reject(new Error("Timeout"));
      }, opts.timeout) as unknown as number;
    });
  }

  // Main functions
  function reset() {
    state.search = queryDefaults.search;
    state.orderBy = queryDefaults.orderBy;
    state.orderDirection = queryDefaults.orderDirection;
    sortPreferences.orderBy = queryDefaults.orderBy;
    sortPreferences.orderDirection = queryDefaults.orderDirection;
    state.requireAllCategories = queryDefaults.requireAllCategories;
    state.requireAllTags = queryDefaults.requireAllTags;
    state.requireAllTools = queryDefaults.requireAllTools;
    state.requireAllFoods = queryDefaults.requireAllFoods;
    selectedCategories = [];
    setSelectedFoods([]);
    selectedHouseholds = [];
    selectedTags = [];
    selectedTools = [];
  }

  function toggleOrderDirection() {
    state.orderDirection = state.orderDirection === "asc" ? "desc" : "asc";
    sortPreferences.orderDirection = state.orderDirection;
  }

  function setOrderBy(value: string) {
    state.orderBy = value;
    sortPreferences.orderBy = value;
  }

  async function search() {
    const oldQueryValueString = JSON.stringify(passedQuery);
    const newQueryValue = calcPassedQuery();
    const newQueryValueString = JSON.stringify(newQueryValue);
    if (oldQueryValueString === newQueryValueString) {
      return;
    }

    setPassedQuery(newQueryValue);
    const query = {
      categories: passedQuery.categories,
      foods: passedQuery.foods,
      tags: passedQuery.tags,
      tools: passedQuery.tools,
      // Only add the query param if it's not the default value
      ...{
        auto: state.auto ? undefined : "false",
        search: passedQuery.search === queryDefaults.search ? undefined : passedQuery.search,
        households: !passedQuery.households?.length || passedQuery.households?.length === households.store.length ? undefined : passedQuery.households,
        requireAllCategories: passedQuery.requireAllCategories ? "true" : undefined,
        requireAllTags: passedQuery.requireAllTags ? "true" : undefined,
        requireAllTools: passedQuery.requireAllTools ? "true" : undefined,
        requireAllFoods: passedQuery.requireAllFoods ? "true" : undefined,
      },
    };
    await navigate({ query });
    searchQuerySession.recipe = JSON.stringify(query);
  }

  function filterItems(item: RecipeCategory | RecipeTag | RecipeTool, urlPrefix: string) {
    if (urlPrefix === "categories") {
      const result = categories.store.filter(category => (category.id as string).includes(item.id as string));
      selectedCategories = result as NoUndefinedField<RecipeCategory>[];
    }
    else if (urlPrefix === "tags") {
      const result = tags.store.filter(tag => (tag.id as string).includes(item.id as string));
      selectedTags = result as NoUndefinedField<RecipeTag>[];
    }
    else if (urlPrefix === "tools") {
      const result = tools.store.filter(tool => (tool.id).includes(item.id || ""));
      selectedTools = result as NoUndefinedField<RecipeTool>[];
    }
  }

  async function hydrateSearch() {
    const query = router.currentRoute.query;
    if (query.auto?.length) {
      state.auto = query.auto === "true";
    }

    if (query.search?.length) {
      state.search = query.search as string;
    }
    else {
      state.search = queryDefaults.search;
    }

    state.orderBy = sortPreferences.orderBy;
    state.orderDirection = sortPreferences.orderDirection as "asc" | "desc";

    if (query.requireAllCategories?.length) {
      state.requireAllCategories = query.requireAllCategories === "true";
    }
    else {
      state.requireAllCategories = queryDefaults.requireAllCategories;
    }

    if (query.requireAllTags?.length) {
      state.requireAllTags = query.requireAllTags === "true";
    }
    else {
      state.requireAllTags = queryDefaults.requireAllTags;
    }

    if (query.requireAllTools?.length) {
      state.requireAllTools = query.requireAllTools === "true";
    }
    else {
      state.requireAllTools = queryDefaults.requireAllTools;
    }

    if (query.requireAllFoods?.length) {
      state.requireAllFoods = query.requireAllFoods === "true";
    }
    else {
      state.requireAllFoods = queryDefaults.requireAllFoods;
    }

    const promises: Promise<void>[] = [];

    if (query.categories?.length) {
      promises.push(
        waitUntilAndExecute(
          () => categories.store.length > 0,
          () => {
            const result = categories.store.filter(item =>
              (query.categories as string[]).includes(item.id as string),
            );
            selectedCategories = result as NoUndefinedField<RecipeCategory>[];
          },
        ),
      );
    }
    else {
      selectedCategories = [];
    }

    if (query.tags?.length) {
      promises.push(
        waitUntilAndExecute(
          () => tags.store.length > 0,
          () => {
            const result = tags.store.filter(item => (query.tags as string[]).includes(item.id as string));
            selectedTags = result as NoUndefinedField<RecipeTag>[];
          },
        ),
      );
    }
    else {
      selectedTags = [];
    }

    if (query.tools?.length) {
      promises.push(
        waitUntilAndExecute(
          () => tools.store.length > 0,
          () => {
            const result = tools.store.filter(item => (query.tools as string[]).includes(item.id));
            selectedTools = result as NoUndefinedField<RecipeTool>[];
          },
        ),
      );
    }
    else {
      selectedTools = [];
    }

    if (query.foods?.length) {
      promises.push(
        waitUntilAndExecute(
          () => {
            if (foods.store) {
              return foods.store.length > 0;
            }
            return false;
          },
          () => {
            const result = foods.store?.filter(item => (query.foods as string[]).includes(item.id));
            setSelectedFoods(result ?? []);
          },
        ),
      );
    }
    else {
      setSelectedFoods([]);
    }

    if (query.households?.length) {
      promises.push(
        waitUntilAndExecute(
          () => {
            if (households.store) {
              return households.store.length > 0;
            }
            return false;
          },
          () => {
            const result = households.store?.filter(item => (query.households as string[]).includes(item.id));
            selectedHouseholds = result as NoUndefinedField<HouseholdSummary>[] ?? [];
          },
        ),
      );
    }
    else {
      selectedHouseholds = [];
    }

    await Promise.allSettled(promises);
  }

  async function initialize() {
    // Restore the user's last search query
    if (searchQuerySession.recipe && !(Object.keys(route.query).length > 0)) {
      try {
        const query = JSON.parse(searchQuerySession.recipe);
        await navigate(/* WF4-REVIEW: replace+query */ { query });
      }
      catch {
        searchQuerySession.recipe = "";
        navigate(/* WF4-REVIEW: replace+query */ { query: {} });
      }
    }

    await hydrateSearch();
    await search();
    state.ready = true;
  }

  // Watch for route query changes
  /* WF4-REVIEW [J] */ watch(
    () => route.query,
    () => {
      if (!Object.keys(route.query).length) {
        reset();
      }
    },
  );

  // Auto-search when parameters change
  watchDebounced(
    [
      () => state.search,
      () => state.requireAllCategories,
      () => state.requireAllTags,
      () => state.requireAllTools,
      () => state.requireAllFoods,
      () => state.orderBy,
      () => state.orderDirection,
      selectedCategories,
      selectedFoods,
      selectedHouseholds,
      selectedTags,
      selectedTools,
    ],
    async () => {
      if (state.ready && state.auto) {
        await search();
      }
    },
    {
      debounce: 500,
    },
  );

  const composableInstance: RecipeExplorerSearchState = {
    // State
    state,
    selectedCategories,
    selectedFoods,
    selectedHouseholds,
    selectedTags,
    selectedTools,

    // Computed
    passedQueryWithSeed,

    // Methods
    search,
    reset,
    toggleOrderDirection,
    setOrderBy,
    setRandomOrderBy,
    filterItems,
    initialize,
  };

  return composableInstance;
}

export function useRecipeExplorerSearch(groupSlug: string /* WF4-REVIEW: was ComputedRef */): RecipeExplorerSearchState {
  const key = groupSlug;

  if (!memo[key]) {
    memo[key] = createRecipeExplorerSearchState(groupSlug);
  }

  return memo[key];
}

export function clearRecipeExplorerSearchState(groupSlug: string) {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete memo[groupSlug];
}
