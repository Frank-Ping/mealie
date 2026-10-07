import { useState } from "react";
import type { ShoppingListOut, ShoppingListItemOut, ShoppingListMultiPurposeLabelOut } from "@/lib/api/types/household";
import { useUserApi } from "@/composables/api";
import { uuid4 } from "@/composables/use-utils";

/**
 * Composable for managing shopping list item CRUD operations
 */
export function useShoppingListCrud(
  shoppingList: ShoppingListOut | null /* WF4-REVIEW: was Ref */,
  loadingCounter: number /* WF4-REVIEW: was Ref */,
  listItems: { unchecked: ShoppingListItemOut[]; checked: ShoppingListItemOut[] },
  shoppingListItemActions: any,
  refresh: () => void,
  sortCheckedItems: (a: ShoppingListItemOut, b: ShoppingListItemOut) => number,
  updateListItemOrder: () => void,
) {
  const userApi = useUserApi();

  const [createListItemData, setCreateListItemData] = useState(listItemFactory());
  const [localLabels, setLocalLabels] = useState(undefined);

  function listItemFactory(): ShoppingListItemOut {
    return {
      id: uuid4(),
      shoppingListId: shoppingList?.id || "",
      checked: false,
      position: shoppingList?.listItems?.length || 1,
      quantity: 0,
      note: "",
      labelId: undefined,
      unitId: undefined,
      foodId: undefined,
    } as ShoppingListItemOut;
  }

  // Check/Uncheck All operations
  function checkAllItems() {
    let hasChanged = false;
    shoppingList?.listItems?.forEach((item) => {
      if (!item.checked) {
        hasChanged = true;
        item.checked = true;
      }
    });
    if (hasChanged) {
      updateUncheckedListItems();
    }
  }

  function uncheckAllItems() {
    let hasChanged = false;
    shoppingList?.listItems?.forEach((item) => {
      if (item.checked) {
        hasChanged = true;
        item.checked = false;
      }
    });
    if (hasChanged) {
      listItems.unchecked = [...listItems.unchecked, ...listItems.checked];
      listItems.checked = [];
      updateUncheckedListItems();
    }
  }

  function deleteCheckedItems() {
    const checked = shoppingList?.listItems?.filter(item => item.checked);

    if (!checked || checked?.length === 0) {
      return;
    }

    loadingCounter += 1;
    deleteListItems(checked);
    loadingCounter -= 1;
    refresh();
  }

  function saveListItem(item: ShoppingListItemOut) {
    if (!shoppingList) {
      return;
    }

    // set a temporary updatedAt timestamp prior to refresh so it appears at the top of the checked items
    item.updatedAt = new Date().toISOString();

    // make updates reflect immediately
    if (shoppingList.listItems) {
      shoppingList.listItems.forEach((oldListItem: ShoppingListItemOut, idx: number) => {
        if (oldListItem.id === item.id && shoppingList?.listItems) {
          shoppingList.listItems[idx] = item;
        }
      });
      // Immediately update checked/unchecked arrays for UI
      listItems.unchecked = shoppingList.listItems.filter(i => !i.checked);
      listItems.checked = shoppingList.listItems.filter(i => i.checked)
        .sort(sortCheckedItems);
    }

    shoppingListItemActions.updateItem(item);
    updateListItemOrder();
  }

  function deleteListItem(item: ShoppingListItemOut) {
    if (!shoppingList) {
      return;
    }

    shoppingListItemActions.deleteItem(item);

    // remove the item from the list immediately so the user sees the change
    if (shoppingList.listItems) {
      shoppingList.listItems = shoppingList.listItems.filter(itm => itm.id !== item.id);
    }

    refresh();
  }

  function deleteListItems(items: ShoppingListItemOut[]) {
    if (!shoppingList) {
      return;
    }

    items.forEach((item) => {
      shoppingListItemActions.deleteItem(item);
    });
    // remove the items from the list immediately so the user sees the change
    if (shoppingList?.listItems) {
      const deletedItems = new Set(items.map(item => item.id));
      shoppingList.listItems = shoppingList.listItems.filter(itm => !deletedItems.has(itm.id));
    }

    refresh();
  }

  function createListItem() {
    if (!shoppingList) {
      return;
    }

    if (!createListItemData.foodId && !createListItemData.note) {
      // don't create an empty item
      return;
    }

    loadingCounter += 1;

    // ensure list id is set to the current list, which may not have loaded yet in the factory
    createListItemData.shoppingListId = shoppingList.id;

    // ensure item is inserted into the end of the list, which may have been updated
    createListItemData.position = shoppingList?.listItems?.length
      ? (shoppingList.listItems
          .map(({ position }) => position || 0)
          .reduce((a, b) => Math.max(a, b))) + 1
      : 0;

    createListItemData.createdAt = new Date().toISOString();
    createListItemData.updatedAt = createListItemData.createdAt;

    updateListItemOrder();

    shoppingListItemActions.createItem(createListItemData);
    loadingCounter -= 1;

    if (shoppingList.listItems) {
      // add the item to the list immediately so the user sees the change
      shoppingList.listItems.push(createListItemData);
      updateListItemOrder();
    }
    setCreateListItemData(listItemFactory());
    refresh();
  }

  function updateUncheckedListItems() {
    if (!shoppingList?.listItems) {
      return;
    }

    // Set position for unchecked items
    listItems.unchecked.forEach((item: ShoppingListItemOut, idx: number) => {
      item.position = idx;
      shoppingListItemActions.updateItem(item);
    });

    refresh();
  }

  // Label management
  function updateLabelOrder(labelSettings: ShoppingListMultiPurposeLabelOut[]) {
    if (!shoppingList) {
      return;
    }

    labelSettings.forEach((labelSetting, index) => {
      labelSetting.position = index;
      return labelSetting;
    });

    setLocalLabels(labelSettings);
  }

  function cancelLabelOrder() {
    loadingCounter -= 1;
    if (!shoppingList) {
      return;
    }
    // restore original state
    setLocalLabels(shoppingList.labelSettings);
  }

  async function saveLabelOrder(updateItemsByLabel: () => void) {
    if (!shoppingList || !localLabels || (setLocalLabels(== shoppingList.labelSettings)) {
      return);
    }

    loadingCounter += 1;
    const { data } = await userApi.shopping.lists.updateLabelSettings(shoppingList.id, localLabels);
    loadingCounter -= 1;

    if (data) {
      // update shoppingList labels using the API response
      shoppingList.labelSettings = (data as ShoppingListOut).labelSettings;
      updateItemsByLabel();
    }
  }

  function toggleReorderLabelsDialog(reorderLabelsDialog: boolean /* WF4-REVIEW: was Ref */) {
    // stop polling and populate localLabels
    loadingCounter += 1;
    reorderLabelsDialog = !reorderLabelsDialog;
    setLocalLabels(shoppingList?.labelSettings);
  }

  return {
    createListItemData,
    localLabels,
    listItemFactory,
    checkAllItems,
    uncheckAllItems,
    deleteCheckedItems,
    saveListItem,
    deleteListItem,
    deleteListItems,
    createListItem,
    updateUncheckedListItems,
    updateLabelOrder,
    cancelLabelOrder,
    saveLabelOrder,
    toggleReorderLabelsDialog,
  };
}
