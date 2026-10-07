import { icons } from "@/lib/icons";
import { useLocalStorage, useSessionStorage } from "@vueuse/core";
import { ActivityKey } from "@/lib/api/types/activity";
import type { RegisteredParser, TimelineEventType } from "@/lib/api/types/recipe";
import type { QueryFilterJSON } from "@/lib/api/types/non-generated";

export interface UserPrintPreferences {
  imagePosition: string;
  showDescription: boolean;
  showLinkedIngredients: boolean;
  showNotes: boolean;
  showNutrition: boolean;
  showSubstitutions: boolean;
  expandChildRecipes: boolean;
}

export interface UserSearchQuery {
  recipe: string;
}

export enum ImagePosition {
  hidden = "hidden",
  left = "left",
  right = "right",
}

export interface UserMealPlanPreferences {
  numberOfDaysPast: number;
  numberOfDays: number;
}

export interface UserRecipePreferences {
  orderBy: string;
  orderDirection: string;
  filterNull: boolean;
  sortIcon: string;
  useMobileCards: boolean;
}

export interface UserShoppingListPreferences {
  viewAllLists: boolean;
}

export interface UserTimelinePreferences {
  orderDirection: string;
  types: TimelineEventType[];
}

export interface UserParsingPreferences {
  parser: RegisteredParser;
  dontShowInfoPage: boolean;
}

export interface UserCookbooksPreferences {
  hideOtherHouseholds: boolean;
}

export interface UserRecipeFinderPreferences {
  foodIds: string[];
  toolIds: string[];
  queryFilter: string;
  queryFilterJSON: QueryFilterJSON;
  maxMissingFoods: number;
  maxMissingTools: number;
  includeFoodsOnHand: boolean;
  includeToolsOnHand: boolean;
  includeSubstitutions: boolean;
}

export interface UserRecipeCreatePreferences {
  importKeywordsAsTags: boolean;
  importCategories: boolean;
  stayInEditMode: boolean;
  parseRecipe: boolean;
  translateRecipe: boolean;
  createNewOrganizers: boolean;
}

export interface UserActivityPreferences {
  defaultActivity: ActivityKey;
}

export interface UserExperiencePreferences {
  lockScreen: boolean;
}

export function useUserMealPlanPreferences(): UserMealPlanPreferences /* WF4-REVIEW: was Ref */ {
  const fromStorage = useLocalStorage(
    "meal-planner-preferences",
    {
      numberOfDaysPast: 0,
      numberOfDays: 7,
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}

export function useUserPrintPreferences(): UserPrintPreferences /* WF4-REVIEW: was Ref */ {
  const fromStorage = useLocalStorage(
    "recipe-print-preferences",
    {
      imagePosition: "left" as ImagePosition,
      showDescription: true,
      showLinkedIngredients: false,
      showNotes: true,
      showNutrition: false,
      showSubstitutions: true,
      expandChildRecipes: false,
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}

export function useUserSortPreferences(): UserRecipePreferences /* WF4-REVIEW: was Ref */ {
  // icons imported directly (was $globals)

  const fromStorage = useLocalStorage(
    "recipe-section-preferences",
    {
      orderBy: "created_at",
      orderDirection: "desc",
      filterNull: false,
      sortIcon: icons.sortAlphabeticalAscending,
      useMobileCards: false,
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}

export function useUserActivityPreferences(): UserActivityPreferences /* WF4-REVIEW: was Ref */ {
  const fromStorage = useLocalStorage(
    "activity-preferences",
    {
      defaultActivity: ActivityKey.RECIPES,
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}

export function useUserSearchQuerySession(): UserSearchQuery /* WF4-REVIEW: was Ref */ {
  const fromStorage = useSessionStorage(
    "search-query",
    {
      recipe: "",
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}

export function useShoppingListPreferences(): UserShoppingListPreferences /* WF4-REVIEW: was Ref */ {
  const fromStorage = useLocalStorage(
    "shopping-list-preferences",
    {
      viewAllLists: false,
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}

export function useTimelinePreferences(): UserTimelinePreferences /* WF4-REVIEW: was Ref */ {
  const fromStorage = useLocalStorage(
    "timeline-preferences",
    {
      orderDirection: "asc",
      types: ["info", "system", "comment"] as TimelineEventType[],
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}

/**
 * @param defaultParser used only when no preference has been stored yet. Callers that know the
 * user's locale can pass a parser better suited to it, since the natural language parser is
 * trained on English recipes.
 */
export function useParsingPreferences(defaultParser: RegisteredParser = "nlp" as RegisteredParser): UserParsingPreferences /* WF4-REVIEW: was Ref */ {
  const fromStorage = useLocalStorage(
    "parsing-preferences",
    {
      parser: defaultParser,
      dontShowInfoPage: false,
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}

export function useCookbookPreferences(): UserCookbooksPreferences /* WF4-REVIEW: was Ref */ {
  const fromStorage = useLocalStorage(
    "cookbook-preferences",
    {
      hideOtherHouseholds: false,
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}

export function useRecipeFinderPreferences(): UserRecipeFinderPreferences /* WF4-REVIEW: was Ref */ {
  const fromStorage = useLocalStorage(
    "recipe-finder-preferences",
    {
      foodIds: [],
      toolIds: [],
      queryFilter: "",
      queryFilterJSON: { parts: [] } as QueryFilterJSON,
      maxMissingFoods: 20,
      maxMissingTools: 20,
      includeFoodsOnHand: true,
      includeToolsOnHand: true,
      includeSubstitutions: true,
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}

export function useRecipeCreatePreferences(): UserRecipeCreatePreferences /* WF4-REVIEW: was Ref */ {
  const fromStorage = useLocalStorage(
    "recipe-create-preferences",
    {
      importKeywordsAsTags: false,
      importCategories: false,
      stayInEditMode: false,
      parseRecipe: true,
      translateRecipe: false,
      createNewOrganizers: false,
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}

export function useUserExperiencePreferences(): UserExperiencePreferences /* WF4-REVIEW: was Ref */ {
  const fromStorage = useLocalStorage(
    "user-experience-preferences",
    {
      lockScreen: true,
    },
    { mergeDefaults: true },
  );

  return fromStorage;
}
