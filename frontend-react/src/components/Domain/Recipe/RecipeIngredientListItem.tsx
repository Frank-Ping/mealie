import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import type { RecipeIngredient } from "@/lib/api/types/household";
import { useIngredientTextParser } from "@/composables/recipes";
import RecipeIngredientSubstitutions from "@/components/Domain/Recipe/RecipeIngredientSubstitutions";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  ingredient: RecipeIngredient;
  scale?: number;
  // off by default: the shopping list and the add-to-list dialog reuse this row, and a menu
  // button is noise in both. the recipe renderer opts in
  showSubstitutions?: boolean;
}

export default function RecipeIngredientListItem({ scale = 1, showSubstitutions = false }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const auth = useMealieAuth();
  const groupSlug = useMemo(() => route.params.groupSlug || auth.user??.groupSlug || "", []); // WF4-REVIEW: dependency array
  const { useParsedIngredientText } = useIngredientTextParser();

  const parsedIng = useMemo(() =>  {
    return useParsedIngredientText(ingredient, scale, true, groupSlug.toString(, []); // WF4-REVIEW: dependency array);
  });

  return (
    <>
  <div className="text-subtitle-1 dense-markdown ingredient-item">
    {(parsedIng.quantity) ? (
      <SafeMarkdown className="d-inline" source={parsedIng.quantity} />
    ) : null}
    {(parsedIng.unit) ? (
      <template>
        {parsedIng.unit}
      </template>
    ) : null}
    {(parsedIng.note && !parsedIng.name) ? (
      <template>
        <SafeMarkdown className="text-bold d-inline" source={parsedIng.note} />
        {(showSubstitutions) ? (
          <RecipeIngredientSubstitutions ingredient={ingredient} scale={scale} />
        ) : null}
      </template>
    ) : (parsedIng.recipeLink) ? (
      <template>
        <SafeMarkdown className="text-bold d-inline" source={parsedIng.recipeLink} />
        {(showSubstitutions) ? (
          <RecipeIngredientSubstitutions ingredient={ingredient} scale={scale} />
        ) : null}
        {(parsedIng.note) ? (
          <SafeMarkdown className="note" source={parsedIng.note} />
        ) : null}
      </template>
    ) : (
      <template>
        {(parsedIng.name) ? (
          <SafeMarkdown className="text-bold d-inline" source={parsedIng.name} />
        ) : null}
        {(showSubstitutions) ? (
          <RecipeIngredientSubstitutions ingredient={ingredient} scale={scale} />
        ) : null}
        {(parsedIng.note) ? (
          <SafeMarkdown className="note" source={parsedIng.note} />
        ) : null}
      </template>
    )}
  </div>
    </>
  );
}
