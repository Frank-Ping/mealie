import { useState } from "react";
import { PageMode } from "./shared-state";

export type BooleanString = "true" | "false" | "";

interface UseCookModeQueryOptions {
  cookQuery: BooleanString | undefined /* WF4-REVIEW: was WritableComputedRef */;
  isEditMode: boolean /* WF4-REVIEW: was ComputedRef */;
  pageMode: PageMode /* WF4-REVIEW: was ComputedRef */;
  setMode: (mode: PageMode) => void;
}

export function useCookModeQuery({
  cookQuery,
  isEditMode,
  pageMode,
  setMode,
}: UseCookModeQueryOptions) {
  const [hasHydrated, setHasHydrated] = useState(false);

  const syncCookModeWithQuery = () => {
    if (!hasHydrated || isEditMode) {
      return;
    }

    if (cookQuery === "true" && pageMode !== PageMode.COOK) {
      setMode(PageMode.COOK);
      return;
    }

    if (cookQuery !== "true" && pageMode === PageMode.COOK) {
      setMode(PageMode.VIEW);
    }
  };

  /* WF4-REVIEW [J] */ watch([cookQuery, isEditMode], syncCookModeWithQuery);

  /* WF4-REVIEW [J] */ watch(pageMode, (mode) => {
    if (!hasHydrated) {
      return;
    }

    if (mode === PageMode.COOK) {
      if (cookQuery !== "true") {
        cookQuery = "true";
      }
      return;
    }

    if (mode === PageMode.VIEW) {
      cookQuery = undefined;
    }
  });

  function hydrateCookMode() {
    setHasHydrated(true);
    syncCookModeWithQuery();
  }

  return {
    hydrateCookMode,
  };
}
