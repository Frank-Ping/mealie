import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Box, TextField } from "@mui/material";
import { useShoppingListItemEditor } from "@/composables/shopping-list-page/use-shopping-list-item-editor";
import type { ShoppingListItemOut } from "@/lib/api/types/household";
import type { MultiPurposeLabelOut } from "@/lib/api/types/labels";
import type { IngredientUnit } from "@/lib/api/types/recipe";

interface Props {
  labels: unknown[];
  units: unknown[];
}

export default function ShoppingListItemDetails({ labels, units }: Props) {
  const { t } = useTranslation();

  // modelValue as reactive v-model
  const listItem = defineModel<ShoppingListItemOut>({ required: true });

  /* props via generated interface + destructured signature */

  const emit = defineEmits<{ (e: "save"): void }>();

  const { assignLabelToFood, createAssignUnit } = useShoppingListItemEditor(listItem);

  const { smAndDown } = useDisplay();
  const menuDirection = useMemo(() => smAndDown ? "top" : "bottom", []); // WF4-REVIEW: dependency array

  function handleNoteKeyPress(event: KeyboardEvent) {
    // Save on Enter
    if (!event.shiftKey && event.key === "Enter") {
      event.preventDefault();
      emit("save");
    }
  }

  return (
    <>
  <div className="d-flex ga-3">
    {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J]; v-model on complex expression "listItem.quantity" [J] */}
    <VNumberInput {/* WF4-REVIEW: v-model listItem.quantity */} hide-details label={t('form.quantity-label-abbreviated')} min={0} precision={null} style="flex: 5" inset />
    {/* WF4-REVIEW: v-model on complex expression "listItem.unit" [J]; v-model on complex expression "listItem.unitId!" [J] */}
    <InputLabelType {/* WF4-REVIEW: v-model listItem.unit */} {/* WF4-REVIEW: v-model listItem.unitId! */} items={units} label={t('recipe.unit')} icon={$globals.icons.units} menu-props={{ location: menuDirection }} style="flex: 7" create onCreate={createAssignUnit} />
  </div>
  {/* WF4-REVIEW: v-model on complex expression "listItem.note" [J] */}
  <TextField multiline {/* WF4-REVIEW: v-model listItem.note */} clearable hide-details label={t('shopping-list.note')} rows="1" auto-grow autocapitalize="none" onKeypress={handleNoteKeyPress} />
  <div className="d-flex flex-wrap align-end ga-3">
    {/* WF4-REVIEW: v-model on complex expression "listItem.label" [J]; v-model on complex expression "listItem.labelId!" [J] */}
    <InputLabelType {/* WF4-REVIEW: v-model listItem.label */} {/* WF4-REVIEW: v-model listItem.labelId! */} items={labels} label={t('shopping-list.label')} menu-props={{ location: menuDirection }} style="flex: 1 0 200px" />
    {(listItem.labelId && listItem.food && listItem.labelId !== listItem.food.labelId) ? (
      <BaseButton small color="info" icon={$globals.icons.tagArrowRight} text={t('shopping-list.save-label')} className="mt-2 align-items-flex-start" style="flex-grow: 0" onClick={assignLabelToFood} />
    ) : null}
    <Box sx={ flexGrow: 1 } />
  </div>
    </>
  );
}
