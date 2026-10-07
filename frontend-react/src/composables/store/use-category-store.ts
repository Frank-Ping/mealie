import { useState } from "react";
import type { Composer } from "vue-i18n";
import { useData, useReadOnlyStore, useStore } from "../partials/use-store-factory";
import type { RecipeCategory } from "@/lib/api/types/recipe";
import { usePublicExploreApi, useUserApi } from "@/composables/api";

const store: RecipeCategory[] /* WF4-REVIEW: was Ref */ = ref([]);
const [loading, setLoading] = useState(false);
const [initialized, setInitialized] = useState(false);
const [publicLoading, setPublicLoading] = useState(false);
const [publicInitialized, setPublicInitialized] = useState(false);

export function resetCategoryStore() {
  store = [];
  setLoading(false);
  setInitialized(false);
  setPublicLoading(false);
  setPublicInitialized(false);
}

export const useCategoryData = function () {
  return useData<RecipeCategory>({
    id: "",
    name: "",
    slug: "",
  });
};

export const useCategoryStore = function (i18n?: Composer) {
  const api = useUserApi(i18n);
  return useStore<RecipeCategory>("category", store, loading, initialized, api.categories);
};

export const usePublicCategoryStore = function (groupSlug: string, i18n?: Composer) {
  const api = usePublicExploreApi(groupSlug, i18n).explore;
  return useReadOnlyStore<RecipeCategory>("category", store, publicLoading, publicInitialized, api.categories);
};
