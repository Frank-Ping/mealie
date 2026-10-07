import { useTranslation } from "react-i18next";
import { Card, Container } from "@mui/material";
import { icons } from "@/lib/icons";
import MealPlanNoteMenu from "@/components/Domain/Mealplan/MealPlanNoteMenu";
import RecipeCardMobile from "@/components/Domain/Recipe/RecipeCardMobile";
import type { MealsByDate } from "@/composables/use-group-mealplan";
import type { ReadPlanEntry } from "@/lib/api/types/meal-plan";

export default function View() {
  const { t } = useTranslation();

  defineProps<{
    mealplans: MealsByDate[];
    actions: ReturnType<typeof useMealplans>["actions"];
  }>();

  const dialog = /* WF4-REVIEW [J] */ reactive({
    open: false,
    entry: null as ReadPlanEntry | null,
    date: null as Date | null,
  });

  function editMeal(mealplan: ReadPlanEntry) {
    if (!mealplan.entryType) return;

    dialog.entry = mealplan;
    dialog.date = null;
    dialog.open = true;
  }

  return (
    <>
  <Container className="mx-0 pa-0">
    {/* WF4-REVIEW: v-model on complex expression "dialog.open" [J] */}
    <GroupMealPlanEntryDialog entry={dialog.entry} date={dialog.date} onCreate={actions.createOne($event)} onUpdate={actions.updateOne($event)} />
    <MealPlanLayout mealplans={mealplans}>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        <MealPlanDay day={day.date} actions={actions} recipes={day.recipes}>
          <SpinTransition>
            {(day.sections.length) ? (
              <Card variant="flat" className="pl-4 pr-2">
                <SpinTransition>
                  {day.sections.map(section => (
                    <div key={section.title}>
                      <div className="py-2 d-flex flex-column">
                        <p className="text-overline my-0">
                          {section.title}
                        </p>
                      </div>
                      <SpinTransition>
                        {section.meals.map(mealplan => (
                          <RecipeCardMobile key={mealplan.id} recipe-id={mealplan.recipe ? mealplan.recipe.id! : ''} className="mb-2" rating={mealplan.recipe ? mealplan.recipe.rating! : 0} slug={mealplan.recipe ? mealplan.recipe.slug! : mealplan.title!} description={mealplan.recipe ? mealplan.recipe.description! : mealplan.text!} name={mealplan.recipe ? mealplan.recipe.name! : mealplan.title!} image={mealplan.recipe ? mealplan.recipe.image! : undefined} tags={mealplan.recipe ? mealplan.recipe.tags! : []} context-menu-leading-items={[
                        {
                          title: t('meal-plan.remove-from-plan'),
                          icon: icons.calendarRemove,
                          color: undefined,
                          event: 'mealplanRemove',
                          isPublic: false,
                        },
                        {
                          title: t('meal-plan.edit-meal-plan'),
                          icon: icons.calendarEdit,
                          color: undefined,
                          event: 'mealplanEdit',
                          isPublic: false,
                        },
                      ]} onMealplanRemove={actions.deleteOne(mealplan.id)} onMealplanEdit={editMeal(mealplan)}>
                            {(!mealplan.recipe) ? (
                              /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
                              <>
                                <MealPlanNoteMenu onMealplanRemove={actions.deleteOne(mealplan.id)} onMealplanEdit={editMeal(mealplan)} />
                              </>
                            ) : null}
                          </RecipeCardMobile>
                        ))}
                      </SpinTransition>
                    </div>
                  ))}
                </SpinTransition>
              </Card>
            ) : null}
          </SpinTransition>
        </MealPlanDay>
      </>
    </MealPlanLayout>
  </Container>
    </>
  );
}
