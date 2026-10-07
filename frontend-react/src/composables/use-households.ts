import { useState } from "react";
import { useAdminApi, useUserApi } from "@/composables/api";
import type { HouseholdCreate, HouseholdInDB } from "@/lib/api/types/household";
import { useMealieAuth } from "@/composables/use-mealie-auth";

const [householdSelfRef, setHouseholdSelfRef] = useState(null);
const [loading, setLoading] = useState(false);

export function resetHouseholdSelf() {
  setHouseholdSelfRef(null);
  setLoading(false);
}

export const useHouseholdSelf = function () {
  const api = useUserApi();
  const auth = useMealieAuth();

  async function refreshHouseholdSelf() {
    if (!auth.user) {
      setHouseholdSelfRef(null);
      return;
    }
    setLoading(true);
    const { data } = await api.households.getCurrentUserHousehold();
    setHouseholdSelfRef(data);
    setLoading(false);
  }

  const actions = {
    get() {
      if (!(householdSelfRef || loading)) {
        refreshHouseholdSelf();
      }

      return householdSelfRef;
    },
    async updatePreferences() {
      if (!householdSelfRef) {
        await refreshHouseholdSelf();
      }
      if (!householdSelfRef?.preferences) {
        return;
      }

      const { data } = await api.households.setPreferences(householdSelfRef.preferences);

      if (data) {
        householdSelfRef.preferences = data;
      }

      return data || undefined;
    },
    async refresh() {
      await refreshHouseholdSelf();
    },
  };

  const household = actions.get();

  return { actions, household };
};

export const useAdminHouseholds = function () {
  const api = useAdminApi();
  const [loading, setLoading] = useState(false);
  const [households, setHouseholds] = useState(null);

  async function getAllHouseholds() {
    setLoading(true);
    const { data } = await api.households.getAll(1, -1, { orderBy: "name, group.name", orderDirection: "asc" });

    if (data) {
      setHouseholds(data.items);
    }
    else {
      setHouseholds(null);
    }

    setLoading(false);
  }

  async function refreshAllHouseholds() {
    await getAllHouseholds();
  }

  async function deleteHousehold(id: string | number) {
    setLoading(true);
    const { data } = await api.households.deleteOne(id);
    setLoading(false);
    await refreshAllHouseholds();
    return data;
  }

  async function createHousehold(payload: HouseholdCreate) {
    setLoading(true);
    const { data } = await api.households.createOne(payload);

    if (data && households) {
      households.push(data);
    }
    setLoading(false);
  }

  function useHouseholdsInGroup(groupIdRef: string /* WF4-REVIEW: was Ref */) {
    return computed(
      () => {
        return (households && groupIdRef)
          ? households.filter(h => h.groupId === groupIdRef)
          : [];
      },
    );
  }

  if (!households) {
    getAllHouseholds();
  }

  return {
    households,
    useHouseholdsInGroup,
    getAllHouseholds,
    refreshAllHouseholds,
    deleteHousehold,
    createHousehold,
  };
};
