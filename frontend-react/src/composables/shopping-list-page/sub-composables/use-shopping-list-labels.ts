import { useMemo } from "react";
import type { ShoppingListOut } from "@/lib/api/types/household";
import type { MultiPurposeLabelSummary } from "@/lib/api/types/labels";

/**
 * Composable for managing shopping list label state and operations
 */
export function useShoppingListLabels(shoppingList: ShoppingListOut | null /* WF4-REVIEW: was Ref */) {
  const { t } = useI18n();

  const labelColorByName = useMemo(() =>  {
    return shoppingList?.listItems
      ?.map(({ label }, []); // WF4-REVIEW: dependency array => label as MultiPurposeLabelSummary)
      .filter(label => label)
      .reduce((acc, label) => ({
        ...acc,
        [label.name || t("shopping-list.no-label")]: label.color,
      }), {}) ?? {};
  });

  function getLabelColor(label: string) {
    return labelColorByName.value[label];
  }

  return {
    getLabelColor,
  };
}
