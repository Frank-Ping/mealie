import { createContext, useContext, type ReactNode } from "react";

// A typed integration port, not a replacement auth/HTTP implementation.
export interface UserApiPort { utils: { download(url: string): unknown } }
const UserApiContext = createContext<UserApiPort | null>(null);
export function UserApiProvider({ api, children }: { api: UserApiPort; children: ReactNode }) {
  return <UserApiContext.Provider value={api}>{children}</UserApiContext.Provider>;
}
export function useUserApi(): UserApiPort {
  const api = useContext(UserApiContext);
  if (!api) throw new Error("R29: verified UserApi transport required; no default or fake API supplied");
  return api;
}
