import { useEffect } from "react";
import type { AsyncData, NuxtError } from "#app";
import type { BoundT } from "./types";
import type { BaseCRUDAPI, BaseCRUDAPIReadOnly } from "@/lib/api/base/base-clients";
import type { QueryValue } from "@/lib/api/base/route";

interface ReadOnlyStoreActions<T extends BoundT> {
  getAll(page?: number, perPage?: number, params?: any): AsyncData<T[] | null, NuxtError<unknown> | null>;
  refresh(page?: number, perPage?: number, params?: any): Promise<void>;
}

interface StoreActions<T extends BoundT> extends ReadOnlyStoreActions<T> {
  createOne(createData: T): Promise<T | null>;
  updateOne(updateData: T): Promise<T | null>;
  deleteOne(id: string | number): Promise<T | null>;
  deleteMany(ids: (string | number)[]): Promise<void>;
}

/**
 * useReadOnlyActions is a factory function that returns a set of methods
 * that can be reused to manage the state of a data store without using
 * Vuex. This is primarily used for basic GET/GETALL operations that required
 * a lot of refreshing hooks to be called on operations
 */
export function useReadOnlyActions<T extends BoundT>(
  storeKey: string,
  api: BaseCRUDAPIReadOnly<T>,
  allRef: T[] | null /* WF4-REVIEW: was Ref */ | null,
  loading: boolean /* WF4-REVIEW: was Ref */,
  initialized: boolean /* WF4-REVIEW: was Ref */,
  defaultQueryParams: Record<string, QueryValue> = {},
): ReadOnlyStoreActions<T> {
  function getAll(page = 1, perPage = -1, params = {} as Record<string, QueryValue>) {
    params = { ...defaultQueryParams, ...params };
    params.orderBy ??= "name";
    params.orderDirection ??= "asc";

    const allItems = useEffect(() => {
  let cancelled = false;
  void (async () => {
    try {
      loading = true;
            try {
              const { data } = await api.getAll(page, perPage, params);
              if (cancelled) return;

              if (data && allRef) {
                allRef = data.items;
              }

              if (data) {
                return data.items ?? [];
              }
              else {
                return [];
              }
            }
            finally {
              loading = false;
            }
    }
    catch (err) {
      if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
    }
  })();
  return () => { cancelled = true; };
}, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

    return allItems;
  }

  async function refresh(page = 1, perPage = -1, params = {} as Record<string, QueryValue>) {
    params = { ...defaultQueryParams, ...params };
    params.orderBy ??= "name";
    params.orderDirection ??= "asc";

    loading = true;
    const { data } = await api.getAll(page, perPage, params);

    if (data && data.items && allRef) {
      allRef = data.items;
    }

    initialized = true;
    loading = false;
  }

  return {
    getAll,
    refresh,
  };
}

/**
 * useStoreActions is a factory function that returns a set of methods
 * that can be reused to manage the state of a data store without using
 * Vuex. This is primarily used for basic CRUD operations that required
 * a lot of refreshing hooks to be called on operations
 */
export function useStoreActions<T extends BoundT>(
  storeKey: string,
  api: BaseCRUDAPI<unknown, T, unknown>,
  allRef: T[] | null /* WF4-REVIEW: was Ref */ | null,
  loading: boolean /* WF4-REVIEW: was Ref */,
  initialized: boolean /* WF4-REVIEW: was Ref */,
  defaultQueryParams: Record<string, QueryValue> = {},
): StoreActions<T> {
  function getAll(page = 1, perPage = -1, params = {} as Record<string, QueryValue>) {
    params = { ...defaultQueryParams, ...params };
    params.orderBy ??= "name";
    params.orderDirection ??= "asc";

    const allItems = useEffect(() => {
  let cancelled = false;
  void (async () => {
    try {
      loading = true;
            try {
              const { data } = await api.getAll(page, perPage, params);
              if (cancelled) return;

              if (data && allRef) {
                allRef = data.items;
              }

              if (data) {
                return data.items ?? [];
              }
              else {
                return [];
              }
            }
            finally {
              loading = false;
            }
    }
    catch (err) {
      if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
    }
  })();
  return () => { cancelled = true; };
}, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

    return allItems;
  }

  async function refresh(page = 1, perPage = -1, params = {} as Record<string, QueryValue>) {
    params = { ...defaultQueryParams, ...params };
    params.orderBy ??= "name";
    params.orderDirection ??= "asc";

    loading = true;
    const { data } = await api.getAll(page, perPage, params);

    if (data && data.items && allRef) {
      allRef = data.items;
    }

    initialized = true;
    loading = false;
  }

  async function createOne(createData: T) {
    loading = true;
    const { data } = await api.createOne(createData);
    if (data && allRef?) {
      allRef.push(data);
    }
    else {
      await refresh();
    }
    loading = false;
    return data;
  }

  async function updateOne(updateData: T) {
    if (!updateData.id) {
      return null;
    }

    loading = true;
    const { data } = await api.updateOne(updateData.id, updateData);
    if (data && allRef?) {
      await refresh();
    }
    loading = false;
    return data;
  }

  async function deleteOne(id: string | number) {
    loading = true;
    const { response } = await api.deleteOne(id);
    if (response && allRef?) {
      await refresh();
    }
    loading = false;
    return response?.data || null;
  }

  async function deleteMany(ids: (string | number)[]) {
    loading = true;
    for (const id of ids) {
      await api.deleteOne(id);
    }
    if (allRef?) {
      await refresh();
    }
    loading = false;
  }

  return {
    getAll,
    refresh,
    createOne,
    updateOne,
    deleteOne,
    deleteMany,
  };
}
