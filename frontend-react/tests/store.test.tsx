import { test, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { createSharedStore, useSharedStore } from "../src/infra/store";

test("two consumers share one stable immutable snapshot; reset updates both", () => {
  const original = [{ name: "first" }];
  const store = createSharedStore(original);
  function Consumer({ id }: { id: string }) { return <span data-testid={id}>{useSharedStore(store).data[0]?.name || "empty"}</span>; }
  render(<><Consumer id="one" /><Consumer id="two" /></>);
  expect(store.getSnapshot()).toBe(store.getSnapshot());
  original[0]!.name = "externally changed";
  expect(screen.getByTestId("one").textContent).toBe("first");
  act(() => store.set([{ name: "updated" }]));
  expect(screen.getByTestId("one").textContent).toBe("updated");
  expect(screen.getByTestId("two").textContent).toBe("updated");
  expect(Object.isFrozen(store.getSnapshot().data[0])).toBe(true);
  act(() => store.reset());
  // Reset should restore captured initial state, not a caller-mutated object.
  expect(screen.getByTestId("one").textContent).toBe("first");
});

test("concurrent load deduplicates and reset prevents stale completion from repopulating store", async () => {
  const store = createSharedStore<string[]>([]);
  let finish!: (data: string[]) => void;
  const loader = vi.fn(() => new Promise<string[]>(resolve => { finish = resolve; }));
  const first = store.ensureLoaded(loader), second = store.ensureLoaded(loader);
  expect(second).toBe(first);
  await Promise.resolve();
  expect(loader).toHaveBeenCalledTimes(1);
  store.reset();
  finish(["stale tenant"]);
  await first;
  expect(store.getSnapshot().data).toEqual([]);
  expect(store.getSnapshot().initialized).toBe(false);
  await store.ensureLoaded(async () => ["fresh"]);
  expect(store.getSnapshot().data).toEqual(["fresh"]);
  expect(store.getSnapshot().initialized).toBe(true);
});

test("failed load releases loading state and can retry", async () => {
  const store = createSharedStore<string[]>([]);
  await store.ensureLoaded(async () => { throw new Error("offline"); });
  expect(store.getSnapshot().loading).toBe(false);
  expect(store.getSnapshot().error).toBe("offline");
  expect(store.getSnapshot().initialized).toBe(false);
  await store.ensureLoaded(async () => ["recovered"]);
  expect(store.getSnapshot().data).toEqual(["recovered"]);
  expect(store.getSnapshot().error).toBeNull();
});
