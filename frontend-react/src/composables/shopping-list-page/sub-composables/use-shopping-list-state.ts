import { useMemo, useState } from "react";
import type { ShoppingListOut, ShoppingListItemOut } from "@/lib/api/types/household";

/**
 * Composable for managing shopping list state and reactive data
 */
export function useShoppingListState() {
  const [shoppingList, setShoppingList] = useState(null);
  const [loadingCounter, setLoadingCounter] = useState(1);
  const [recipeReferenceLoading, setRecipeReferenceLoading] = useState(false);
  const [preserveItemOrder, setPreserveItemOrder] = useState(false);

  // UI state
  const [edit, setEdit] = useState(false);
  const [threeDot, setThreeDot] = useState(false);
  const [reorderLabelsDialog, setReorderLabelsDialog] = useState(false);
  const [createEditorOpen, setCreateEditorOpen] = useState(false);

  // Dialog states
  const state = /* WF4-REVIEW [J] */ reactive({
    checkAllDialog: false,
    uncheckAllDialog: false,
    deleteCheckedDialog: false,
  });

  // Hydrate listItems from shoppingList?.listItems
  const listItems = /* WF4-REVIEW [J] */ reactive({
    unchecked: [] as ShoppingListItemOut[],
    checked: [] as ShoppingListItemOut[],
  });

  function sortCheckedItems(a: ShoppingListItemOut, b: ShoppingListItemOut) {
    if (a.updatedAt! === b.updatedAt!) {
      return ((a.position || 0) > (b.position || 0)) ? -1 : 1;
    }
    return a.updatedAt! < b.updatedAt! ? 1 : -1;
  }

  /* WF4-REVIEW [J] */ watch(
    () => shoppingList?.listItems,
    (items) => {
      listItems.unchecked = (items?.filter(item => !item.checked) ?? []);
      listItems.checked = (items?.filter(item => item.checked)
        .sort(sortCheckedItems) ?? []);
    },
    { immediate: true },
  );

  const recipeMap = useMemo(() => new Map(
    (shoppingList?.recipeReferences?.map(ref => ref.recipe, []); // WF4-REVIEW: dependency array ?? [])
      .map(recipe => [recipe.id || "", recipe])),
  );

  const recipeList = useMemo(() => Array.from(recipeMap.values(, []); // WF4-REVIEW: dependency array));

  return {
    shoppingList,
    loadingCounter,
    recipeReferenceLoading,
    preserveItemOrder,
    edit,
    threeDot,
    reorderLabelsDialog,
    createEditorOpen,
    state,
    listItems,
    recipeMap,
    recipeList,
    sortCheckedItems,
  };
}
