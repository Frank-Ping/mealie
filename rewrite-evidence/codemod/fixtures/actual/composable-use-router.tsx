import { useLocation, useNavigate } from "react-router-dom";

export function useRouterQuery(query: string) {
  const router = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  // TODO FUTURE: Remove when migrating to Vue 3

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const param: string /* WF4-REVIEW: was WritableComputedRef */ = computed({
    get(): string {
      console.log("Get Query Change");
      return router?.query[query] as string || "";
    },
    set(v: string): void {
      router.query[query] = v;
    },
  });

  return param;
}

export function useRouteQuery<T extends string | string[]>(name: string, defaultValue?: T) {
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const navigate = useNavigate();

  return computed<any>({
    get() {
      const data = route.query[name];
      if (data == null) return defaultValue ?? null;
      return data;
    },
    set(v) {
      /* WF4-REVIEW [J] */ /* WF4-REVIEW [J] */ nextTick(() => {
        navigate(/* WF4-REVIEW: replace+query */ { query: { ...route.query, [name]: v } });
      });
    },
  });
}
