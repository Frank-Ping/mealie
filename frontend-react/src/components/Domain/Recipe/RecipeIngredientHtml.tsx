import { useMemo } from "react";
import type { RecipeIngredient } from "@/lib/api/types/recipe";
import { useIngredientTextParser } from "@/composables/recipes";

interface Props {
  ingredient?: RecipeIngredient;
  scale?: number;
}

export default function RecipeIngredientHtml({ ingredient, scale }: Props) {
  const { ingredient, scale = 1 } = /* props via destructured signature */
  const { useParsedIngredientText } = useIngredientTextParser();

  const baseText = useMemo(() => {
    if (!ingredient) return "";
    const parsed = useParsedIngredientText(ingredient, scale);
    return [parsed.quantity, parsed.unit, parsed.name].filter(Boolean).join(" ").trim();
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  <div className="ingredient-link-label links-disabled">
    {(baseText) ? (
      <SafeMarkdown source={baseText} />
    ) : null}
    {(ingredient?.note) ? (
      <SafeMarkdown className="d-inline" source={` ${ingredient.note}`} />
    ) : null}
  </div>
    </>
  );
}
