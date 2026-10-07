import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormControlLabel, List, ListItem, ListItemText } from "@mui/material";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { usePageState, usePageUser } from "@/composables/recipe-page/shared-state";
import { useToolStore } from "@/composables/store";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { Recipe, RecipeTool } from "@/lib/api/types/recipe";
import RecipeIngredients from "@/components/Domain/Recipe/RecipeIngredients";

interface Props {
  recipe: NoUndefinedField<Recipe>;
  scale: number;
  isCookMode?: boolean;
  ingredientStorageKey?: string;
}

export default function RecipePageIngredientToolsView({ isCookMode = false, ingredientStorageKey = undefined }: Props) {
  const { t } = useTranslation();

  interface RecipeToolWithOnHand extends RecipeTool {
    onHand: boolean;
  }


  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const { isOwnGroup } = useLoggedInState();

  const toolStore = isOwnGroup ? useToolStore() : null;
  const { user } = usePageUser();
  const { isEditMode } = usePageState(recipe.slug);

  const [recipeTools, setRecipeTools] = useState([]);
  /* WF4-REVIEW [J] */ watch(() => recipe.tools, () => {
    if (!(user.householdSlug && toolStore)) {
      setRecipeTools(recipe.tools.map(tool => ({ ...tool, onHand: false }) as RecipeToolWithOnHand));
    }
    else {
      setRecipeTools(recipe.tools.map((tool) => {
        const onHand = tool.householdsWithTool?.includes(user.householdSlug) || false);
        return { ...tool, onHand } as RecipeToolWithOnHand;
      });
    }
  }, { immediate: true });

  function updateTool(index: number) {
    if (user.id && user.householdSlug && toolStore) {
      const tool = recipeTools[index];
      if (tool.onHand && !tool.householdsWithTool?.includes(user.householdSlug)) {
        if (!tool.householdsWithTool) {
          tool.householdsWithTool = [user.householdSlug];
        }
        else {
          tool.householdsWithTool.push(user.householdSlug);
        }
      }
      else if (!tool.onHand && tool.householdsWithTool?.includes(user.householdSlug)) {
        tool.householdsWithTool = tool.householdsWithTool.filter(household => household !== user.householdSlug);
      }

      toolStore.actions.updateOne(tool);
    }
    else {
      console.log("no user, skipping server update");
    }
  }

  return (
    <>
  <div>
    <RecipeIngredients value={recipe.recipeIngredient} scale={scale} is-cook-mode={isCookMode} storage-key={ingredientStorageKey} />
    {(!isEditMode && recipe.tools && recipe.tools.length > 0) ? (
      <div>
        <h2 className="mt-4 text-h5 font-weight-medium opacity-80">
          {t('tool.required-tools')}
        </h2>
        <List density="compact">
          {recipe.tools.map((tool, index) => (
            /* WF4-REVIEW: @click → ListItemButton */
            <ListItem key={index} density="compact" className="px-1">
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "recipeTools[index].onHand" [J] */}
                <FormControlLabel hide-details className="pt-0 py-auto" color="secondary" density="compact" onChange={updateTool(index)} />
              </>
              {/* WF4-REVIEW: content → primary prop */}
              <ListItemText>
                {tool.name}
              </ListItemText>
            </ListItem>
          ))}
        </List>
      </div>
    ) : null}
  </div>
    </>
  );
}
