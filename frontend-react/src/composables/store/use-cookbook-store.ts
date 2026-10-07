import { useState } from "react";
import type { Composer } from "vue-i18n";
import { useReadOnlyStore, useStore } from "../partials/use-store-factory";
import type { ReadCookBook, UpdateCookBook } from "@/lib/api/types/cookbook";
import { usePublicExploreApi, useUserApi } from "@/composables/api";

const cookbooks: ReadCookBook[] /* WF4-REVIEW: was Ref */ = ref([]);
const [loading, setLoading] = useState(false);
const [initialized, setInitialized] = useState(false);
const [publicLoading, setPublicLoading] = useState(false);
const [publicInitialized, setPublicInitialized] = useState(false);

export function resetCookbookStore() {
  cookbooks = [];
  setLoading(false);
  setInitialized(false);
  setPublicLoading(false);
  setPublicInitialized(false);
}

export const useCookbookStore = function (i18n?: Composer) {
  const api = useUserApi(i18n);
  const store = useStore<ReadCookBook>("cookbook", cookbooks, loading, initialized, api.cookbooks);

  const updateAll = async function (updateData: UpdateCookBook[]) {
    setLoading(true);
    updateData.forEach((cookbook, index) => {
      cookbook.position = index;
    });
    const { data } = await api.cookbooks.updateAll(updateData);
    setLoading(false);
    return data;
  };
  return { ...store, updateAll };
};

export const usePublicCookbookStore = function (groupSlug: string, i18n?: Composer) {
  const api = usePublicExploreApi(groupSlug, i18n).explore;
  return useReadOnlyStore<ReadCookBook>("cookbook", cookbooks, publicLoading, publicInitialized, api.cookbooks);
};
