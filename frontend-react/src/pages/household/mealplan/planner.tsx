import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, Container, Grid } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { addDays, differenceInCalendarDays, format, isSameDay, isValid, parseISO } from "date-fns";
import RecipeDialogAddToShoppingList from "@/components/Domain/Recipe/RecipeDialogAddToShoppingList";
import { useAddToShoppingListDialog } from "@/composables/shopping-list-page/use-add-to-shopping-list-dialog";
import { useMealplans } from "@/composables/use-group-mealplan";
import { useHouseholdSelf } from "@/composables/use-households";
import { useUserMealPlanPreferences } from "@/composables/use-users/preferences";

export const handle = {
  middleware: ["auth"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Planner() {
  const { t } = useTranslation();

  const TABS = {
    view: "household-mealplan-planner-view",
    edit: "household-mealplan-planner-edit",
  };

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const navigate = useNavigate();
  const i18n = useI18n();
  const { household, actions: householdActions } = useHouseholdSelf();
  const { shoppingLists, open: shoppingListDialog, addAllToList } = useAddToShoppingListDialog();

  useSeoMeta({
    title: i18n.t("meal-plan.dinner-this-week"),
  });

  // useHouseholdSelf() caches data in a module-level singleton for the lifetime of the tab,
  // so revisiting this page via client-side navigation can otherwise use a stale
  // firstDayOfWeek value if household preferences were changed elsewhere (e.g. Admin
  // Households panel) in the same session. Force a revalidation whenever this page is entered.
  /* WF4-REVIEW [J] */ onMounted(() => {
    householdActions.refresh();
  });

  const mealPlanPreferences = useUserMealPlanPreferences();
  const [numberOfDaysPast, setNumberOfDaysPast] = useState(mealPlanPreferences.numberOfDaysPast || 0);
  const [numberOfDays, setNumberOfDays] = useState(mealPlanPreferences.numberOfDays || 7);
  /* WF4-REVIEW [J] */ watch(numberOfDaysPast, (val) => {
    mealPlanPreferences.numberOfDaysPast = Number(val);
  });
  /* WF4-REVIEW [J] */ watch(numberOfDays, (val) => {
    mealPlanPreferences.numberOfDays = Number(val);
  });

  // Force to /view if current route is /planner
  if (route.path === "/household/mealplan/planner") {
    navigate({
      name: TABS.view,
      query: route.query,
    });
  }

  const edit = useMemo(() =>  {
    return route.path.startsWith("/household/mealplan/planner/edit", []); // WF4-REVIEW: dependency array
  });

  function safeParseISO(date: string, fallback: Date | undefined = undefined) {
    try {
      const parsed = parseISO(date);
      return isValid(parsed) ? parsed : fallback;
    }
    catch {
      return fallback;
    }
  }

  // Initialize dates from query parameters or defaults
  const initialStartDate = safeParseISO(route.query.start as string, addDays(new Date(), adjustForToday(-numberOfDaysPast)));
  const initialEndDate = safeParseISO(route.query.end as string, addDays(new Date(), adjustForToday(numberOfDays)));

  const [state, setState] = useState({
    range: [initialStartDate, initialEndDate] as [Date, Date],
    start: initialStartDate,
    picker: false,
    end: initialEndDate,
  });

  const firstDayOfWeek = computed(() => {
    return household?.preferences?.firstDayOfWeek || 0;
  });

  function changeWeek(step: number) {
    const { start, end } = weekRange;
    const stepSize = differenceInCalendarDays(end, start) + 1;
    state.range = [
      addDays(start, step * stepSize),
      addDays(end, step * stepSize),
    ];
  }

  const weekRange = useMemo(() =>  {
    const sorted = [...state.range].sort((a, b, []); // WF4-REVIEW: dependency array => a.getTime() - b.getTime());

    const start = sorted[0];
    const end = sorted[sorted.length - 1];

    if (start && end) {
      return { start, end };
    }
    return {
      start: addDays(new Date(), adjustForToday(-numberOfDaysPast)),
      end: addDays(new Date(), adjustForToday(numberOfDays)),
    };
  });

  // Update query parameters when date range changes
  /* WF4-REVIEW [J] */ watch(weekRange, (newRange) => {
    // Keep current route name and params, just update the query
    navigate(/* WF4-REVIEW: replace+query */ {
      name: route.name || TABS.view,
      params: route.params,
      query: {
        ...route.query,
        start: format(newRange.start, "yyyy-MM-dd"),
        end: format(newRange.end, "yyyy-MM-dd"),
      },
    });
  }, { immediate: true });

  const { mealplans, actions } = useMealplans(weekRange);

  function filterMealByDate(date: Date) {
    if (!mealplans) return [];
    return mealplans.filter((meal) => {
      const mealDate = parseISO(meal.date);
      return isSameDay(mealDate, date);
    });
  }

  function adjustForToday(days: number) {
    // e.g. If the user wants 7 days, we subtract one to do "today + 6"
    // e.g. If the user wants 2 days in the past, we keep it the same to do "today - 2"
    return days > 0 ? days - 1 : days;
  }

  const days = useMemo(() =>  {
    const numDays
      = Math.floor((weekRange.end.getTime(, []); // WF4-REVIEW: dependency array - weekRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate absolute value
    if (numDays < 0) return [];

    return Array.from(Array(numDays).keys()).map(
      (i) => {
        const date = new Date(weekRange.start.getTime());
        date.setDate(date.getDate() + i);
        return date;
      },
    );
  });

  const mealsByDate = useMemo(() =>  {
    return days.map((day, []); // WF4-REVIEW: dependency array => {
      return { date: day, meals: filterMealByDate(day) };
    });
  });

  const hasRecipes = useMemo(() =>  {
    return mealsByDate.some(day => day.meals.some(meal => meal.recipe, []); // WF4-REVIEW: dependency array);
  });

  const weekRecipesWithScales = useMemo(() =>  {
    return mealsByDate
      .flatMap(({ meals }, []); // WF4-REVIEW: dependency array => meals)
      .map(({ recipe }) => recipe)
      .filter(recipe => recipe)
      .map(recipe => ({ scale: 1, ...recipe }));
  });

  return (
    <>
  <Container>
    {(shoppingLists) ? (
      <RecipeDialogAddToShoppingList value={shoppingListDialog} onChange={/* WF4-REVIEW: setter */ setShoppingListDialog} recipes={weekRecipesWithScales} shopping-lists={shoppingLists} />
    ) : null}
    <div className={`d-flex ga-2 ${$vuetify.display.xs ? 'justify-center' : 'justify-start'}`}>
      <Button icon={$globals.icons.chevronLeft} flat rounded="md" density="comfortable" onClick={() => changeWeek(-1)} />
      {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J]; v-model on complex expression "state.picker" [J] */}
      <VMenu {/* WF4-REVIEW: v-model state.picker */} close-on-content-click={false} transition="scale-transition" offset-y min-width="auto">
        <template>
          <Button color="primary" className="mb-2" {...(props)}>
            {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
            <MdiIcon name={$globals.icons.calendar} />
            {$d(weekRange.start, "short")}
            -
            {$d(weekRange.end, "short")}
          </Button>
        </template>
        <Card>
          {/* WF4-REVIEW: v-model on complex expression "state.range" [J] */}
          <MealPlanDatePicker {/* WF4-REVIEW: v-model state.range */} hide-header multiple={'range'} first-day-of-week={firstDayOfWeek} local={$i18n.locale} />
          <CardContent>
            {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */}
            <VNumberInput value={numberOfDaysPast} onChange={setNumberOfDaysPast} min={0} inset label={t('meal-plan.numberOfDaysPast-label')} hint={t('meal-plan.numberOfDaysPast-hint')} persistent-hint />
          </CardContent>
          <CardContent>
            {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */}
            <VNumberInput value={numberOfDays} onChange={setNumberOfDays} min={1} inset label={t('meal-plan.numberOfDays-label')} hint={t('meal-plan.numberOfDays-hint')} persistent-hint />
          </CardContent>
        </Card>
      </VMenu>
      <Button icon={$globals.icons.chevronRight} flat rounded="md" density="comfortable" onClick={() => changeWeek(1)} />
    </div>
    <div className="d-flex justify-end">
      <BaseButtonGroup className="d-flex" buttons={[
          edit ? {
            icon: $globals.icons.calendar,
            text: t('general.view'),
            event: 'view',
          } : {
            icon: $globals.icons.edit,
            text: t('general.edit'),
            event: 'edit',
          },
          {
            icon: $globals.icons.dotsVertical,
            text: '',
            event: 'three-dot',
            children: [
              {
                icon: $globals.icons.cartCheck,
                text: t('meal-plan.add-all-to-list'),
                event: 'add-to-list',
                disabled: !hasRecipes,
              },
              {
                icon: $globals.icons.cog,
                text: t('general.settings'),
                event: 'settings',
              },
            ],
          },
        ]} onAddToList={addAllToList} onEdit={router.push({ name: TABS.edit, query: route.query })} onView={router.push({ name: TABS.view, query: route.query })} onSettings={router.push('/household/mealplan/settings')} />
    </div>
    <div>
      <Outlet mealplans={mealsByDate} actions={actions} />
    </div>
    <Grid container />
  </Container>
    </>
  );
}
