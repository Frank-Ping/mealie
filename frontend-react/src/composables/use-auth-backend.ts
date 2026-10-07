import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api/client";
import type { UserOut } from "@/lib/api/types/user";
import { clearAllStores } from "@/composables/store";
import { clearComposableCaches } from "@/composables/use-clear-composable-caches";
import { getTokenCookieOptions, getTokenExpiry, nextRefreshDelay, readTokenCookie } from "@/composables/use-token-cookie";

interface AuthData {
  value: UserOut | null;
}

interface AuthStatus {
  value: "loading" | "authenticated" | "unauthenticated";
}

interface AuthState {
  data: AuthData;
  status: AuthStatus;
  token: { readonly value: string | null | undefined };
  signIn: (credentials: FormData, options?: { redirect?: boolean }) => Promise<void>;
  signOut: (callbackUrl?: string) => Promise<void>;
  refresh: () => Promise<void>;
  getSession: () => Promise<void>;
  setToken: (token: string | null) => void;
  /** Hydrates the token from the cookie and starts the refresh loop. Called once, by the auth plugin. */
  initTokenRefresh: () => void;
}

/** Retry a refresh that failed for reasons other than auth (offline, server hiccup). */
const REFRESH_RETRY_DELAY_MS = 60_000;
/** Cap those retries, so a persistent server error doesn't become a poll for the life of the tab. */
const MAX_REFRESH_RETRIES = 5;

const [authUser, setAuthUser] = useState(null);
const [authStatus, setAuthStatus] = useState("loading");

// The cookie persists the token; this ref is the reactive view of it. Keeping a plain ref as the
// source of truth means writes are visible synchronously, which the cookie ref can't guarantee — it
// propagates between tabs over a BroadcastChannel, and those messages arrive a tick later.
const [accessToken, setAccessToken] = useState(null);

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refreshInFlight: Promise<void> | null = null;
let refreshRetries = 0;

export function resetAuth() {
  setAuthUser(null);
  setAuthStatus("unauthenticated");
}

