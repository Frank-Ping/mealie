import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardActions, Drawer } from "@mui/material";
import { useShoppingListItemEditor } from "@/composables/shopping-list-page/use-shopping-list-item-editor";
import type { ShoppingListItemOut } from "@/lib/api/types/household";
import type { MultiPurposeLabelOut } from "@/lib/api/types/labels";
import type { IngredientFood, IngredientUnit } from "@/lib/api/types/recipe";
import ShoppingListItemDetails from "./ShoppingListItemDetails";
import { onClickOutside } from "@vueuse/core";

interface Props {
  labels: unknown[];
  units: unknown[];
  foods: unknown[];
}

export default function ShoppingListAddItemForm({ labels, units, foods }: Props) {
  const { t } = useTranslation();

  // modelValue as reactive v-model
  const listItem = defineModel<ShoppingListItemOut>({ required: true });

  /* props via generated interface + destructured signature */

  defineEmits<{
    (e: "save" | "cancel" | "delete"): void;
  }>();

  const { createAssignFood } = useShoppingListItemEditor(listItem);

  const { smAndDown } = useDisplay();
  const menuDirection = useMemo(() => smAndDown ? "top" : "bottom", []); // WF4-REVIEW: dependency array

  const foodInputRef = ref<{ focus: () => void } | null>(null);
  const [rail, setRail] = useState(true);

  async function expandAndFocus() {
    setRail(false);
    await /* WF4-REVIEW [J] */ nextTick();
    setTimeout(() => {
      foodInputRef?.focus();
    }, 200);
  }

  const [target, setTarget] = useState(undefined);
  // Autocomplete menus are teleported outside the drawer, so selecting an item
  // would otherwise register as an outside click and collapse the form
  onClickOutside(target, () => setRail(true, { ignore: [".v-overlay-container"] }));

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

  return (
    <>
  {/* WF4-REVIEW: persistent/temporary variants */}
  <Drawer ref="target" permanent rounded="t-xl" location="bottom" className="pa-4 pt-2 mb-0" width="300" rail-width="85" rail={rail} elevation="4">
    <div className="d-flex flex-column ga-3">
      <CardActions className="pa-0">
        <div className="position-relative" style="flex: 1;">
          {/* WF4-REVIEW: v-model on complex expression "listItem.food" [J]; v-model on complex expression "listItem.foodId!" [J] */}
          <InputLabelType ref="foodInputRef" {/* WF4-REVIEW: v-model listItem.food */} {/* WF4-REVIEW: v-model listItem.foodId! */} items={foods} label={rail ? t('shopping-list.add-item') : t('shopping-list.food')} icon={$globals.icons.foods} style={rail ? 'margin-inline: 3px;' : undefined} search={rail} menu-props={{ location: menuDirection }} create onCreate={createAssignFood} />
          {(rail) ? (
            <div className="position-absolute" style="inset: 0; cursor: text;" onClick={expandAndFocus} />
          ) : null}
        </div>
        {(!rail) ? (
          <BaseButtonGroup buttons={[
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
          ]} onSave={onSave?.()} onCancel={rail = true; onCancel?.()} />
        ) : null}
      </CardActions>
      {(!rail) ? (
        <ShoppingListItemDetails value={listItem} onChange={/* WF4-REVIEW: setter */ setListItem} labels={labels} units={units} onSave={onSave?.()} />
      ) : null}
    </div>
  </Drawer>
    </>
  );
}
