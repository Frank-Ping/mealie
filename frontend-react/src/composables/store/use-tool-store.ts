import { useState } from "react";
import type { Composer } from "vue-i18n";
import { useData, useReadOnlyStore, useStore } from "../partials/use-store-factory";
import type { RecipeTool } from "@/lib/api/types/recipe";
import { usePublicExploreApi, useUserApi } from "@/composables/api";

interface RecipeToolWithOnHand extends RecipeTool {
  onHand: boolean;
}

const store: RecipeTool[] /* WF4-REVIEW: was Ref */ = ref([]);
const [loading, setLoading] = useState(false);
const [initialized, setInitialized] = useState(false);
const [publicLoading, setPublicLoading] = useState(false);
const [publicInitialized, setPublicInitialized] = useState(false);

export function resetToolStore() {
  store = [];
  setLoading(false);
  setInitialized(false);
  setPublicLoading(false);
  setPublicInitialized(false);
}

export const useToolData = function () {
  return useData<RecipeToolWithOnHand>({
    id: "",
    name: "",
    slug: "",
    onHand: false,
    householdsWithTool: [],
  });
};

export const useToolStore = function (i18n?: Composer) {
  const api = useUserApi(i18n);
  return useStore<RecipeTool>("tool", store, loading, initialized, api.tools);
};

export const usePublicToolStore = function (groupSlug: string, i18n?: Composer) {
  const api = usePublicExploreApi(groupSlug, i18n).explore;
  return useReadOnlyStore<RecipeTool>("tool", store, publicLoading, publicInitialized, api.tools);
};
