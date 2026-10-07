import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, List, ListItem, Skeleton } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { VueDraggable } from "vue-draggable-plus";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { Recipe, RecipeIngredient } from "@/lib/api/types/recipe";
import RecipeIngredientEditor from "@/components/Domain/Recipe/RecipeIngredientEditor";
import RecipeDialogBulkAdd from "@/components/Domain/Recipe/RecipeDialogBulkAdd";
import { usePageState } from "@/composables/recipe-page/shared-state";
import { uuid4 } from "@/composables/use-utils";

export default function RecipePageIngredientEditor() {
  const { t } = useTranslation();

  const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
  const ingredientsWithRecipe = new Map<string, boolean>();

  const [drag, setDrag] = useState(false);
  const [domBulkAddDialog, setDomBulkAddDialog] = useState(null);
  const { toggleIsParsing } = usePageState(recipe.slug);

  const hasFoodOrUnit = useMemo(() => {
    if (!recipe) {
      return false;
    }
    if (recipe.recipeIngredient) {
      for (const ingredient of recipe.recipeIngredient) {
        if (ingredient.food || ingredient.unit) {
          return true;
        }
      }
    }
    return false;
  }, []); // WF4-REVIEW: dependency array

  function showBulkAdd() {
    domBulkAddDialog?.open();
  }

  function ingredientIsRecipe(ingredient: RecipeIngredient): boolean {
    if (ingredient.referencedRecipe) {
      return true;
    }

    if (ingredient.referenceId) {
      return !!ingredientsWithRecipe.get(ingredient.referenceId);
    }

    return false;
  }

  function addIngredient(ingredients: Array<string> | null = null) {
    if (ingredients?.length) {
      const newIngredients = ingredients.map((x) => {
        return {
          referenceId: uuid4(),
          title: "",
          note: x,
          unit: undefined,
          food: undefined,
          quantity: 0,
        };
      });

      if (newIngredients) {
        // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
        recipe.recipeIngredient.push(...newIngredients);
      }
    }
    else {
      recipe.recipeIngredient.push({
        referenceId: uuid4(),
        title: "",
        note: "",
        // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
        unit: undefined,
        // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
        food: undefined,
        quantity: 0,
      });
    }
  }

  function addRecipe(recipes: Array<string> | null = null) {
    const refId = uuid4();
    ingredientsWithRecipe.set(refId, true);

    if (recipes?.length) {
      const newRecipes = recipes.map((x) => {
        return {
          referenceId: refId,
          title: "",
          note: x,
          unit: undefined,
          referencedRecipe: undefined,
          quantity: 1,
        };
      });

      if (newRecipes) {
        // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
        recipe.recipeIngredient.push(...newRecipes);
      }
    }
    else {
      recipe.recipeIngredient.push({
        referenceId: refId,
        title: "",
        note: "",
        // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
        unit: undefined,
        // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
        referencedRecipe: undefined,
        quantity: 1,
      });
    }
  }

  function insertNewIngredient(dest: number) {
    recipe.recipeIngredient.splice(dest, 0, {
      referenceId: uuid4(),
      title: "",
      note: "",
      // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
      unit: undefined,
      // @ts-expect-error - prop can be null-type by NoUndefinedField type forces it to be set
      food: undefined,
      quantity: 0,
    });
  }

  return (
    <>
  <div>
    <div className="mb-4">
      <h2 className="mb-4 text-h5 font-weight-medium opacity-80">
        {t("recipe.ingredients")}
      </h2>
      {(!hasFoodOrUnit) ? (
        <Alert border="start" color="info" icon={icons.information} variant="tonal">
          <div>
            {t('recipe.ingredients-not-parsed-description', { parse: t('recipe.parse') })}
          </div>
          <div className="d-flex flex-wrap justify-end mt-3">
            <BaseButton className="mb-1" color="info" onClick={toggleIsParsing(true)}>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {icons.foods}
              </>
              {t('recipe.parse')}
            </BaseButton>
          </div>
        </Alert>
      ) : null}
    </div>
    {(recipe.recipeIngredient.length > 0) ? (
      /* WF4-REVIEW: v-model on complex expression "recipe.recipeIngredient" [J] */
      <VueDraggable handle=".handle" delay={250} delay-on-touch-only={true} {...({
        animation: 200,
        group: 'recipe-ingredients',
        disabled: false,
        ghostClass: 'ghost',
      })} onStart={() => setDrag(true)} onEnd={() => setDrag(false)}>
        {recipe.recipeIngredient.map((ingredient, index) => (
          /* WF4-REVIEW: v-model on complex expression "recipe.recipeIngredient[index]" [J] */
          <RecipeIngredientEditor key={ingredient.referenceId} is-recipe={ingredientIsRecipe(ingredient)} enable-drag-handle enable-context-menu onDelete={recipe.recipeIngredient.splice(index, 1)} onInsertAbove={insertNewIngredient(index)} onInsertBelow={insertNewIngredient(index + 1)} />
        ))}
      </VueDraggable>
    ) : (
      <Skeleton boilerplate elevation="2" type="list-item" />
    )}
    <div className="d-flex flex-wrap justify-center justify-sm-end mt-3">
      <RecipeDialogBulkAdd ref="domBulkAddDialog" className="mx-1 mb-1" style="display: none" onBulkData={addIngredient} />
      <div className="d-inline-flex">
        <Button color="success" className="split-main ml-2" onClick={addIngredient}>
          {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
          <MdiIcon name={icons.createAlt} />
          {t('general.add') || 'Add Food'}
        </Button>
        {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
        <VMenu>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <Button color="success" className="split-dropdown" {...(props)}>
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={icons.chevronDown} />
            </Button>
          </>
          <List>
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem slim density="comfortable" prepend-icon={icons.foods} title={t('new-recipe.add-food')} onClick={addIngredient} />
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem slim density="comfortable" prepend-icon={icons.silverwareForkKnife} title={t('new-recipe.add-recipe')} onClick={addRecipe} />
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem slim density="comfortable" prepend-icon={icons.create} title={t('new-recipe.bulk-add')} onClick={showBulkAdd} />
          </List>
        </VMenu>
      </div>
    </div>
  </div>
    </>
  );
}
