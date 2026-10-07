import { useTranslation } from "react-i18next";
import { Avatar, Button, Card, Chip, Divider, List, ListItem, ListItemText } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { format } from "date-fns";
import type { SortableEvent } from "sortablejs";
import { VueDraggable } from "vue-draggable-plus";
import GroupMealPlanEntryDialog from "@/components/Domain/Household/GroupMealPlanEntryDialog";
import RecipeCardLineItem from "@/components/Domain/Recipe/RecipeCardLineItem";
import { useUserApi } from "@/composables/api";
import type { MealsByDate, useMealplans } from "@/composables/use-group-mealplan";
import { getEntryTypeText, usePlanTypeOptions } from "@/composables/use-group-mealplan";
import type { ReadPlanEntry } from "@/lib/api/types/meal-plan";

export default function Edit() {
  const { t } = useTranslation();

  const props = defineProps<{
    mealplans: MealsByDate[];
    actions: ReturnType<typeof useMealplans>["actions"];
  }>();

  const api = useUserApi();
  const planTypeOptions = usePlanTypeOptions();

  // Local mutable meals object
  const mealplansByDate = reactive<{ [date: string]: ReadPlanEntry[] }>({});
  /* WF4-REVIEW [J] */ watch(
    () => props.mealplans,
    (plans) => {
      for (const plan of plans) {
        mealplansByDate[plan.date.toString()] = plan.meals ? [...plan.meals] : [];
      }
      // Remove any dates that no longer exist
      Object.keys(mealplansByDate).forEach((date) => {
        if (!plans.find(p => p.date.toString() === date)) {
          mealplansByDate[date] = [];
        }
      });
    },
    { immediate: true, deep: true },
  );

  function onMoveCallback(evt: SortableEvent) {
    // A Meal was moved, set the new date value and make an update request and refresh the meals
    const fromMealsByIndex = parseInt(evt.from.getAttribute("data-index") ?? "");
    const toMealsByIndex = parseInt(evt.to.getAttribute("data-index") ?? "");

    if (!isNaN(fromMealsByIndex) && !isNaN(toMealsByIndex)) {
      const destDate = props.mealplans[toMealsByIndex].date;
      const mealData = mealplansByDate[destDate.toString()][evt.newIndex as number];

      mealData.date = format(destDate, "yyyy-MM-dd");

      props.actions.updateOne(mealData);
    }
  }

  // =====================================================
  // Meal Entry Dialog

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

  async function randomizeMeal(mealplan: ReadPlanEntry) {
    if (!mealplan.entryType) {
      return;
    }

    // Create the new random entry first, so a failure here doesn't lose the current entry
    const { data: created } = await api.mealplans.setRandom({
      date: mealplan.date,
      entryType: mealplan.entryType,
    });

    if (created) {
      await api.mealplans.deleteOne(mealplan.id);
      props.actions.refreshAll();
    }
  }

  return (
    <>
  <div>
    {/* WF4-REVIEW: v-model on complex expression "dialog.open" [J] */}
    <GroupMealPlanEntryDialog {/* WF4-REVIEW: v-model dialog.open */} entry={dialog.entry} date={dialog.date} onCreate={actions.createOne($event)} onUpdate={actions.updateOne($event)} />
    <MealPlanLayout mealplans={mealplans}>
      <template>
        <MealPlanDay day={day.date} recipes={day.recipes} actions={actions} inline-actions>
          {/* WF4-REVIEW: v-model on complex expression "mealplansByDate[plan.date.toString()]!" [J] */}
          <VueDraggable {/* WF4-REVIEW: v-model mealplansByDate[plan.date.toString()]! */} tag="div" handle=".handle" delay={250} delay-on-touch-only={true} group="meals" data-index={index} data-box={plan.date} style="min-height: 150px" onEnd={onMoveCallback}>
            <SpinTransition>
              {mealplansByDate[plan.date.toString()].map(mealplan => (
                <Card key={mealplan.id} className="my-2 ml-4 mr-1" className={{ handle: $vuetify.display.smAndUp }}>
                  {(mealplan.recipe) ? (
                    <RecipeCardLineItem className="py-2" recipe={mealplan.recipe} disable-link onClick={editMeal(mealplan)} />
                  ) : (
                    /* WF4-REVIEW: @click → ListItemButton */
                    <ListItem className="py-2" onClick={editMeal(mealplan)}>
                      <template>
                        <Avatar>
                          {/* WF4-REVIEW: icon name resolves via lib/icons */}
                          <MdiIcon name={$globals.icons.primary} />
                        </Avatar>
                      </template>
                      {/* WF4-REVIEW: content → primary prop */}
                      <ListItemText>
                        {mealplan.title}
                      </ListItemText>
                      {(mealplan.text) ? (
                        /* WF4-REVIEW: content → secondary prop */
                        <ListItemText>
                          {mealplan.text}
                        </ListItemText>
                      ) : null}
                    </ListItem>
                  )}
                  <Divider className="mx-2" />
                  <div className="py-2 px-2 d-flex" style="align-items: center">
                    <Button size="small" icon variant="text" className={{ handle: !$vuetify.display.smAndUp }}>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={$globals.icons.arrowUpDown} />
                    </Button>
                    {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
                    <VMenu offset-y>
                      <template>
                        <Chip {...(menuProps)} label variant="elevated" size="small" color="accent" onClick={(e) => { e.preventDefault(); ; }}>
                          {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                          <MdiIcon name={$globals.icons.tags} />
                          {getEntryTypeText(mealplan.entryType!)}
                        </Chip>
                      </template>
                      <List>
                        {planTypeOptions.map(mealType => (
                          /* WF4-REVIEW: @click → ListItemButton */
                          <ListItem key={mealType} onClick={actions.setType(mealplan, mealType)}>
                            {/* WF4-REVIEW: content → primary prop */}
                            <ListItemText>
                              {mealType.text}
                            </ListItemText>
                          </ListItem>
                        ))}
                      </List>
                    </VMenu>
                    {(mealplan.recipe && mealplan.entryType) ? (
                      <Button className="ml-auto" size="small" variant="text" icon title={t('meal-plan.randomize-recipe')} onClick={randomizeMeal(mealplan)}>
                        {/* WF4-REVIEW: icon name resolves via lib/icons */}
                        <MdiIcon name={$globals.icons.diceMultiple} />
                      </Button>
                    ) : null}
                    <Button className={{ 'ml-auto': !mealplan.recipe || !mealplan.entryType }} size="small" variant="text" icon onClick={actions.deleteOne(mealplan.id)}>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={$globals.icons.delete} />
                    </Button>
                  </div>
                </Card>
              ))}
            </SpinTransition>
          </VueDraggable>
        </MealPlanDay>
      </template>
    </MealPlanLayout>
  </div>
    </>
  );
}
