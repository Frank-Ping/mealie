import { useEffect } from "react";
import { useAsyncKey } from "./use-utils";
import { usePublicExploreApi } from "./api/api-client";
import { useUserApi } from "@/composables/api";

export const useCookbook = function (publicGroupSlug: string | null = null) {
  function getOne(id: string | number) {
    // passing the group slug switches to using the public API
    const api = publicGroupSlug ? usePublicExploreApi(publicGroupSlug).explore : useUserApi();

    const { data: units } = useEffect(() => {
  let cancelled = false;
  void (async () => {
    try {
      const { data } = await api.cookbooks.getOne(id);
      if (cancelled) return;

            return data;
    }
    catch (err) {
      if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
    }
  })();
  return () => { cancelled = true; };
}, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

    return units;
  }

  return { getOne };
};
