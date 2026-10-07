import { useNavigate } from "react-router-dom";
import { useRecipeCreatePreferences } from "@/composables/use-users/preferences";

export interface UseNewRecipeOptionsProps {
  enableImportKeywords?: boolean;
  enableImportCategories?: boolean;
  enableStayInEditMode?: boolean;
  enableParseRecipe?: boolean;
  enableTranslateRecipe?: boolean;
  enableCreateNewOrganizers?: boolean;
}

export function useNewRecipeOptions(props: UseNewRecipeOptionsProps = {}) {
  const {
    enableImportKeywords = true,
    enableImportCategories = true,
    enableStayInEditMode = true,
    enableParseRecipe = true,
    enableTranslateRecipe = false,
    enableCreateNewOrganizers = false,
  } = props;

  const navigate = useNavigate();
  const recipeCreatePreferences = useRecipeCreatePreferences();

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const importKeywordsAsTags = computed({
    get() {
      if (!enableImportKeywords) return false;
      return recipeCreatePreferences.importKeywordsAsTags;
    },
    set(v: boolean) {
      if (!enableImportKeywords) return;
      recipeCreatePreferences.importKeywordsAsTags = v;
    },
  });

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const importCategories = computed({
    get() {
      if (!enableImportCategories) return false;
      return recipeCreatePreferences.importCategories;
    },
    set(v: boolean) {
      if (!enableImportCategories) return;
      recipeCreatePreferences.importCategories = v;
    },
  });

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const stayInEditMode = computed({
    get() {
      if (!enableStayInEditMode) return false;
      return recipeCreatePreferences.stayInEditMode;
    },
    set(v: boolean) {
      if (!enableStayInEditMode) return;
      recipeCreatePreferences.stayInEditMode = v;
    },
  });

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const parseRecipe = computed({
    get() {
      if (!enableParseRecipe) return false;
      return recipeCreatePreferences.parseRecipe;
    },
    set(v: boolean) {
      if (!enableParseRecipe) return;
      recipeCreatePreferences.parseRecipe = v;
    },
  });

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const translateRecipe = computed({
    get() {
      if (!enableTranslateRecipe) return false;
      return recipeCreatePreferences.translateRecipe;
    },
    set(v: boolean) {
      if (!enableTranslateRecipe) return;
      recipeCreatePreferences.translateRecipe = v;
    },
  });

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const createNewOrganizers = computed({
    get() {
      if (!enableCreateNewOrganizers) return false;
      return recipeCreatePreferences.createNewOrganizers;
    },
    set(v: boolean) {
      if (!enableCreateNewOrganizers) return;
      recipeCreatePreferences.createNewOrganizers = v;
    },
  });

  function navigateToRecipe(recipeSlug: string, groupSlug: string, createPagePath: string) {
    const editParam = enableStayInEditMode ? stayInEditMode : false;
    const parseParam = enableParseRecipe ? parseRecipe : false;

    const queryParams = new URLSearchParams();
    if (editParam) {
      queryParams.set("edit", "true");
    }
    if (parseParam) {
      queryParams.set("parse", "true");
    }

    const queryString = queryParams.toString();
    const recipeUrl = `/g/${groupSlug}/r/${recipeSlug}${queryString ? `?${queryString}` : ""}`;

    // Replace current entry to prevent re-import on back navigation
    navigate(/* WF4-REVIEW: replace+query */ createPagePath).then(() => navigate(recipeUrl));
  }

  return {
    // Computed properties for the checkboxes
    importKeywordsAsTags,
    importCategories,
    stayInEditMode,
    parseRecipe,
    translateRecipe,
    createNewOrganizers,

    // Helper functions
    navigateToRecipe,

    // Props for conditional rendering
    enableImportKeywords,
    enableImportCategories,
    enableStayInEditMode,
    enableParseRecipe,
    enableTranslateRecipe,
    enableCreateNewOrganizers,
  };
}
