import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, CardHeader, Container, Divider, FormControlLabel, Grid, ListItem, Tooltip } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { toRefs } from "@vueuse/core";
import { useUserApi } from "@/composables/api";
import { alert } from "@/composables/use-toast";
import { useShoppingListPreferences } from "@/composables/use-users/preferences";
import type { RecipeIngredient, ShoppingListAddRecipeParamsBulk, ShoppingListSummary } from "@/lib/api/types/household";
import type { Recipe } from "@/lib/api/types/recipe";
import RecipeIngredientListItem from "./RecipeIngredientListItem";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  recipes?: RecipeWithScale[];
  shoppingLists?: ShoppingListSummary[];
}

export interface ShoppingListIngredient {
  checked: boolean;
  ingredient: RecipeIngredient;
}

export interface ShoppingListIngredientSection {
  sectionName: string;
  ingredients: ShoppingListIngredient[];
}

export interface ShoppingListRecipeIngredientSection {
  recipeId: string;
  recipeName: string;
  recipeScale: number;
  ingredientSections: ShoppingListIngredientSection[];
  parentRecipe?: Recipe;
}

export default function RecipeDialogAddToShoppingList({ recipes = undefined, shoppingLists = [] }: Props) {
  const { t } = useTranslation();

  export interface RecipeWithScale extends Recipe {
    scale: number;
  }








  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const dialog = defineModel<boolean>({ default: false });

  const { i18n } = useTranslation();
  const auth = useMealieAuth();
  const api = useUserApi();
  const preferences = useShoppingListPreferences();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  // Capture values at initialization to avoid reactive updates
  const [currentHouseholdSlug, setCurrentHouseholdSlug] = useState("");
  const [filteredShoppingLists, setFilteredShoppingLists] = useState([]);

  const state = /* WF4-REVIEW [J] */ reactive({
    shoppingListDialog: false,
    shoppingListIngredientDialog: false,
    shoppingListShowAllToggled: false,
  });

  const { shoppingListDialog, shoppingListIngredientDialog, shoppingListShowAllToggled: _shoppingListShowAllToggled } = toRefs(state);

  const [recipeIngredientSections, setRecipeIngredientSections] = useState([]);
  const [selectedShoppingList, setSelectedShoppingList] = useState(null);

  /* WF4-REVIEW [J] */ watch([dialog, () => preferences.viewAllLists], () => {
    if (dialog) {
      setCurrentHouseholdSlug(auth.user?.householdSlug || "");
      setFilteredShoppingLists(shoppingLists.filter(
        list => preferences.viewAllLists || list.userId === auth.user?.id,
      ));

      if (filteredShoppingLists.length === 1 && !state.shoppingListShowAllToggled) {
        setSelectedShoppingList(filteredShoppingLists[0]);
        openShoppingListIngredientDialog(selectedShoppingList);
      }
      else {
        state.shoppingListDialog = true;
        setReady(true);
      }
    }
    else if (!dialog) {
      initState();
    }
  });

  function buildIngredientSections(ingredients: ShoppingListIngredient[]): ShoppingListIngredientSection[] {
    let currentTitle = "";
    const onHandIngs: ShoppingListIngredient[] = [];
    const sections = ingredients.reduce((acc, ing) => {
      if (ing.ingredient.title) {
        currentTitle = ing.ingredient.title;
      }

      if (!acc.length || currentTitle !== acc[acc.length - 1].sectionName) {
        if (acc.length) {
          acc[acc.length - 1].ingredients.push(...onHandIngs);
          onHandIngs.length = 0;
        }
        acc.push({ sectionName: currentTitle, ingredients: [] });
      }

      const householdsWithFood = ing.ingredient?.food?.householdsWithIngredientFood || [];
      if (householdsWithFood.includes(currentHouseholdSlug)) {
        onHandIngs.push(ing);
        return acc;
      }

      acc[acc.length - 1].ingredients.push(ing);
      return acc;
    }, [] as ShoppingListIngredientSection[]);

    if (sections.length) {
      sections[sections.length - 1].ingredients.push(...onHandIngs);
    }
    return sections;
  }

  async function consolidateRecipesIntoSections(recipes: RecipeWithScale[]) {
    const recipeSectionMap = new Map<string, ShoppingListRecipeIngredientSection>();

    function addSubRecipeToMap(ing: RecipeIngredient, parentQuantity: number, parentScale: number, parentRecipe: Recipe) {
      const subRecipe = ing.referencedRecipe!;
      const key = subRecipe.id || subRecipe.slug || "";
      const ownIngs: ShoppingListIngredient[] = [];
      const subRefIngs: RecipeIngredient[] = [];

      for (const subIng of subRecipe.recipeIngredient ?? []) {
        if (subIng.referencedRecipe) {
          subRefIngs.push(subIng);
        }
        else {
          const householdsWithFood = subIng.food?.householdsWithIngredientFood || [];
          ownIngs.push({
            checked: !householdsWithFood.includes(currentHouseholdSlug),
            ingredient: subIng,
          });
        }
      }

      recipeSectionMap.set(key, {
        recipeId: subRecipe.id || "",
        recipeName: subRecipe.name || "",
        recipeScale: parentQuantity * parentScale,
        ingredientSections: buildIngredientSections(ownIngs),
        parentRecipe,
      });

      subRefIngs.forEach(subIng => addSubRecipeToMap(subIng, (ing.quantity || 1) * (subIng.quantity || 1), parentScale, subRecipe));
    }

    for (const recipe of recipes) {
      if (!recipe.slug) {
        continue;
      }

      if (recipeSectionMap.has(recipe.slug)) {
        const existingSection = recipeSectionMap.get(recipe.slug);
        if (existingSection) {
          existingSection.recipeScale += recipe.scale;
        }
        continue;
      }

      // Create a local copy to avoid mutating props
      let recipeData = { ...recipe };
      if (!(recipeData.id && recipeData.name && recipeData.recipeIngredient)) {
        const { data } = await api.recipes.getOne(recipeData.slug);
        if (!data?.recipeIngredient?.length) {
          continue;
        }
        recipeData = {
          ...recipeData,
          id: data.id || "",
          name: data.name || "",
          recipeIngredient: data.recipeIngredient,
        };
      }
      else if (!recipeData.recipeIngredient.length) {
        continue;
      }

      const ownIngs: ShoppingListIngredient[] = [];
      const subRefIngs: RecipeIngredient[] = [];
      recipeData.recipeIngredient.forEach((ing) => {
        if (ing.referencedRecipe) {
          subRefIngs.push(ing);
        }
        else {
          const householdsWithFood = ing.food?.householdsWithIngredientFood || [];
          ownIngs.push({
            checked: !householdsWithFood.includes(currentHouseholdSlug),
            ingredient: ing,
          });
        }
      });

      recipeSectionMap.set(recipe.slug, {
        recipeId: recipeData.id,
        recipeName: recipeData.name,
        recipeScale: recipeData.scale,
        ingredientSections: buildIngredientSections(ownIngs),
      });

      subRefIngs.forEach(ing => addSubRecipeToMap(ing, ing.quantity || 1, recipeData.scale, recipeData));
    }

    setRecipeIngredientSections(Array.from(recipeSectionMap.values()));
  }

  function initState() {
    state.shoppingListDialog = false;
    state.shoppingListIngredientDialog = false;
    state.shoppingListShowAllToggled = false;
    setRecipeIngredientSections([]);
    setSelectedShoppingList(null);
  }

  initState();

  async function openShoppingListIngredientDialog(list: ShoppingListSummary) {
    if (!recipes?.length) {
      return;
    }

    setSelectedShoppingList(list);
    await consolidateRecipesIntoSections(recipes);
    state.shoppingListDialog = false;
    state.shoppingListIngredientDialog = true;
  }

  function setShowAllToggled() {
    state.shoppingListShowAllToggled = true;
  }

  function bulkCheckIngredients(value = true) {
    recipeIngredientSections.forEach((recipeSection) => {
      recipeSection.ingredientSections.forEach((ingSection) => {
        ingSection.ingredients.forEach((ing) => {
          ing.checked = value;
        });
      });
    });
  }

  async function addRecipesToList() {
    if (!selectedShoppingList) {
      return;
    }

    const recipeData: ShoppingListAddRecipeParamsBulk[] = [];
    recipeIngredientSections.forEach((section) => {
      const ingredients: RecipeIngredient[] = [];
      section.ingredientSections.forEach((ingSection) => {
        ingSection.ingredients.forEach((ing) => {
          if (ing.checked) {
            ingredients.push(ing.ingredient);
          }
        });
      });

      if (!ingredients.length) {
        return;
      }

      recipeData.push(
        {
          recipeId: section.recipeId,
          recipeIncrementQuantity: section.recipeScale,
          recipeIngredients: ingredients,
        },
      );
    });
    const listId = selectedShoppingList.id;
    const { error } = await api.shopping.lists.addRecipes(listId, recipeData);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    error
      ? alert.error(i18n.t("recipe.failed-to-add-recipes-to-list"))
      : alert.success(i18n.t("recipe.successfully-added-to-list"), null, {
          action: {
            message: i18n.t("general.view"),
            onClick: () => navigate(`/shopping-lists/${listId ?? ""}`),
          },
        });

    state.shoppingListDialog = false;
    state.shoppingListIngredientDialog = false;
    dialog = false;
  }

  return (
    <>
  {(dialog) ? (
    <div>
      {(shoppingListDialog && ready) ? (
        <BaseDialog value={dialog} onChange={/* WF4-REVIEW: setter */ setDialog} bottom-sheet title={t('recipe.add-to-list')} icon={icons.cartCheck}>
          {(!filteredShoppingLists.length) ? (
            <Container>
              <BasePageTitle>
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {t('shopping-list.no-shopping-lists-found')}
                </>
              </BasePageTitle>
            </Container>
          ) : null}
          <CardContent>
            {filteredShoppingLists.map(list => (
              <Card key={list.id} hover className="my-2 left-border" onClick={openShoppingListIngredientDialog(list)}>
                {/* WF4-REVIEW: title text moves to the title prop */}
                <CardHeader className="py-2">
                  {list.name}
                </CardHeader>
              </Card>
            ))}
          </CardContent>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {/* WF4-REVIEW: assignment handler "dialog = false" — target not a tracked ref [J] */}
            <Button variant="text" color="grey" onClick={dialog = false}>
              {t("general.cancel")}
            </Button>
            <div className="d-flex justify-end" style="width: 100%;">
              {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "preferences.viewAllLists" [J] */}
              <FormControlLabel hide-details label={t('general.show-all')} className="my-auto mr-4" onClick={setShowAllToggled()} />
            </div>
          </>
        </BaseDialog>
      ) : null}
      {(shoppingListIngredientDialog) ? (
        <BaseDialog value={dialog} onChange={/* WF4-REVIEW: setter */ setDialog} title={selectedShoppingList?.name || t('recipe.add-to-list')} icon={icons.cartCheck} width="70%" submit-text={t('recipe.add-to-list')} can-submit onSubmit={addRecipesToList()}>
          <div style="max-height: 70vh;  overflow-y: auto">
            {recipeIngredientSections.map((recipeSection, recipeSectionIndex) => (
              <Card key={recipeSection.recipeId + recipeSectionIndex} elevation="0" height="fit-content" width="100%">
                {(recipeSectionIndex > 0) ? (
                  <Divider className="mt-3" />
                ) : null}
                {(recipeIngredientSections.length > 1) ? (
                  /* WF4-REVIEW: title text moves to the title prop */
                  <CardHeader className="justify-center text-h5" width="100%">
                    <Container style="width: 100%;">
                      <Grid container no-gutters className="ma-0 pa-0">
                        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                        <Grid cols="12" align-self="center" className="text-center">
                          {recipeSection.recipeName}
                          {(recipeSection.parentRecipe?.name) ? (
                            /* WF4-REVIEW: activator slot variants [J] */
                            <Tooltip location="top">
                              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                              <>
                                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                                <MdiIcon name={icons.potSteam} {...(tooltipProps)} size="tiny" className="mb-2 ml-2" style="cursor: pointer" />
                              </>
                              <span>
                                {t("shopping-list.ingredient-of-recipe", { recipe: recipeSection.parentRecipe.name })}
                              </span>
                            </Tooltip>
                          ) : null}
                        </Grid>
                      </Grid>
                      {(recipeSection.recipeScale > 1) ? (
                        <Grid container no-gutters className="ma-0 pa-0">
                          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                          <Grid cols="12" align-self="center" className="text-center">
                            (
                            {t("recipe.quantity")}
                            :
                            {recipeSection.recipeScale}
                            )
                          </Grid>
                        </Grid>
                      ) : null}
                    </Container>
                  </CardHeader>
                ) : null}
                <div>
                  {recipeSection.ingredientSections.map((ingredientSection, ingredientSectionIndex) => (
                    <div key={recipeSection.recipeId + recipeSectionIndex + ingredientSectionIndex}>
                      {(ingredientSection.sectionName) ? (
                        /* WF4-REVIEW: title text moves to the title prop */
                        <CardHeader className="ingredient-title mt-2 pb-0 text-h6">
                          {ingredientSection.sectionName}
                        </CardHeader>
                      ) : null}
                      <div className={$vuetify.display.smAndDown ? '' : 'ingredient-grid'} style={$vuetify.display.smAndDown ? '' : { gridTemplateRows: `repeat(${Math.ceil(ingredientSection.ingredients.length / 2)}, min-content)` }}>
                        {ingredientSection.ingredients.map((ingredientData, i) => (
                          /* WF4-REVIEW: @click → ListItemButton */
                          <ListItem key={recipeSection.recipeId + recipeSectionIndex + ingredientSectionIndex + i} density="compact" onClick={recipeIngredientSections[recipeSectionIndex]
                    .ingredientSections[ingredientSectionIndex]
                    .ingredients[i].checked = !recipeIngredientSections[recipeSectionIndex]
                      .ingredientSections[ingredientSectionIndex]
                      .ingredients[i]
                      .checked}>
                            <Container className="pa-0 ma-0">
                              <Grid container no-gutters>
                                {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
                                <FormControlLabel hide-details model-value={ingredientData.checked} className="pt-0 my-auto py-auto mr-2" color="secondary" density="compact" />
                                <div key={`${ingredientData.ingredient?.quantity || 'no-qty'}-${i}`} className="pa-auto my-auto">
                                  <RecipeIngredientListItem ingredient={ingredientData.ingredient} scale={recipeSection.recipeScale} />
                                </div>
                              </Grid>
                            </Container>
                          </ListItem>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <div className="d-flex justify-end mb-4 mt-2">
            <BaseButtonGroup buttons={[
            {
              icon: icons.checkboxMultipleBlankOutline,
              text: t('shopping-list.uncheck-all-items'),
              event: 'uncheck',
            },
            {
              icon: icons.checkboxMultipleMarkedOutline,
              text: t('shopping-list.check-all-items'),
              event: 'check',
            },
          ]} onUncheck={bulkCheckIngredients(false)} onCheck={bulkCheckIngredients(true)} />
          </div>
        </BaseDialog>
      ) : null}
    </div>
  ) : null}
    </>
  );
}
