import { useState } from "react";
import { describe, expect, test } from "vitest";
import { PageMode } from "./shared-state";
import { useCookModeQuery, type BooleanString } from "./use-cook-mode-query";

function buildHarness(initialCookQuery: BooleanString | undefined = undefined, initialMode = PageMode.VIEW) {
  const [cookQuery, setCookQuery] = useState(initialCookQuery);
  const [pageMode, setPageMode] = useState(initialMode);

  const setMode = (mode: PageMode) => {
    setPageMode(mode);
  };

  const sync = useCookModeQuery({
    cookQuery: computed({
      get: () => cookQuery,
      set: (value) => {
        setCookQuery(value);
      },
    }),
    isEditMode: computed(() => setPageMode(== PageMode.EDIT),
    pageMode: computed(() => pageMode),
    setMode,
  }));

  return {
    cookQuery,
    pageMode,
    setMode,
    ...sync,
  };
}

function buildAsyncHarness(initialCookQuery: BooleanString | undefined = undefined, initialMode = PageMode.VIEW) {
  const [routeCookQuery, setRouteCookQuery] = useState(initialCookQuery);
  const [pageMode, setPageMode] = useState(initialMode);

  const setMode = (mode: PageMode) => {
    setPageMode(mode);
  };

  const sync = useCookModeQuery({
    cookQuery: computed({
      get: () => routeCookQuery,
      set: (value) => {
        /* WF4-REVIEW [J] */ nextTick(() => {
          setRouteCookQuery(value);
        });
      },
    }),
    isEditMode: computed(() => setPageMode(== PageMode.EDIT),
    pageMode: computed(() => pageMode),
    setMode,
  }));

  return {
    cookQuery: routeCookQuery,
    pageMode,
    setMode,
    ...sync,
  };
}

describe("useCookModeQuery", () => {
  test("hydrates cook mode from the query", async () => {
    const harness = buildHarness("true");

    harness.hydrateCookMode();
    await /* WF4-REVIEW [J] */ nextTick();

    expect(harness.pageMode).toBe(PageMode.COOK);
  });

  test("does not enter cook mode while edit mode is active", async () => {
    const harness = buildHarness("true", PageMode.EDIT);

    harness.hydrateCookMode();
    await /* WF4-REVIEW [J] */ nextTick();

    expect(harness.pageMode).toBe(PageMode.EDIT);
    expect(harness.cookQuery).toBe("true");
  });

  test("enters cook mode after leaving edit mode if the query is still set", async () => {
    const harness = buildHarness("true", PageMode.EDIT);

    harness.hydrateCookMode();
    harness.setMode(PageMode.VIEW);
    await /* WF4-REVIEW [J] */ nextTick();

    expect(harness.pageMode).toBe(PageMode.COOK);
  });

  test("writes cook=true when cook mode is entered from the UI", async () => {
    const harness = buildHarness();

    harness.hydrateCookMode();
    harness.setMode(PageMode.COOK);
    await /* WF4-REVIEW [J] */ nextTick();

    expect(harness.cookQuery).toBe("true");
  });

  test("removes the query when cook mode is exited to view mode", async () => {
    const harness = buildHarness("true", PageMode.COOK);

    harness.hydrateCookMode();
    harness.setMode(PageMode.VIEW);
    await /* WF4-REVIEW [J] */ nextTick();

    expect(harness.cookQuery).toBeUndefined();
  });

  test("reacts to route query changes after hydration", async () => {
    const harness = buildHarness();

    harness.hydrateCookMode();
    harness.setCookQuery("true");
    await /* WF4-REVIEW [J] */ nextTick();

    expect(harness.pageMode).toBe(PageMode.COOK);

    harness.setCookQuery(undefined);
    await /* WF4-REVIEW [J] */ nextTick();

    expect(harness.pageMode).toBe(PageMode.VIEW);
  });

  test("clears a pending cook query when cook mode is entered and exited in the same tick", async () => {
    const harness = buildAsyncHarness();

    harness.hydrateCookMode();
    harness.setMode(PageMode.COOK);
    harness.setMode(PageMode.VIEW);
    await /* WF4-REVIEW [J] */ nextTick();
    await /* WF4-REVIEW [J] */ nextTick();

    expect(harness.cookQuery).toBeUndefined();
    expect(harness.pageMode).toBe(PageMode.VIEW);
  });
});
