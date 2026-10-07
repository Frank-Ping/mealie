import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardActions, Dialog, TextField, Toolbar } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import RecipeCardMobile from "./RecipeCardMobile";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import type { RecipeSummary } from "@/lib/api/types/recipe";
import { useUserApi } from "@/composables/api";
import { useRecipeSearch } from "@/composables/recipes/use-recipe-search";
import { usePublicExploreApi } from "@/composables/api/api-client";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function RecipeDialogSearch() {
  const { t } = useTranslation();

  const SELECTED_EVENT = "selected";

  // Define emits
  const emit = defineEmits<{
    selected: [recipe: RecipeSummary];
  }>();

  const auth = useMealieAuth();
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const attrs = useAttrs();

  // ===========================================================================
  // Dialog State Management
  const [dialog, setDialog] = useState(false);

  // Reset or Grab Recipes on Change
  /* WF4-REVIEW [J] */ watch(dialog, (val) => {
    if (!val) {
      search.query = "";
      setSelectedIndex(-1);
      search.data = [];
    }
  });

  // ===========================================================================
  // Event Handlers

  function scrollSelectedRecipeIntoView() {
    const recipeCards = document.getElementsByClassName("arrow-nav");

    if (!recipeCards.length || selectedIndex < 0 || selectedIndex >= recipeCards.length) {
      return;
    }

    recipeCards[selectedIndex]?.scrollIntoView({ block: "center" });
  }

  function activateRecipe(recipe: RecipeSummary | undefined) {
    if (!recipe) {
      return;
    }

    if (attrs.selected) {
      handleSelect(recipe);
      return;
    }

    if (!recipe.slug) {
      return;
    }

    close();
    navigate(`/g/${groupSlug}/r/${recipe.slug}`);
  }

  async function selectRecipe(positionChange: number) {
    selectedIndex += positionChange;
    setSelectedIndex(Math.max(selectedIndex, -1));
    setSelectedIndex(Math.min(selectedIndex, search.data.length - 1));
    await /* WF4-REVIEW [J] */ nextTick();
    scrollSelectedRecipeIntoView();
  }

  function onSearchKeydown(e: KeyboardEvent) {
    if (e.isComposing) {
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const index = Math.max(selectedIndex, 0);
      activateRecipe(search.data.value[index]);
    }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      void selectRecipe(-1);
    }
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      void selectRecipe(1);
    }
    else {
      return;
    }
  }

  /* WF4-REVIEW [J] */ watch(dialog, (val) => {
    if (!val) {
      document.removeEventListener("keydown", onSearchKeydown);
    }
    else {
      document.addEventListener("keydown", onSearchKeydown);
    }
  });

  onBeforeUnmount(() => {
    document.removeEventListener("keydown", onSearchKeydown);
  });

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  /* WF4-REVIEW [J] */ watch(route, close);

  function open() {
    setDialog(true);
  }
  function close() {
    setDialog(false);
  }

  // ===========================================================================
  // Basic Search
  const { isOwnGroup } = useLoggedInState();
  const api = isOwnGroup ? useUserApi() : usePublicExploreApi(groupSlug).explore;
  const search = useRecipeSearch(api);

  /* WF4-REVIEW [J] */ watch(() => search.data, () => {
    setSelectedIndex(-1);
  });

  // Select Handler
  function handleSelect(recipe: RecipeSummary) {
    close();
    emit(SELECTED_EVENT, recipe);
  }

  // Expose functions to parent components
  defineExpose({
    open,
    close,
  });

  return (
    <>
  <div>
    <slot {...({ open, close })} />
    {/* WF4-REVIEW: max-width/scrollable */}
    <Dialog open={dialog} onClose={setDialog} max-width="988px" content-class="top-dialog" scrollable={false}>
      <Card rounded={!$vuetify.display.xs} loading={loading}>
        {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-toolbar> */}
        <Toolbar color="primary-lighten-1">
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "search.query" [J] */}
          <TextField id="arrow-search" autofocus variant="solo" flat autocomplete="off" bg-color="primary-lighten-1" color="white" density="compact" className="mx-2 arrow-search" hide-details single-line placeholder={t('search.search')} prepend-inner-icon={icons.search} />
          {($vuetify.display.xs) ? (
            <Button icon size="x-small" onClick={() => setDialog(false)}>
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={icons.close} />
            </Button>
          ) : null}
        </Toolbar>
        <CardActions>
          <div className="mr-auto">
            {t("search.results")}
          </div>
        </CardActions>
        <div className="scroll pa-1" style="max-height: 700px;">
          {search.data.map((recipe, index) => (
            <RecipeCardMobile key={index} className="ma-1 arrow-nav" className={{ 'keyboard-selected': index === selectedIndex }} name={recipe.name ?? ''} description={recipe.description ?? ''} slug={recipe.slug ?? ''} rating={recipe.rating ?? 0} image={recipe.image} recipe-id={recipe.id ?? ''} {...($attrs.selected ? { selected: () => handleSelect(recipe) } : {})} />
          ))}
        </div>
      </Card>
    </Dialog>
  </div>
    </>
  );
}
