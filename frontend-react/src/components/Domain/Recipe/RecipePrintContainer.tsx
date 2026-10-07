import RecipePrintView from "@/components/Domain/Recipe/RecipePrintView";
import type { Recipe } from "@/lib/api/types/recipe";

interface Props {
  recipe: Recipe;
  scale?: number;
}

export default function RecipePrintContainer({ scale = 1 }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  return (
    <>
  <div className="print-container">
    <RecipePrintView recipe={recipe} scale={scale} density={'compact'} />
  </div>
    </>
  );
}
