import { useState } from "react";
import type { Composer } from "vue-i18n";
import { useData, useStore } from "../partials/use-store-factory";
import type { IngredientUnit } from "@/lib/api/types/recipe";
import { useUserApi } from "@/composables/api";

const store: IngredientUnit[] /* WF4-REVIEW: was Ref */ = ref([]);
const [loading, setLoading] = useState(false);
const [initialized, setInitialized] = useState(false);

export function resetUnitStore() {
  store = [];
  setLoading(false);
  setInitialized(false);
}

export const useUnitData = function () {
  return useData<IngredientUnit>({
    id: "",
    name: "",
    fraction: true,
    abbreviation: "",
    description: "",
  });
};

export const useUnitStore = function (i18n?: Composer) {
  const api = useUserApi(i18n);
  return useStore<IngredientUnit>("unit", store, loading, initialized, api.units);
};
