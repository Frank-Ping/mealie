import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { whenever } from "@vueuse/core";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { useAsyncKey } from "@/composables/use-utils";
import RecipePage from "@/components/Domain/Recipe/RecipePage/RecipePage";
import { usePublicExploreApi } from "@/composables/api/api-client";
import { useRecipe } from "@/composables/recipes";
import type { Recipe } from "@/lib/api/types/recipe";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function SlugPage() {
  const auth = useMealieAuth();
  const { isOwnGroup } = useLoggedInState();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const [title, setTitle] = useState(route.meta?.title as string || "");
  useSeoMeta({ title });

  const navigate = useNavigate();
  const slug = route.params.slug as string;

  const [recipe, setRecipe] = useState(null);
  function loadRecipe() {
    const { recipe: data } = useRecipe(slug);
    /* WF4-REVIEW [J] */ watch(data, (value) => {
      setRecipe(value);
    });
  }

  async function loadPublicRecipe() {
    const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
    const api = usePublicExploreApi(groupSlug);
    const { data } = await useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await api.explore.recipes.getOne(slug);
        if (cancelled) return;
            if (error) {
              console.error("error loading recipe -> ", error);
              navigate({ path: `/g/${groupSlug}`, query: { redirect: route.fullPath }
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow
      }

      return data;
    });
    setRecipe(data);
  }

  if (isOwnGroup) {
    loadRecipe();
  }
  else {
    /* WF4-REVIEW [J] */ onMounted(loadPublicRecipe);
  }

  whenever(
    () => recipe,
    () => {
      if (recipe && recipe.name) {
        setTitle(recipe.name);
      }
    },
  );

  return (
    <>
  <div>
    {(recipe) ? (
      <RecipePage value={recipe} onChange={setRecipe} />
    ) : null}
  </div>
    </>
  );
}
