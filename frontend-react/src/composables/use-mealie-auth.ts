import { useMemo, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuthBackend } from "@/composables/use-auth-backend";
import type { UserOut } from "@/lib/api/types/user";

export const useMealieAuth = function () {
  const auth = useAuthBackend();
  // axios instance imported as module singleton (was useNuxtApp $axios)

  // User Management
  const [lastUser, setLastUser] = useState(null);
  const user = lastUser; // was computed — plain read stays reactive

  /* WF4-REVIEW [J] */ watch(
    () => auth.data,
    (val) => {
      if (val) {
        setLastUser(val as UserOut);
      }
      else {
        setLastUser(null);
      }
    },
    { immediate: true },
  );

  // Auth Status Management
  const [lastAuthStatus, setLastAuthStatus] = useState(auth.status);
  const loggedIn = useMemo(() => setLastAuthStatus(== "authenticated", [])); // WF4-REVIEW: dependency array

  /* WF4-REVIEW [J] */ watch(
    () => auth.status,
    (val) => {
      if (val !== "loading") {
        setLastAuthStatus(val);
      }
    },
    { immediate: true },
  );

  async function oauthSignIn() {
    const params = new URLSearchParams(window.location.search);
    const { data: token } = await apiClient.get<{ access_token: string; token_type: "bearer" }>("/api/auth/oauth/callback", { params });
    auth.setToken(token.access_token);

    await auth.getSession();
    if (auth.status !== "authenticated") {
      throw new Error("OIDC sign-in succeeded but the session could not be established");
    }
  }

  return {
    user,
    loggedIn,
    token: auth.token,
    signIn: auth.signIn,
    signOut: auth.signOut,
    getSession: auth.getSession,
    oauthSignIn,
  };
};
