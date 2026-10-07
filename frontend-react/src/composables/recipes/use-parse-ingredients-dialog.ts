import { useMemo, useState } from "react";
import { alert } from "@/composables/use-toast";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { IngredientFood, IngredientUnit, ParsedIngredient, RecipeIngredient } from "@/lib/api/types/recipe";
import type { Parser } from "@/lib/api/user/recipes/recipe";
import { useUserApi } from "../api";
import { useFoodData, useFoodStore, useUnitData, useUnitStore } from "../store";
import { useParsingPreferences } from "../use-users/preferences";
import { useIngredientTextParser } from "./use-recipe-ingredients";
import { useGroupSelf } from "@/composables/use-groups";

export const enum ParseStep {
  LOADING,
  INFO,
  PARSE,
  REVIEW,
}

export function useParseIngredientsDialog(
  ingredients: NoUndefinedField<RecipeIngredient[]>,
  onSave: (ingredients: NoUndefinedField<RecipeIngredient>[]) => void,
) {
  const { ingredientToParserString } = useIngredientTextParser();

  const { group } = useGroupSelf();
  const i18n = useI18n();
  const api = useUserApi();

  const unitStore = useUnitStore();
  const unitData = useUnitData();
  const foodStore = useFoodStore();
  const foodData = useFoodData();

  // The natural language parser is trained on English recipes, so it isn't a sensible default for
  // other languages: it recognises the quantity but leaves the unit in the food name.
  const isEnglishLocale = useMemo(() => (i18n.locale || "", []); // WF4-REVIEW: dependency array.toLowerCase().startsWith("en"));
  const parserPreferences = useParsingPreferences(isEnglishLocale ? "nlp" : "brute");
  const [parser, setParser] = useState(parserPreferences.parser || "nlp");
  const showNlpLanguageHint = useMemo(() => setParser(== "nlp" && !isEnglishLocale, [])); // WF4-REVIEW: dependency array
  const [dontShowInfoPage, setDontShowInfoPage] = useState(parserPreferences.dontShowInfoPage);
  const availableParsers = useMemo(() =>  {
    return [
      {
        text: i18n.t("recipe.parser.natural-language-processor", []); // WF4-REVIEW: dependency array,
        value: "nlp",
      },
      {
        text: i18n.t("recipe.parser.brute-parser"),
        value: "brute",
      },
      {
        text: i18n.t("recipe.parser.openai-parser"),
        value: "openai",
        hide: !group?.aiProviderSettings?.aiEnabled,
      },
    ];
  });

  /**
 * If confidence of parsing is below this threshold,
 * we will prompt the user to review the parsed ingredient.
 */
  const confidenceThreshold = 0.85;
  const [parsedIngs, setParsedIngs] = useState([]);

  const [currentIng, setCurrentIng] = useState(null);
  const [currentMissingUnit, setCurrentMissingUnit] = useState("");
  const [currentMissingFood, setCurrentMissingFood] = useState("");
  const currentIngHasError = useMemo(() => currentMissingUnit || currentMissingFood, []); // WF4-REVIEW: dependency array
  const [currentIngShouldDelete, setCurrentIngShouldDelete] = useState(false);

  const state = /* WF4-REVIEW [J] */ reactive({
    currentParsedIndex: -1,
    allReviewed: false,
    saveLoading: false,
    step: ParseStep.LOADING,
    loadingCount: 0,
    // Tracked separately from loadingCount, which covers the bulk parse: one ingredient can be
    // missing both a unit and a food, and only the button that was pressed should react.
    loading: {
      unit: false,
      food: false,
    },
  });
  function nextStep() {
    state.step = getNextStep(state.step);
  }

  function getNextStep(current: ParseStep) {
    switch (current) {
      case ParseStep.LOADING:
        if (!dontShowInfoPage) {
          console.log("showing info");
          return ParseStep.INFO;
        };
        return getNextStep(ParseStep.INFO);
      case ParseStep.INFO:
        if (!state.allReviewed) {
          return ParseStep.PARSE;
        }
        return ParseStep.REVIEW;
      case ParseStep.PARSE:
      case ParseStep.REVIEW:
        return ParseStep.REVIEW;
    }
  }

  function shouldReview(ing: ParsedIngredient): boolean {
    console.debug(`Checking if ingredient needs review (input="${ing.input})":`, ing);

    if (ing.ingredient.referencedRecipe) {
      console.debug("No review needed for sub-recipe ingredient");
      return false;
    }

    if ((ing.confidence?.average || 0) < confidenceThreshold) {
      console.debug("Needs review due to low confidence:", ing.confidence?.average);
      return true;
    }

    const food = ing.ingredient.food;
    if (food && !food.id) {
      console.debug("Needs review due to missing food ID:", food);
      return true;
    }

    const unit = ing.ingredient.unit;
    if (unit && !unit.id) {
      console.debug("Needs review due to missing unit ID:", unit);
      return true;
    }

    console.debug("No review needed");
    return false;
  }

  function checkUnit(ing: ParsedIngredient) {
    const unit = ing.ingredient.unit?.name;
    if (!unit || ing.ingredient.unit?.id) {
      setCurrentMissingUnit("");
      return;
    }

    const potentialMatch = createdUnits.get(unit.toLowerCase());
    if (potentialMatch) {
      ing.ingredient.unit = potentialMatch;
      setCurrentMissingUnit("");
      return;
    }

    setCurrentMissingUnit(unit);
    ing.ingredient.unit = undefined;
  }

  function checkFood(ing: ParsedIngredient) {
    const food = ing.ingredient.food?.name;
    if (!food || ing.ingredient.food?.id) {
      setCurrentMissingFood("");
      return;
    }

    const potentialMatch = createdFoods.get(food.toLowerCase());
    if (potentialMatch) {
      ing.ingredient.food = potentialMatch;
      setCurrentMissingFood("");
      return;
    }

    setCurrentMissingFood(food);
    ing.ingredient.food = undefined;
  }

  const ingredientsToReview = useMemo(() => parsedIngs.filter(shouldReview, []); // WF4-REVIEW: dependency array);

  function nextIngredient() {
    let nextIndex = state.currentParsedIndex;
    if (currentIngShouldDelete) {
      parsedIngs.splice(state.currentParsedIndex, 1);
      setCurrentIngShouldDelete(false);
    }
    else {
      nextIndex += 1;
    }

    while (nextIndex < parsedIngs.length) {
      const current = parsedIngs[nextIndex]!;
      if (shouldReview(current)) {
        state.currentParsedIndex = nextIndex;
        setCurrentIng(current);
        setCurrentIngShouldDelete(false);
        checkUnit(current);
        checkFood(current);
        return;
      }

      nextIndex += 1;
    }

    // No more to review
    state.allReviewed = true;
    nextStep();
  }

  /** Clear everything left over from a previous run, so re-opening the dialog starts clean */
  function resetParserState() {
    setParsedIngs([]);
    setCurrentIng(null);
    setCurrentMissingUnit("");
    setCurrentMissingFood("");
    setCurrentIngShouldDelete(false);
    state.currentParsedIndex = -1;
    state.allReviewed = false;
    state.step = ParseStep.LOADING;
    state.saveLoading = false;
    createdUnits.clear();
    createdFoods.clear();
  }

  async function parseIngredients() {
    if (state.loadingCount > 0) {
      return;
    }

    resetParserState();

    if (!ingredients || ingredients.length === 0) {
      nextStep();
      return;
    }
    try {
      const filteredIngredients = ingredients.filter(ing => !ing.referencedRecipe);
      const ingsAsString = filteredIngredients.map(ing => ingredientToParserString(ing));
      state.loadingCount += 1;
      const { data, error } = await api.recipes.parseIngredients(parser, ingsAsString);
      if (error || !data) {
        throw new Error("Failed to parse ingredients");
      }

      // Restore section titles from original ingredients — the parser doesn't return them
      data.forEach((parsed, index) => {
        parsed.ingredient.title = filteredIngredients[index]?.title || "";
      });

      const recipeRefs = ingredients.filter(ing => ing.referencedRecipe).map(ing => ({
        input: ing.note || "",
        confidence: {},
        ingredient: ing,
      }));
      setParsedIngs([...data, ...recipeRefs]);
      state.currentParsedIndex = -1;
      state.allReviewed = false;
      createdUnits.clear();
      createdFoods.clear();
      setCurrentIngShouldDelete(false);
      nextIngredient();
    }
    catch (error) {
      console.error("Error parsing ingredients:", error);
      alert.error(i18n.t("events.something-went-wrong"));
    }
    finally {
      state.loadingCount -= 1;
      nextStep();
    }
  }

  /** Cache of lowercased created units to avoid duplicate creations */
  const createdUnits = new Map<string, IngredientUnit>();
  /** Cache of lowercased created foods to avoid duplicate creations */
  const createdFoods = new Map<string, IngredientFood>();

  async function createMissingUnit() {
    if (!currentMissingUnit) {
      return;
    }

    unitData.reset();
    unitData.data.name = currentMissingUnit;

    state.loading.unit = true;
    try {
      let newUnit: IngredientUnit | null;
      if (createdUnits.has(unitData.data.name)) {
        newUnit = createdUnits.get(unitData.data.name)!;
      }
      else {
        newUnit = await unitStore.actions.createOne(unitData.data);
      }

      if (!newUnit) {
        alert.error(i18n.t("general.cant-create-permission"));
        return;
      }

      currentIng!.ingredient.unit = newUnit;
      createdUnits.set(newUnit.name.toLowerCase(), newUnit);
      setCurrentMissingUnit("");
    }
    finally {
      state.loading.unit = false;
    }
  }

  async function createMissingFood() {
    if (!currentMissingFood) {
      return;
    }

    foodData.reset();
    foodData.data.name = currentMissingFood;

    state.loading.food = true;
    try {
      let newFood: IngredientFood | null;
      if (createdFoods.has(foodData.data.name)) {
        newFood = createdFoods.get(foodData.data.name)!;
      }
      else {
        newFood = await foodStore.actions.createOne(foodData.data);
      }

      if (!newFood) {
        alert.error(i18n.t("general.cant-create-permission"));
        return;
      }

      currentIng!.ingredient.food = newFood;
      createdFoods.set(newFood.name.toLowerCase(), newFood);
      setCurrentMissingFood("");
    }
    finally {
      state.loading.food = false;
    }
  }

  async function addMissingUnitAsAlias() {
    const unit = currentIng?.ingredient.unit as IngredientUnit | undefined;
    if (!currentMissingUnit || !unit?.id) {
      return;
    }

    unit.aliases = unit.aliases || [];
    if (unit.aliases.map(a => a.name).includes(currentMissingUnit)) {
      return;
    }

    unit.aliases.push({ name: currentMissingUnit });

    state.loading.unit = true;
    try {
      const updated = await unitStore.actions.updateOne(unit);
      if (!updated) {
        alert.error(i18n.t("events.something-went-wrong"));
        return;
      }

      currentIng!.ingredient.unit = updated;
      setCurrentMissingUnit("");
    }
    finally {
      state.loading.unit = false;
    }
  }

  async function addMissingFoodAsAlias() {
    const food = currentIng?.ingredient.food as IngredientFood | undefined;
    if (!currentMissingFood || !food?.id) {
      return;
    }

    food.aliases = food.aliases || [];
    if (food.aliases.map(a => a.name).includes(currentMissingFood)) {
      return;
    }

    food.aliases.push({ name: currentMissingFood });

    state.loading.food = true;
    try {
      const updated = await foodStore.actions.updateOne(food);
      if (!updated) {
        alert.error(i18n.t("events.something-went-wrong"));
        return;
      }

      currentIng!.ingredient.food = updated;
      setCurrentMissingFood("");
    }
    finally {
      state.loading.food = false;
    }
  }

  /* WF4-REVIEW [J] */ watch(parser, () => {
    parserPreferences.parser = parser;
  });

  /* WF4-REVIEW [J] */ watch(dontShowInfoPage, () => {
    parserPreferences.dontShowInfoPage = dontShowInfoPage;
  });

  /* WF4-REVIEW [J] */ watch([parsedIngs, () => state.allReviewed], () => {
    if (!state.allReviewed) {
      return;
    }

    if (!parsedIngs.length) {
      insertNewIngredient(0);
    }
  }, { immediate: true, deep: true });

  function insertNewIngredient(index: number) {
    const ing = {
      input: "",
      confidence: {},
      ingredient: {
        quantity: 0,
        referenceId: uuid4(),
      },
    } as ParsedIngredient;

    parsedIngs.splice(index, 0, ing);
  }

  function saveIngs() {
    onSave(parsedIngs.map(x => x.ingredient as NoUndefinedField<RecipeIngredient>));
    state.saveLoading = true;
  }

  const ingredientsToReviewCount = ingredientsToReview.length; // was computed — plain read stays reactive
  const autoParsedIngredientsCount = useMemo(() => parsedIngs.length - ingredientsToReviewCount, []); // WF4-REVIEW: dependency array

  return {
    currentIngHasError,
    availableParsers,
    parserPreferences,
    parser,
    showNlpLanguageHint,
    dontShowInfoPage,
    confidenceThreshold,
    parsedIngs,
    currentIng,
    currentMissingUnit,
    currentMissingFood,
    currentIngShouldDelete,
    state,
    ingredientsToReviewCount,
    autoParsedIngredientsCount,
    nextStep,
    saveIngs,
    nextIngredient,
    parseIngredients,
    insertNewIngredient,
    addMissingFoodAsAlias,
    addMissingUnitAsAlias,
    createMissingFood,
    createMissingUnit,
  };
}
