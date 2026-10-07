import { useMemo, useState } from "react";
import { Button } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { addMonths, format, isDate } from "date-fns";
import type { DatePickerEventColorValue } from "vuetify/lib/components/VDatePicker/VDatePickerMonth.mjs";
import type { PlanEntryType } from "@/lib/api/types/meal-plan";
import { useHouseholdSelf } from "@/composables/use-households";
import { useMealplans } from "@/composables/use-group-mealplan";

export default function MealPlanDatePicker() {
  const selectedDate = defineModel<Date | [Date, Date]>();
  const props = defineProps<{
    entryType?: PlanEntryType;
  }>();

  const { household } = useHouseholdSelf();

  const [target, setTarget] = useState(new Date(););
  const range = useMemo(() => ({
    start: addMonths(target, -1, []); // WF4-REVIEW: dependency array,
    end: addMonths(target, 2),
  }));
  const { mealplans } = useMealplans(range);

  const firstDayOfWeek = computed(() => {
    return household?.preferences?.firstDayOfWeek || 0;
  });

  function updateMonth(month: number) {
    const copy = new Date(target);
    copy.setMonth(month);
    setTarget(copy);
  }

  function updateYear(year: number) {
    const copy = new Date(target);
    copy.setFullYear(year);
    setTarget(copy);
  }

  function hasMealPlanned(date: string): DatePickerEventColorValue {
    const planned = mealplans ?? [];
    const dateMatched = planned.filter(meal => meal.date === date);
    const typeMatched = dateMatched.filter(meal => !props.entryType || meal.entryType === props.entryType);
    const earlierDate = isDate(selectedDate) ? selectedDate : selectedDate?.[0];
    const laterDate = isDate(selectedDate) ? selectedDate : selectedDate?.[1];
    const isSelected = (earlierDate && date === format(earlierDate, "yyyy-MM-dd")) || (laterDate && date === format(laterDate, "yyyy-MM-dd"));
    if (!dateMatched.length) return false;
    if (typeMatched.length) return isSelected ? "primary-lighten-3" : "primary";
    return isSelected ? "grey-lighten-3" : "grey";
  }

  return (
    <>
  {/* WF4-REVIEW: value format + LocalizationProvider */}
  <DatePicker value={selectedDate} onChange={/* WF4-REVIEW: setter */ setSelectedDate} className="mx-auto" hide-header show-adjacent-months color="primary" first-day-of-week={firstDayOfWeek} local={$i18n.locale} events={hasMealPlanned} onUpdateMonth={updateMonth} onUpdateYear={updateYear}>
    <template>
      <div className="d-flex justify-space-between w-100">
        <Button disabled={disabled.includes('prev-month')} icon={$globals.icons.chevronLeft} flat density="comfortable" onClick={prevMonth} />
        <div className="text-center">
          <div className="text-body-large">
            {monthYearText.split(' ')[0]}
          </div>
          <div className="text-body-small">
            {yearText}
          </div>
        </div>
        <Button disabled={disabled.includes('next-month')} icon={$globals.icons.chevronRight} flat density="comfortable" onClick={nextMonth} />
      </div>
    </template>
  </DatePicker>
    </>
  );
}
