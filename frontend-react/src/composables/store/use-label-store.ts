import { useState } from "react";
import type { Composer } from "vue-i18n";
import { useData, useStore } from "../partials/use-store-factory";
import type { MultiPurposeLabelOut } from "@/lib/api/types/labels";
import { useUserApi } from "@/composables/api";

const store: MultiPurposeLabelOut[] /* WF4-REVIEW: was Ref */ = ref([]);
const [loading, setLoading] = useState(false);
const [initialized, setInitialized] = useState(false);

export function resetLabelStore() {
  store = [];
  setLoading(false);
  setInitialized(false);
}

export const useLabelData = function () {
  return useData<MultiPurposeLabelOut>({
    groupId: "",
    id: "",
    name: "",
    color: "",
  });
};

export const useLabelStore = function (i18n?: Composer) {
  const api = useUserApi(i18n);
  return useStore<MultiPurposeLabelOut>("label", store, loading, initialized, api.multiPurposeLabels);
};
