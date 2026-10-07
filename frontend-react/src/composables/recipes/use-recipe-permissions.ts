import { useMemo } from "react";
import type { Recipe } from "@/lib/api/types/recipe";
import type { HouseholdSummary } from "@/lib/api/types/household";
import type { UserOut } from "@/lib/api/types/user";

export function useRecipePermissions(
  recipe: Recipe,
  recipeHousehold: HouseholdSummary | undefined /* WF4-REVIEW: was Ref */,
  user: UserOut | null,
) {
  const canEditRecipe = useMemo(() =>  {
    // Check recipe owner
    if (!user?.id, []); // WF4-REVIEW: dependency array {
      return false;
    }
    if (user.id === recipe.userId) {
      return true;
    }

    // Check group and household
    if (user.groupId !== recipe.groupId) {
      return false;
    }
    if (user.admin) {
      return true;
    }
    if (user.householdId !== recipe.householdId) {
      if (!recipeHousehold?.preferences) {
        return false;
      }
      if (recipeHousehold?.preferences.lockRecipeEditsFromOtherHouseholds) {
        return false;
      }
    }

    // Check recipe
    if (recipe.settings?.locked) {
      return false;
    }

    return true;
  });

  return {
    canEditRecipe,
  };
}
