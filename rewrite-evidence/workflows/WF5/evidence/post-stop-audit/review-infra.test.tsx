import { expect, test, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { createSharedStore } from "../src/infra/store";
import { AuthGuard, AuthSnapshotProvider } from "../src/infra/guards";
import { i18n, useLegacyI18n } from "../src/infra/i18n";

// Independent audit tests. Copy only into the temporary audit replica's tests/.
// These tests assert public primitive contracts, not complete Mealie equivalence.
test("audit: rejected non-plain loader data must release loading and report the failure", async () => {
  const store = createSharedStore<unknown>(null);
  // Whether the primitive resolves or rejects is independent of cleanup safety.
  await store.ensureLoaded(async () => new Date("2026-01-01T00:00:00Z")).catch(() => undefined);
  expect(store.getSnapshot().loading).toBe(false);
  expect(store.getSnapshot().initialized).toBe(false);
  expect(store.getSnapshot().error).toBeTruthy();
  expect(store.getSnapshot().data).toBeNull();
  await store.ensureLoaded(async () => ({ value: "recovered" }));
  expect(store.getSnapshot().data).toEqual({ value: "recovered" });
  expect(store.getSnapshot().error).toBeNull();
});

test.each(["old-first", "new-first"] as const)("audit: reset preserves new flight when completions are %s", async (order) => {
  const store = createSharedStore<string[]>([]);
  let finishOld!: (data: string[]) => void;
  let finishNew!: (data: string[]) => void;
  const oldLoader = vi.fn(() => new Promise<string[]>(resolve => { finishOld = resolve; }));
  const newLoader = vi.fn(() => new Promise<string[]>(resolve => { finishNew = resolve; }));
  const oldFlight = store.ensureLoaded(oldLoader);
  await Promise.resolve();
  store.reset();
  const newFlight = store.ensureLoaded(newLoader);
  await Promise.resolve();
  expect(oldLoader).toHaveBeenCalledTimes(1);
  expect(newLoader).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot().loading).toBe(true);

  if (order === "old-first") {
    finishOld(["stale tenant"]);
    await oldFlight;
    expect(store.getSnapshot().data).toEqual([]);
    expect(store.getSnapshot().initialized).toBe(false);
    expect(store.getSnapshot().loading).toBe(true);
    const unexpectedLoader = vi.fn(async () => ["unexpected duplicate"]);
    expect(store.ensureLoaded(unexpectedLoader)).toBe(newFlight);
    expect(unexpectedLoader).not.toHaveBeenCalled();
    finishNew(["fresh tenant"]);
    await newFlight;
  } else {
    finishNew(["fresh tenant"]);
    await newFlight;
    finishOld(["stale tenant"]);
    await oldFlight;
  }

  expect(store.getSnapshot().data).toEqual(["fresh tenant"]);
  expect(store.getSnapshot().initialized).toBe(true);
  expect(store.getSnapshot().loading).toBe(false);
  expect(store.getSnapshot().error).toBeNull();
  const afterCompletion = vi.fn(async () => ["unexpected reload"]);
  await store.ensureLoaded(afterCompletion);
  expect(afterCompletion).not.toHaveBeenCalled();
});

test("audit: anonymous redirect preserves encoded query and hash exactly", async () => {
  const initialPath = "/shopping-lists/abc?foo=%E9%A3%9F&next=%2Frecipes#section+2";
  function Login() {
    const location = useLocation();
    return <p data-testid="audit-redirect">{new URLSearchParams(location.search).get("redirect")}</p>;
  }
  render(<AuthSnapshotProvider snapshot={{ status: "unauthenticated" }}>
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AuthGuard />}>
          <Route path="/shopping-lists/:id" element={<p>Audit protected content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  </AuthSnapshotProvider>);
  expect((await screen.findByTestId("audit-redirect")).textContent).toBe(initialPath);
  expect(screen.queryByText("Audit protected content")).toBeNull();
});

test("audit: missing second-language string falls back to English and mounted consumers react", async () => {
  function Consumer() {
    const { t } = useLegacyI18n();
    return <output data-testid="audit-i18n">{t("general.create")}|{t("general.save")}</output>;
  }
  i18n.addResourceBundle("fr-FR", "translation", { general: { create: "AuditCréer" } }, true, true);
  try {
    await i18n.changeLanguage("en-US");
    render(<Consumer />);
    expect(screen.getByTestId("audit-i18n").textContent).toBe("Create|Save");
    await act(async () => { await i18n.changeLanguage("fr-FR"); });
    expect(screen.getByTestId("audit-i18n").textContent).toBe("AuditCréer|Save");
    await act(async () => { await i18n.changeLanguage("en-US"); });
    expect(screen.getByTestId("audit-i18n").textContent).toBe("Create|Save");
  } finally {
    await act(async () => { await i18n.changeLanguage("en-US"); });
    i18n.removeResourceBundle("fr-FR", "translation");
  }
});
