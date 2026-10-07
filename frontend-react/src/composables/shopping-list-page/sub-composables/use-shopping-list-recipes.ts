import type { ShoppingListOut } from "@/lib/api/types/household";
import { useUserApi } from "@/composables/api";

/**
 * Composable for managing shopping list recipe references
 */
export function useShoppingListRecipes(
  shoppingList: ShoppingListOut | null /* WF4-REVIEW: was Ref */,
  loadingCounter: number /* WF4-REVIEW: was Ref */,
  recipeReferenceLoading: boolean /* WF4-REVIEW: was Ref */,
  refresh: () => void,
) {
  const userApi = useUserApi();

  async function addRecipeReferenceToList(recipeId: string) {
    if (!shoppingList || recipeReferenceLoading) {
      return;
    }

    loadingCounter += 1;
    recipeReferenceLoading = true;
    const { data } = await userApi.shopping.lists.addRecipes(shoppingList.id, [{ recipeId }]);
    recipeReferenceLoading = false;
    loadingCounter -= 1;

    if (data) {
      refresh();
    }
  }

  async function removeRecipeReferenceToList(recipeId: string) {
    if (!shoppingList || recipeReferenceLoading) {
      return;
    }

    loadingCounter += 1;
    recipeReferenceLoading = true;
    const { data } = await userApi.shopping.lists.removeRecipe(shoppingList.id, recipeId);
    recipeReferenceLoading = false;
    loadingCounter -= 1;

    if (data) {
      refresh();
    }
  }

  return {
    addRecipeReferenceToList,
    removeRecipeReferenceToList,
  };
}
