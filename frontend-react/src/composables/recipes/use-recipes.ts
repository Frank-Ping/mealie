import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAsyncKey } from "../use-utils";
import { usePublicExploreApi } from "@/composables/api/api-client";
import { useUserApi } from "@/composables/api";
import { isSafeRedirectTarget } from "@/lib/validators/redirect";
import type { OrderByNullPosition, Recipe } from "@/lib/api/types/recipe";
import type { RecipeSearchQuery } from "@/lib/api/user/recipes/recipe";

export const [allRecipes, setAllRecipes] = useState([]);
export const [recentRecipes, setRecentRecipes] = useState([]);

export function resetRecipes() {
  setAllRecipes([]);
  setRecentRecipes([]);
}

function getParams(
  orderBy: string | null = null,
  orderDirection = "desc",
  orderByNullPosition: OrderByNullPosition | null = null,
  query: RecipeSearchQuery | null = null,
  queryFilter: string | null = null,
) {
  return {
    orderBy,
    orderDirection,
    orderByNullPosition,
    paginationSeed: query?._searchSeed, // propagate searchSeed to stabilize random order pagination
    searchSeed: query?._searchSeed, // unused, but pass it along for completeness of data
    search: query?.search,
    cookbook: query?.cookbook,
    households: query?.households,
    categories: query?.categories,
    requireAllCategories: query?.requireAllCategories,
    tags: query?.tags,
    requireAllTags: query?.requireAllTags,
    tools: query?.tools,
    requireAllTools: query?.requireAllTools,
    foods: query?.foods,
    requireAllFoods: query?.requireAllFoods,
    queryFilter,
  };
};

export const useLazyRecipes = function (publicGroupSlug: string | null = null) {
  const navigate = useNavigate();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]

  // passing the group slug switches to using the public API
  const api = publicGroupSlug ? usePublicExploreApi(publicGroupSlug).explore : useUserApi();

  const [recipes, setRecipes] = useState([]);

  async function fetchMore(
    page: number,
    perPage: number,
    orderBy: string | null = null,
    orderDirection = "desc",
    orderByNullPosition: OrderByNullPosition | null = null,
    query: RecipeSearchQuery | null = null,
    queryFilter: string | null = null,
  ) {
    const { data, error } = await api.recipes.getAll(
      page,
      perPage,
      getParams(orderBy, orderDirection, orderByNullPosition, query, queryFilter),
    );

    if (error?.response?.status === 404) {
      const redirect = typeof route.query.redirect === "string" ? route.query.redirect : undefined;
      navigate(isSafeRedirectTarget(redirect) ? { path: "/login", query: { redirect } } : "/login");
    }

    return data ? data.items : [];
  }

  function appendRecipes(val: Array<Recipe>) {
    val.forEach((recipe) => {
      recipes.push(recipe);
    });
  }

  function assignSorted(val: Array<Recipe>) {
    setRecipes(val);
  }

  function removeRecipe(slug: string) {
    for (let i = 0; i < recipes?.length; i++) {
      if (recipes?.value[i].slug === slug) {
        recipes?.splice(i, 1);
        break;
      }
    }
  }

  function replaceRecipes(val: Array<Recipe>) {
    setRecipes(val);
  }

  async function getRandom(query: RecipeSearchQuery | null = null, queryFilter: string | null = null) {
    query = query || {};
    query._searchSeed = query._searchSeed || Date.now().toString();
    const { data } = await api.recipes.getAll(1, 1, getParams("random", "desc", null, query, queryFilter));
    if (data?.items.length) {
      return data.items[0];
    }
  }

  return {
    recipes,
    fetchMore,
    appendRecipes,
    assignSorted,
    removeRecipe,
    replaceRecipes,
    getRandom,
  };
};

export const useRecipes = (
  all = false,
  fetchRecipes = true,
  loadFood = false,
  queryFilter: string | null = null,
  publicGroupSlug: string | null = null,
) => {
  const api = publicGroupSlug ? usePublicExploreApi(publicGroupSlug).explore : useUserApi();

  // recipes is non-reactive!!
  const { recipes, page, perPage } = (() => {
    if (all) {
      return {
        recipes: allRecipes,
        page: 1,
        perPage: -1,
      };
    }
    else {
      return {
        recipes: recentRecipes,
        page: 1,
        perPage: 30,
      };
    }
  })();

  async function refreshRecipes() {
    const { data } = await api.recipes.getAll(page, perPage, { loadFood, orderBy: "created_at", queryFilter });
    if (data) {
      setRecipes(data.items);
    }
  }

  function getAllRecipes() {
    useEffect(() => {
  let cancelled = false;
  void (async () => {
    try {
      await refreshRecipes();
      if (cancelled) return;
    }
    catch (err) {
      if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
    }
  })();
  return () => { cancelled = true; };
}, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow
  }

  function assignSorted(val: Array<Recipe>) {
    setRecipes(val);
  }

  if (fetchRecipes) {
    getAllRecipes();
  }

  return { getAllRecipes, assignSorted, refreshRecipes };
};
