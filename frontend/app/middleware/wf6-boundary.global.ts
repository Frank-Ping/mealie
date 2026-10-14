import { ownsReact, type RouteMap } from "../../../wf6/route-policy.mjs";

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;
  // One shared route map and predicate govern both the gateway and Vue navigation.
  const map = await $fetch<RouteMap>("/_wf6/route-map.json");
  if (ownsReact(to.fullPath, map)) {
    window.location.assign(to.fullPath);
    return abortNavigation();
  }
});
