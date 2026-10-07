import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ShoppingListOut } from "@/lib/api/types/household";
import type { MultiPurposeLabelSummary } from "@/lib/api/types/labels";

/**
 * Composable for managing shopping list label state and operations
 */
export function useShoppingListLabels(shoppingList: ShoppingListOut | null /* WF4-REVIEW: was Ref */) {
  const { t } = useTranslation(); // WF4-REVIEW: d/n/locale mapping [S]

  const labelColorByName = useMemo(() => {
    return shoppingList?.listItems
      ?.map(({ label }) => label as MultiPurposeLabelSummary)
      .filter(label => label)
      .reduce((acc, label) => ({
        ...acc,
        [label.name || t("shopping-list.no-label")]: label.color,
      }), {}) ?? {};
  }, []); // WF4-REVIEW: dependency array

  function getLabelColor(label: string) {
    return labelColorByName.value[label];
  }

  return {
    getLabelColor,
  };
}
