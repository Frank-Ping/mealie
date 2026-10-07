import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useAsyncKey } from "./use-utils";
import { useUserApi } from "@/composables/api";
import type { CreatePlanEntry, PlanEntryType, ReadPlanEntry, RecipeSummary, UpdatePlanEntry } from "@/lib/api/types/meal-plan";

type PlanOption = {
  text: string;
  value: PlanEntryType;
};
export function usePlanTypeOptions() {
  const { i18n } = useTranslation();

  return [
    { text: i18n.t("meal-plan.breakfast"), value: "breakfast" },
    { text: i18n.t("meal-plan.lunch"), value: "lunch" },
    { text: i18n.t("meal-plan.dinner"), value: "dinner" },
    { text: i18n.t("meal-plan.side"), value: "side" },
    { text: i18n.t("meal-plan.snack"), value: "snack" },
    { text: i18n.t("meal-plan.drink"), value: "drink" },
    { text: i18n.t("meal-plan.dessert"), value: "dessert" },
  ] as PlanOption[];
}

export function getEntryTypeText(value: PlanEntryType) {
  const { i18n } = useTranslation();
  return i18n.t("meal-plan." + value);
}
export interface DateRange {
  start: Date;
  end: Date;
}
export type DaySection = {
  title: string;
  meals: ReadPlanEntry[];
};

export type Days = {
  date: Date;
  sections: DaySection[];
  recipes: RecipeSummary[];
};

export type MealsByDate = {
  date: Date;
  meals: ReadPlanEntry[];
};

export interface Meal {
  date: Date;
  title: string;
  text: string;
  recipeId?: string;
  entryType: PlanEntryType;
  existing: boolean;
  id: number;
  groupId: string;
  userId: string;
  note: boolean;
  householdId: string;
}

export const useMealplans = function (range: DateRange /* WF4-REVIEW: was Ref */) {
  const api = useUserApi();
  const [loading, setLoading] = useState(false);

  const actions = {
    getAll() {
      setLoading(true);
      const { data: units } = useEffect(() => {
  let cancelled = false;
  void (async () => {
    try {
      const query = {
                start_date: format(range.start, "yyyy-MM-dd"),
                end_date: format(range.end, "yyyy-MM-dd"),
              };
              const { data } = await api.mealplans.getAll(1, -1, { start_date: query.start_date, end_date: query.end_date });
              if (cancelled) return;

              if (data) {
                return data.items;
              }
              else {
                return null;
              }
    }
    catch (err) {
      if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
    }
  })();
  return () => { cancelled = true; };
}, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

      setLoading(false);
      return units;
    },
    async refreshAll() {
      setLoading(true);
      const query = {
        start_date: format(range.start, "yyyy-MM-dd"),
        end_date: format(range.end, "yyyy-MM-dd"),
      };
      const { data } = await api.mealplans.getAll(1, -1, { start_date: query.start_date, end_date: query.end_date });

      if (data && data.items) {
        mealplans = data.items;
      }

      setLoading(false);
    },
    async createOne(payload: CreatePlanEntry) {
      setLoading(true);

      const { data } = await api.mealplans.createOne(payload);
      if (data) {
        this.refreshAll();
      }

      setLoading(false);
    },
    async updateOne(updateData: UpdatePlanEntry) {
      if (!updateData.id) {
        return;
      }

      setLoading(true);
      const { data } = await api.mealplans.updateOne(updateData.id, updateData);
      if (data) {
        this.refreshAll();
      }
      setLoading(false);
    },

    async deleteOne(id: string | number) {
      setLoading(true);
      const { data } = await api.mealplans.deleteOne(id);
      if (data) {
        this.refreshAll();
      }
      setLoading(false);
    },

    async setType(payload: UpdatePlanEntry, type: PlanEntryType) {
      payload.entryType = type;
      await this.updateOne(payload);
    },
  };

  const mealplans = actions.getAll();

  /* WF4-REVIEW [J] */ watch(range, actions.refreshAll);

  return { mealplans, actions, loading };
};
