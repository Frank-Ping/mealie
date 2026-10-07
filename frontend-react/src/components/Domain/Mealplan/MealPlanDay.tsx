import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { icons } from "@/lib/icons";
import { format } from "date-fns";
import { useUserApi } from "@/composables/api";
import { useAddToShoppingListDialog } from "@/composables/shopping-list-page/use-add-to-shopping-list-dialog";
import type { PlanEntryType, ReadPlanEntry } from "@/lib/api/types/meal-plan";
import type { Recipe } from "@/lib/api/types/recipe";

interface Props {
  recipes?: Recipe[];
  day: Date;
  actions: ReturnType<typeof useMealplans>["actions"];
  inlineActions?: boolean;
}

export default function MealPlanDay({ recipes = [], meal = ({ }: Props) {
  const { t } = useTranslation();

  const { open: shoppingListDialog, shoppingLists, addAllLoading, addAllToList } = useAddToShoppingListDialog();
  // icons imported directly (was $globals)
  const i18n = useI18n();
  const api = useUserApi();
  /* props via destructured signature (was withDefaults(defineProps<Props>) */,
  });

  const commonButtons = [
    {
      icon: icons.createAlt,
      text: i18n.t("general.new"),
      event: "create",
    },
    {
      icon: icons.potSteam,
      text: i18n.t("meal-plan.random-dinner"),
      event: "randomDinner",
    },
    {
      icon: icons.bowlMixOutline,
      text: i18n.t("meal-plan.random-side"),
      event: "randomSide",
    },
  ];
  const randomButtons = [
    {
      icon: icons.diceMultiple,
      text: i18n.t("meal-plan.breakfast"),
      event: "randomBreakfast",
    },
    {
      icon: icons.diceMultiple,
      text: i18n.t("meal-plan.lunch"),
      event: "randomLunch",
    },
    {
      icon: icons.diceMultiple,
      text: i18n.t("meal-plan.side"),
      event: "randomSide",
    },
    {
      icon: icons.diceMultiple,
      text: i18n.t("meal-plan.snack"),
      event: "randomSnack",
    },
    {
      icon: icons.diceMultiple,
      text: i18n.t("meal-plan.drink"),
      event: "randomDrink",
    },
    {
      icon: icons.diceMultiple,
      text: i18n.t("meal-plan.dessert"),
      event: "randomDessert",
    },
  ];
  const inlineButtons = [
    {
      icon: icons.diceMultiple,
      text: i18n.t("meal-plan.random-meal"),
      event: "random",
      children: randomButtons,
    },
  ];

  const recipesWithScales = useMemo(() =>  {
    return recipes.map(recipe => ({ scale: 1, ...recipe }, []); // WF4-REVIEW: dependency array);
  });

  async function randomMeal(date: Date, type: PlanEntryType) {
    const { data } = await api.mealplans.setRandom({
      date: format(date, "yyyy-MM-dd"),
      entryType: type,
    });

    if (data) {
      actions.refreshAll();
    }
  }

  const dialog = /* WF4-REVIEW [J] */ reactive({
    open: false,
    entry: null as ReadPlanEntry | null,
    date: null as Date | null,
  });

  function openDialog() {
    dialog.entry = null;
    dialog.date = day;
    dialog.open = true;
  }

  const bindings = {
    onCreate: openDialog,
    onRandomBreakfast: () => randomMeal(day, "breakfast"),
    onRandomLunch: () => randomMeal(day, "lunch"),
    onRandomDinner: () => randomMeal(day, "dinner"),
    onRandomSide: () => randomMeal(day, "side"),
    onRandomSnack: () => randomMeal(day, "snack"),
    onRandomDrink: () => randomMeal(day, "drink"),
    onRandomDessert: () => randomMeal(day, "dessert"),
    onShoppingList: addAllToList,
  };

  return (
    <>
  <RecipeDialogAddToShoppingList value={shoppingListDialog} onChange={/* WF4-REVIEW: setter */ setShoppingListDialog} recipes={recipesWithScales} shopping-lists={shoppingLists} />
  {/* WF4-REVIEW: v-model on complex expression "dialog.open" [J] */}
  <GroupMealPlanEntryDialog {/* WF4-REVIEW: v-model dialog.open */} entry={dialog.entry} date={dialog.date} onCreate={actions.createOne($event)} onUpdate={actions.updateOne($event)} />
  {(inlineActions) ? (
    <template>
      <MealPlanDayHeader day={day} />
      <slot />
      <div className="d-flex justify-end">
        <BaseButtonGroup {...(bindings)} buttons={[...commonButtons, ...inlineButtons]} />
      </div>
    </template>
  ) : (
    <template>
      <MealPlanDayHeader day={day}>
        <BaseButtonGroup {...(bindings)} buttons={[{
          icon: $globals.icons.dotsVertical,
          event: '',
          text: '',
          children: [
            {
              text: t('meal-plan.add-day-to-list'),
              icon: $globals.icons.cartCheck,
              event: 'shopping-list',
              loading: addAllLoading,
              disabled: !recipes.length,
            },
            ...commonButtons,
            ...inlineButtons,
          ],
        }]} />
      </MealPlanDayHeader>
      <slot />
    </template>
  )}
    </>
  );
}
