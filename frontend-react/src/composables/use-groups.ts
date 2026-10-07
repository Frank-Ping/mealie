import { useState } from "react";
import { useUserApi } from "@/composables/api";
import type { GroupBase, GroupInDB, GroupSummary } from "@/lib/api/types/user";
import { useMealieAuth } from "@/composables/use-mealie-auth";

const [groupSelfRef, setGroupSelfRef] = useState(null);
const [loading, setLoading] = useState(false);

export function resetGroupSelf() {
  setGroupSelfRef(null);
  setLoading(false);
}

export const useGroupSelf = function () {
  const api = useUserApi();
  const auth = useMealieAuth();
  async function refreshGroupSelf() {
    if (!auth.user) {
      setGroupSelfRef(null);
      return;
    }
    setLoading(true);
    const { data } = await api.groups.getCurrentUserGroup();
    setGroupSelfRef(data);
    setLoading(false);
  }

  const actions = {
    get() {
      if (!(groupSelfRef || loading)) {
        refreshGroupSelf();
      }

      return groupSelfRef;
    },
    async updatePreferences() {
      if (!groupSelfRef) {
        await refreshGroupSelf();
      }
      if (!groupSelfRef?.preferences) {
        return;
      }

      const { data } = await api.groups.setPreferences(groupSelfRef.preferences);

      if (data) {
        groupSelfRef.preferences = data;
      }

      return data || undefined;
    },
    async updateAIProviderSettings() {
      if (!groupSelfRef) {
        await refreshGroupSelf();
      }
      if (!groupSelfRef?.aiProviderSettings) {
        return;
      }

      const { data } = await api.groups.setAIProviderSettings(groupSelfRef.aiProviderSettings);

      if (data) {
        groupSelfRef.aiProviderSettings = data;
      }

      return data || undefined;
    },
    async refresh() {
      await refreshGroupSelf();
    },
  };

  const group = actions.get();

  return { actions, group };
};

export const useGroups = function () {
  const api = useUserApi();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState(null);

  async function getAllGroups() {
    setLoading(true);
    const { data } = await api.groups.getAll(1, -1, { orderBy: "name", orderDirection: "asc" });

    if (data) {
      setGroups(data.items);
    }
    else {
      setGroups(null);
    }

    setLoading(false);
  }

  async function refreshAllGroups() {
    await getAllGroups();
  }

  async function deleteGroup(id: string | number) {
    setLoading(true);
    const { data } = await api.groups.deleteOne(id);
    setLoading(false);
    await refreshAllGroups();
    return data;
  }

  async function createGroup(payload: GroupBase) {
    setLoading(true);
    const { data } = await api.groups.createOne(payload);

    if (data && groups) {
      groups.push(data);
    }
    setLoading(false);
  }

  // Initialize data on first call
  if (!groups) {
    getAllGroups();
  }

  return { groups, getAllGroups, refreshAllGroups, deleteGroup, createGroup };
};
