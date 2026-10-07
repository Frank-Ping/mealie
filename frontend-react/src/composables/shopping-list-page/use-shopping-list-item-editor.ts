import type { ShoppingListItemOut, IngredientFood } from "@/lib/api/types/household";
import { useFoodData, useFoodStore, useUnitData, useUnitStore } from "../store";

export function useShoppingListItemEditor(listItem: ModelRef<ShoppingListItemOut, string, ShoppingListItemOut, ShoppingListItemOut>) {
  const foodStore = useFoodStore();
  const foodData = useFoodData();

  const unitStore = useUnitStore();
  const unitData = useUnitData();

  async function createAssignFood(val: string) {
    // keep UI reactive
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    listItem.food ? (listItem.food.name = val) : (listItem.food = { name: val } as any);

    foodData.data.name = val;
    const newFood = await foodStore.actions.createOne(foodData.data);
    if (newFood) {
      listItem.food = newFood;
      listItem.foodId = newFood.id;
    }
    foodData.reset();
  }

  async function createAssignUnit(val: string) {
    // keep UI reactive
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    listItem.unit ? (listItem.unit.name = val) : (listItem.unit = { name: val } as any);

    unitData.data.name = val;
    const newUnit = await unitStore.actions.createOne(unitData.data);
    if (newUnit) {
      listItem.unit = newUnit;
      listItem.unitId = newUnit.id;
    }
    unitData.reset();
  }

  async function assignLabelToFood() {
    if (!(listItem.food && listItem.foodId && listItem.labelId)) {
      return;
    }

    listItem.food.labelId = listItem.labelId;
    await foodStore.actions.updateOne(listItem.food as IngredientFood);
  }

  return {
    assignLabelToFood,
    createAssignFood,
    createAssignUnit,
  };
}
