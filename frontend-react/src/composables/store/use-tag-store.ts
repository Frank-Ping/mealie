import { useState } from "react";
import type { Composer } from "vue-i18n";
import { useData, useReadOnlyStore, useStore } from "../partials/use-store-factory";
import type { RecipeTag } from "@/lib/api/types/recipe";
import { usePublicExploreApi, useUserApi } from "@/composables/api";

const store: RecipeTag[] /* WF4-REVIEW: was Ref */ = ref([]);
const [loading, setLoading] = useState(false);
const [initialized, setInitialized] = useState(false);
const [publicLoading, setPublicLoading] = useState(false);
const [publicInitialized, setPublicInitialized] = useState(false);

export function resetTagStore() {
  store = [];
  setLoading(false);
  setInitialized(false);
  setPublicLoading(false);
  setPublicInitialized(false);
}

export const useTagData = function () {
  return useData<RecipeTag>({
    id: "",
    name: "",
    slug: "",
  });
};

export const useTagStore = function (i18n?: Composer) {
  const api = useUserApi(i18n);
  return useStore<RecipeTag>("tag", store, loading, initialized, api.tags);
};

export const usePublicTagStore = function (groupSlug: string, i18n?: Composer) {
  const api = usePublicExploreApi(groupSlug, i18n).explore;
  return useReadOnlyStore<RecipeTag>("tag", store, publicLoading, publicInitialized, api.tags);
};
