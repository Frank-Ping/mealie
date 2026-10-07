import { useReadOnlyActions, useStoreActions } from "./use-actions-factory";
import type { BoundT } from "./types";
import type { BaseCRUDAPI, BaseCRUDAPIReadOnly } from "@/lib/api/base/base-clients";
import type { QueryValue } from "@/lib/api/base/route";

export const useData = function <T extends BoundT>(defaultObject: T) {
  const data = /* WF4-REVIEW [J] */ reactive({ ...defaultObject });
  function reset() {
    Object.assign(data, defaultObject);
  };

  return { data, reset };
};

export const useReadOnlyStore = function <T extends BoundT>(
  storeKey: string,
  store: T[] /* WF4-REVIEW: was Ref */,
  loading: boolean /* WF4-REVIEW: was Ref */,
  initialized: boolean /* WF4-REVIEW: was Ref */,
  api: BaseCRUDAPIReadOnly<T>,
  params = {} as Record<string, QueryValue>,
) {
  const storeActions = useReadOnlyActions(`${storeKey}-store-readonly`, api, store, loading, initialized);
  const actions = {
    ...storeActions,
    async refresh() {
      return await storeActions.refresh(1, -1, params);
    },
    flushStore() {
      store = [];
      initialized = false;
    },
  };

  // initial hydration
  if (!loading && !initialized) {
    actions.refresh();
  }

  return { store, actions };
};

export const useStore = function <T extends BoundT>(
  storeKey: string,
  store: T[] /* WF4-REVIEW: was Ref */,
  loading: boolean /* WF4-REVIEW: was Ref */,
  initialized: boolean /* WF4-REVIEW: was Ref */,
  api: BaseCRUDAPI<unknown, T, unknown>,
  params = {} as Record<string, QueryValue>,
) {
  const storeActions = useStoreActions(`${storeKey}-store`, api, store, loading, initialized);
  const actions = {
    ...storeActions,
    async refresh() {
      return await storeActions.refresh(1, -1, params);
    },
    flushStore() {
      store = [];
      initialized = false;
    },
  };

  // initial hydration
  if (!loading && !initialized) {
    actions.refresh();
  }

  return { store, actions };
};
