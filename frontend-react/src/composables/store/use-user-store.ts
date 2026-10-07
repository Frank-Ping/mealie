import { useState } from "react";
import type { Composer } from "vue-i18n";
import { useReadOnlyStore } from "../partials/use-store-factory";
import { useRequests } from "../api/api-client";
import type { UserSummary } from "@/lib/api/types/user";
import { BaseCRUDAPIReadOnly } from "@/lib/api/base/base-clients";

const store: UserSummary[] /* WF4-REVIEW: was Ref */ = ref([]);
const [loading, setLoading] = useState(false);
const [initialized, setInitialized] = useState(false);

export function resetUserStore() {
  store = [];
  setLoading(false);
  setInitialized(false);
}

class GroupUserAPIReadOnly extends BaseCRUDAPIReadOnly<UserSummary> {
  baseRoute = "/api/groups/members";
  itemRoute = (idOrUsername: string | number) => `/groups/members/${idOrUsername}`;
}

export const useUserStore = function (i18n?: Composer) {
  const requests = useRequests(i18n);
  const api = new GroupUserAPIReadOnly(requests);

  return useReadOnlyStore<UserSummary>("user", store, loading, initialized, api, { orderBy: "full_name" });
};
