import { useState } from "react";
import { useUserApi } from "@/composables/api";
import type { Recipe } from "@/lib/api/types/recipe";

export const useRecipe = function (slug: string, eager = true) {
  const api = useUserApi();
  const [loading, setLoading] = useState(false);

  const [recipe, setRecipe] = useState(null);

  async function fetchRecipe() {
    setLoading(true);
    const { data } = await api.recipes.getOne(slug);
    setLoading(false);
    if (data) {
      setRecipe(data);
    }
  }

  async function deleteRecipe() {
    setLoading(true);
    const { data } = await api.recipes.deleteOne(slug);
    setLoading(false);
    return data;
  }

  async function updateRecipe(recipe: Recipe) {
    setLoading(true);
    const { data } = await api.recipes.updateOne(slug, recipe);
    setLoading(false);
    return data;
  }

  /* WF4-REVIEW [J] */ onMounted(() => {
    if (eager) {
      fetchRecipe();
    }
  });

  return {
    recipe,
    loading,
    fetchRecipe,
    deleteRecipe,
    updateRecipe,
  };
};
