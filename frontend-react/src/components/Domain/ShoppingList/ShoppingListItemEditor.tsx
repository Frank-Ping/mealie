import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardActions } from "@mui/material";
import { useShoppingListItemEditor } from "@/composables/shopping-list-page/use-shopping-list-item-editor";
import type { ShoppingListItemOut } from "@/lib/api/types/household";
import type { MultiPurposeLabelOut } from "@/lib/api/types/labels";
import type { IngredientFood, IngredientUnit } from "@/lib/api/types/recipe";
import ShoppingListItemDetails from "./ShoppingListItemDetails";

interface Props {
  labels: unknown[];
  units: unknown[];
  foods: unknown[];
  allowDelete?: boolean;
}

export default function ShoppingListItemEditor({ labels, units, foods, allowDelete = true }: Props) {
  const { t } = useTranslation();

  // modelValue as reactive v-model
  const listItem = defineModel<ShoppingListItemOut>({ required: true });

  /* props via generated interface + destructured signature */

  // const emit = defineEmits<["save", "cancel", "delete"]>();
  defineEmits<{
    (e: "save" | "cancel" | "delete"): void;
  }>();

  const { createAssignFood } = useShoppingListItemEditor(listItem);

  /* WF4-REVIEW [J] */ watch(
    () => listItem.quantity,
    (newQty) => {
      if (!newQty) {
        listItem.quantity = 0;
      }
    },
  );

  /* WF4-REVIEW [J] */ watch(
    () => listItem.food,
    (newFood) => {
      listItem.label = newFood?.label || null;
      listItem.labelId = listItem.label?.id || null;
    },
  );

  const autoFocus = useMemo(() => (!listItem.food && listItem.note ? "note" : "food", []); // WF4-REVIEW: dependency array);

  return (
    <>
  <Card variant="elevated" className="pa-2" border="primary s-lg opacity-100">
    <div className="d-flex flex-column ga-3">
      {/* WF4-REVIEW: v-model on complex expression "listItem.food" [J]; v-model on complex expression "listItem.foodId!" [J] */}
      <InputLabelType {/* WF4-REVIEW: v-model listItem.food */} {/* WF4-REVIEW: v-model listItem.foodId! */} items={foods} label={t('shopping-list.food')} icon={$globals.icons.foods} autofocus={autoFocus === 'food'} create onCreate={createAssignFood} />
      <ShoppingListItemDetails value={listItem} onChange={/* WF4-REVIEW: setter */ setListItem} labels={labels} units={units} onSave={onSave?.()} />
    </div>
    <CardActions className="justify-end pa-0">
      <BaseButtonGroup buttons={[
          ...(allowDelete
            ? [
              {
                icon: $globals.icons.delete,
                text: t('general.delete'),
                event: 'delete',
              },
            ]
            : []),
          {
            icon: $globals.icons.close,
            text: t('general.cancel'),
            event: 'cancel',
          },
          {
            icon: $globals.icons.save,
            text: t('general.save'),
            event: 'save',
          },
        ]} onSave={onSave?.()} onCancel={onCancel?.()} onDelete={onDelete?.()} />
    </CardActions>
  </Card>
    </>
  );
}
