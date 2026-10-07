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
  const groupSlug = auth.user.value?.groupSlug; // was computed — plain read stays reactive

  async function redirectPublicUserToDefaultGroup() {
    const { data } = await apiClient.get<AppInfo>("/api/app/about");
    if (data?.defaultGroupSlug) {
      navigate(`/g/${data.defaultGroupSlug}`);
    }
    else {
      navigate("/login");
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (groupSlug) {
            const data = await apiClient.get<AppStartupInfo>("/api/app/about/startup-info");
            if (cancelled) return;
            const isDemo = data.data.isDemo;
            const isFirstLogin = data.data.isFirstLogin;
            const defaultActivityRoute = getDefaultActivityRoute(
              activityPreferences.value.defaultActivity,
              groupSlug,
            );
            if (!isDemo && isFirstLogin && auth.user.value?.admin) {
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
            redirectPublicUserToDefaultGroup();
          }
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

  return (
    <>
  <div />
    </>
  );
}