export const useAuthBackend = function (): AuthState {
  // axios instance imported as module singleton (was useNuxtApp $axios)
  const navigate = useNavigate();

  const runtimeConfig = useRuntimeConfig();
  const tokenName = runtimeConfig.public.AUTH_TOKEN;

  function clearScheduledRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  }

  /**
   * Queues the next refresh from the token's own expiry.
   *
   * Recomputing from the remaining time (rather than a fixed interval) means this self-corrects
   * after the machine sleeps or the tab is backgrounded and the timer fires late.
   */
  function scheduleTokenRefresh(token: string | null) {
    clearScheduledRefresh();
    if (!token) {
      return;
    }

    const expiresAt = getTokenExpiry(token);
    if (expiresAt === null) {
      return;
    }

    const delay = nextRefreshDelay(expiresAt - Date.now());
    if (delay === null) {
      return;
    }

    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      void refreshQuietly();
    }, delay);
  }

  function setToken(token: string | null) {
    if (!token) {
      setAccessToken(null);
      clearScheduledRefresh();
      useCookie(tokenName, getTokenCookieOptions()) = null;
      return;
    }

    // Only the in-memory copy is set here. The cookie arrives on the response's Set-Cookie header —
    // writing it again from script would re-apply Safari's seven-day cap to a cookie the server just
    // set correctly, which is the bug this whole arrangement exists to avoid.
    setAccessToken(token);
    scheduleTokenRefresh(token);
  }

  function handleAuthError(error: any, redirect = false) {
    // Only clear token on auth errors, not network errors
    if (error?.response?.status === 401) {
      setToken(null);
      resetAuth();
      if (redirect) {
        navigate("/login");
      }
    }
  }

  async function getSession(): Promise<void> {
    if (!accessToken) {
      setAuthUser(null);
      setAuthStatus("unauthenticated");
      return;
    }

    setAuthStatus("loading");
    try {
      const { data } = await apiClient.get<UserOut>("/api/users/self");
      setAuthUser(data);
      setAuthStatus("authenticated");
    }
    catch (error: any) {
      console.error("Failed to fetch user session:", error);
      handleAuthError(error);
      setAuthStatus("unauthenticated");
    }
  }

  async function signIn(credentials: FormData): Promise<void> {
    setAuthStatus("loading");

    try {
      const response = await apiClient.post("/api/auth/token", credentials, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setToken(response.data.access_token);
      await getSession();
    }
    catch (error) {
      setAuthStatus("unauthenticated");
      throw error;
    }
  }

  async function signOut(callbackUrl: string = ""): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout");
    }
    catch (error) {
      // Continue with logout even if API call fails
      console.warn("Logout API call failed:", error);
    }
    finally {
      setToken(null);
      resetAuth();

      // Clear all cached store data to prevent data leakage between users
      clearAllStores();

      // Clear cached composable refs to prevent data leakage between users
      clearComposableCaches();

      // Clear Nuxt's useAsyncData cache
      clearNuxtData();

      await navigate(callbackUrl || "/login");
    }
  }

  /**
   * Trades the current token for a fresh one, and nothing else.
   *
   * Concurrent callers share a single request — a page load can easily fire several 401s at once,
   * and each one retrying separately would stampede the endpoint and race over the cookie.
   *
   * It used to reload the user too, which is why callers reached for it when they wanted fresh
   * session data. That request goes through the same intercepted axios instance, so a 401 on it sent
   * the interceptor straight back into refresh() and restarted the cycle. Reloading the user is
   * getSession's job.
   */
  async function refresh(): Promise<void> {
    // The cookie is the real credential — the interceptor gates on it, and it is populated before
    // initTokenRefresh() hydrates the ref. Gating only on the ref would make refresh a silent no-op
    // during boot, turning a recoverable 401 into a logout.
    if (!accessToken && !readTokenCookie(tokenName)) return;
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      try {
        const response = await apiClient.post("/api/auth/refresh", null, { suppressAlert: true });
        setToken(response.data.access_token);
      }
      catch (error: any) {
        handleAuthError(error, true);
        throw error;
      }
      finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  }

  /** A background refresh, where there is no caller to surface a failure to. */
  async function refreshQuietly(): Promise<void> {
    try {
      await refresh();
      refreshRetries = 0;
    }
    catch (error: any) {
      // A 401 has already cleared the session and redirected. Anything else — offline, a restarting
      // backend — is transient, so try again rather than letting the session lapse over a blip.
      if (error?.response?.status === 401 || !accessToken) {
        return;
      }
      if (refreshRetries >= MAX_REFRESH_RETRIES) {
        return;
      }

      // Backing off, because a 500 that isn't going away shouldn't be retried at the same rate as a
      // dropped connection. Attempts stop well before the token would have expired anyway.
      refreshRetries += 1;
      clearScheduledRefresh();
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        void refreshQuietly();
      }, REFRESH_RETRY_DELAY_MS * refreshRetries);
    }
  }

  /**
   * Starts keeping the session alive. Called once, from the auth plugin.
   *
   * Timers alone aren't enough: they don't run while the device sleeps, and a laptop reopened after
   * a day would otherwise come back to an expired token. Re-scheduling on focus, visibility and
   * reconnect recomputes the delay against the real clock without costing a request.
   */
  function initTokenRefresh() {
    setAccessToken(readTokenCookie(tokenName));

    // Read-only, and deliberately without a max-age: a ref carrying one starts an expiry timer that
    // clears the cookie when it elapses, which would cut a 14-day remembered session down to
    // TOKEN_TIME. This ref exists only to observe, never to write.
    const tokenCookie = useCookie<string | null>(tokenName, { readonly: true });

    // Nuxt syncs cookie refs between tabs, so this also picks up a refresh performed elsewhere and
    // re-schedules against the new expiry instead of duplicating the work.
    /* WF4-REVIEW [J] */ watch(tokenCookie, (value) => {
      if (!value) {
        // Signed out in another tab. Drop this tab's session too, instead of holding a stale token
        // and a live refresh timer while still rendering as authenticated.
        //
        // Cleared by hand rather than through setToken(null): that writes the cookie, which
        // broadcasts, which lands back here — a loop between tabs.
        setAccessToken(null);
        clearScheduledRefresh();
        resetAuth();
        return;
      }

      if (value !== accessToken) {
        setAccessToken(value);
        scheduleTokenRefresh(value);
      }
    });

    const reschedule = () => {
      // The user is back, so give a session that exhausted its retries another chance
      refreshRetries = 0;
      scheduleTokenRefresh(accessToken);
    };

    window.addEventListener("focus", reschedule);
    window.addEventListener("online", reschedule);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        reschedule();
      }
    });

    scheduleTokenRefresh(accessToken);
  }

  return {
    data: computed(() => authUser),
    status: computed(() => authStatus),
    token: computed(() => accessToken),
    signIn,
    signOut,
    refresh,
    getSession,
    setToken,
    initTokenRefresh,
  };
};
