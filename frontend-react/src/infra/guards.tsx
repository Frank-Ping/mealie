import { createContext, useContext, type ReactNode } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router";

export type AuthSnapshot = { status: "loading" } | { status: "unauthenticated" } |
  { status: "authenticated"; user: { groupSlug: string; admin: boolean } };
const AuthContext = createContext<AuthSnapshot | null>(null);
export function AuthSnapshotProvider({ snapshot, children }: { snapshot: AuthSnapshot; children: ReactNode }) {
  return <AuthContext.Provider value={snapshot}>{children}</AuthContext.Provider>;
}
// Provider must receive a verified auth service snapshot. No cookie/JWT shortcut.
function useVerifiedAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("R28: verified session service required");
  return auth;
}
export function AuthGuard() {
  const auth = useVerifiedAuth();
  const location = useLocation();
  if (auth.status === "loading") return <p role="status">Loading session</p>;
  if (auth.status === "unauthenticated") {
    const fullPath = location.pathname + location.search + location.hash;
    const query = new URLSearchParams({ redirect: fullPath });
    return <Navigate to={`/login?${query}`} />;
  }
  return <Outlet />;
}
export function PermissionGuard({ adminOnly = false, groupOnly = false }: { adminOnly?: boolean; groupOnly?: boolean }) {
  const auth = useVerifiedAuth();
  const params = useParams();
  if (auth.status === "loading") return <p role="status">Loading session</p>;
  if (auth.status !== "authenticated" || adminOnly && !auth.user.admin || groupOnly && params.groupSlug !== auth.user.groupSlug) {
    return <Navigate to="/" />;
  }
  return <Outlet />;
}
