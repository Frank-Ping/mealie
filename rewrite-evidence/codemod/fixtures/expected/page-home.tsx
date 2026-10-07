// WF4-REFINED: human gate-2 polish — staleness guards, awaited helper call, effect deps
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api/client";
import useDefaultActivity from "@/composables/use-default-activity";
import { useUserActivityPreferences } from "@/composables/use-users/preferences";
import { useAsyncKey } from "@/composables/use-utils";
import type { AppInfo, AppStartupInfo } from "@/lib/api/types/admin";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  layout: "blank",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function HomePage() {
  const auth = useMealieAuth();
  // axios instance imported as module singleton (was useNuxtApp $axios)
  const navigate = useNavigate();
  const activityPreferences = useUserActivityPreferences();
  const { getDefaultActivityRoute } = useDefaultActivity();
  const groupSlug = auth.user?.groupSlug; // WF4-REFINED: auth port will expose plain values (the codemod deliberately keeps .value reads visible)

  async function redirectPublicUserToDefaultGroup(isStale: () => boolean) { // WF4-REFINED: staleness guard threaded from the effect
    const { data } = await apiClient.get<AppInfo>("/api/app/about");
    if (isStale()) return; // WF4-REFINED: a superseded effect run must not navigate
    if (data?.defaultGroupSlug) {
      navigate(`/g/${data.defaultGroupSlug}`);
    }
    else {
      navigate("/login");
    }
  }

  useEffect(() => {
    let cancelled = false;
    const isStale = () => cancelled; // WF4-REFINED: shared staleness check for this effect run
    void (async () => {
      try {
        if (groupSlug) {
            const data = await apiClient.get<AppStartupInfo>("/api/app/about/startup-info");
            if (cancelled) return;
            const isDemo = data.data.isDemo;
            const isFirstLogin = data.data.isFirstLogin;
            const defaultActivityRoute = getDefaultActivityRoute(
              activityPreferences.defaultActivity, // WF4-REFINED: prefs port will expose plain values
              groupSlug,
            );
            if (!isDemo && isFirstLogin && auth.user?.admin) { // WF4-REFINED: auth port will expose plain values
              navigate("/admin/setup");
            }
            else if (defaultActivityRoute) {
              navigate(defaultActivityRoute);
            }
            else {
              navigate(`/g/${groupSlug}`);
            }
          }
          else {
            await redirectPublicUserToDefaultGroup(isStale); // WF4-REFINED: await so request failures reach the catch; thread the guard
          }
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, [groupSlug]); // WF4-REFINED: re-run when auth resolves; the original useAsyncData did not watch auth either — confirm the trigger against the init flow

  return (
    <>
  <div />
    </>
  );
}
