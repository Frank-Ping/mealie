import { useState } from "react";
import { watchDebounced } from "@vueuse/core";
import type { UserApi } from "@/lib/api";
import type { ExploreApi } from "@/lib/api/public/explore";
import type { Recipe } from "@/lib/api/types/recipe";

export interface UseRecipeSearchReturn {
  query: string /* WF4-REVIEW: was Ref */;
  error: string /* WF4-REVIEW: was Ref */;
  loading: boolean /* WF4-REVIEW: was Ref */;
  data: Recipe[] /* WF4-REVIEW: was Ref */;
  trigger(): Promise<void>;
}

/**
 * `useRecipeSearch` constructs a basic reactive search query
 * that when `query` is changed, will search for recipes based
 * on the query. Useful for searchable list views. For advanced
 * search, use the `useRecipeQuery` composable.
 */
export function useRecipeSearch(api: UserApi | ExploreApi): UseRecipeSearchReturn {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);

  async function searchRecipes(term: string) {
    setLoading(true);
    const { data, error } = await api.recipes.search({
      search: term,
      page: 1,
      orderBy: "name",
      orderDirection: "asc",
      perPage: 20,
      _searchSeed: Date.now().toString(),
    });

    if (error) {
      console.error(error);
      setLoading(false);
      setRecipes([]);
      return;
    }

    if (data) {
      setRecipes(data.items);
    }

    setLoading(false);
  }

  watchDebounced(
    () => query,
    async (term: string) => {
      await searchRecipes(term);
    },
    { debounce: 500 },
  );

  async function trigger() {
    await searchRecipes(query);
  }

  return {
    query,
    error,
    loading,
    data: recipes,
    trigger,
  };
}
