import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RecipePage from "@/components/Domain/Recipe/RecipePage/RecipePage";
import { usePublicApi } from "@/composables/api/api-client";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  layout: "basic",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Id() {
  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const navigate = useNavigate();
  const recipeId = route.params.id as string;
  const api = usePublicApi();

  const [title, setTitle] = useState(route.meta?.title as string ?? "");
  useSeoMeta({
    title,
  });

  const { data: recipe } = await useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await api.shared.getShared(recipeId);
        if (cancelled) return;

          if (error) {
            console.error("error loading recipe -> ", error);
            navigate(`/g/${groupSlug}`);
          }

          if (data) {
            setTitle(data?.name || "");
          }

          return data;
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

  return (
    <>
  <div>
    <client-only>
      {(recipe) ? (
        <RecipePage value={recipe} onChange={/* WF4-REVIEW: setter */ setRecipe} />
      ) : null}
    </client-only>
  </div>
    </>
  );
}
