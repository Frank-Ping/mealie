import { useState } from "react";
import type { Composer } from "vue-i18n";
import { useReadOnlyStore } from "../partials/use-store-factory";
import type { HouseholdSummary } from "@/lib/api/types/household";
import { usePublicExploreApi, useUserApi } from "@/composables/api";

const store: HouseholdSummary[] /* WF4-REVIEW: was Ref */ = ref([]);
const [loading, setLoading] = useState(false);
const [initialized, setInitialized] = useState(false);
const [publicLoading, setPublicLoading] = useState(false);
const [publicInitialized, setPublicInitialized] = useState(false);

export function resetHouseholdStore() {
  store = [];
  setLoading(false);
  setInitialized(false);
  setPublicLoading(false);
  setPublicInitialized(false);
}

export const useHouseholdStore = function (i18n?: Composer) {
  const api = useUserApi(i18n);
  return useReadOnlyStore<HouseholdSummary>("household", store, loading, initialized, api.households);
};

export const usePublicHouseholdStore = function (groupSlug: string, i18n?: Composer) {
  const api = usePublicExploreApi(groupSlug, i18n).explore;
  return useReadOnlyStore<HouseholdSummary>("household-public", store, publicLoading, publicInitialized, api.households);
};
