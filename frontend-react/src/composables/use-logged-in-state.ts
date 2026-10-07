import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const useLoggedInState = function () {
  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]

  const loggedIn = auth.loggedIn; // was computed — plain read stays reactive
  const isOwnGroup = useMemo(() =>  {
    if (!route.params.groupSlug, []); // WF4-REVIEW: dependency array {
      return loggedIn;
    }
    else {
      return loggedIn && auth.user?.groupSlug === route.params.groupSlug;
    }
  });

  return { loggedIn, isOwnGroup };
};
