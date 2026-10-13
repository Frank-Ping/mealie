import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { AuthSnapshotProvider, AuthGuard, PermissionGuard, type AuthSnapshot } from "../src/infra/guards";

function Login() { const location = useLocation(); return <p>redirect:{new URLSearchParams(location.search).get("redirect")}</p>; }
function renderGuard(snapshot: AuthSnapshot, path = "/g/own/private?foo=bar#section", adminOnly = false, groupOnly = false) {
  return render(<AuthSnapshotProvider snapshot={snapshot}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/" element={<p>Home</p>} /><Route path="/login" element={<Login />} />
    <Route element={<AuthGuard />}><Route element={<PermissionGuard adminOnly={adminOnly} groupOnly={groupOnly} />}>
      <Route path="/g/:groupSlug/private" element={<p>Protected</p>} />
      <Route path="/shopping-lists/:id" element={<p>Protected</p>} />
    </Route></Route>
  </Routes></MemoryRouter></AuthSnapshotProvider>);
}
test("source auth expectation: logged out deep link preserves fullPath", async () => {
  renderGuard({ status: "unauthenticated" }, "/shopping-lists/abc?foo=bar");
  expect(await screen.findByText("redirect:/shopping-lists/abc?foo=bar")).toBeTruthy();
  expect(screen.queryByText("Protected")).toBeNull();
});
test("source auth expectation: logged in allowed", () => {
  renderGuard({ status: "authenticated", user: { groupSlug: "own", admin: false } }, "/shopping-lists/abc");
  expect(screen.getByText("Protected")).toBeTruthy();
});
test("pending auth never renders protected content", () => {
  renderGuard({ status: "loading" });
  expect(screen.getByRole("status").textContent).toBe("Loading session");
  expect(screen.queryByText("Protected")).toBeNull();
});
test("admin and actual group membership conditions are not conflated", async () => {
  renderGuard({ status: "authenticated", user: { groupSlug: "own", admin: false } }, undefined, true);
  expect(await screen.findByText("Home")).toBeTruthy();
});
test("group-only rejects another group even for admin", async () => {
  renderGuard({ status: "authenticated", user: { groupSlug: "other", admin: true } }, undefined, false, true);
  expect(await screen.findByText("Home")).toBeTruthy();
});
