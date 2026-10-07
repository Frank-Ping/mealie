import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "@mui/material";
import { icons } from "@/lib/icons";
import RecipeCardSection from "@/components/Domain/Recipe/RecipeCardSection";
import { useLazyRecipes } from "@/composables/recipes";
import { useLoggedInState } from "@/composables/use-logged-in-state";

export const handle = {
  middleware: ["auth"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Favorites() {
  const { t } = useTranslation();

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const { i18n } = useTranslation();
  const { isOwnGroup } = useLoggedInState();

  useSeoMeta({
    title: i18n.t("general.favorites"),
  });

  const userId = route.params.id;
  const query = { queryFilter: `favoritedBy.id = "${userId}"` };
  const { recipes, appendRecipes, assignSorted, removeRecipe, replaceRecipes } = useLazyRecipes();

  return (
    <>
  <Container>
    {(recipes && isOwnGroup) ? (
      <RecipeCardSection icon={icons.heart} title={t('user.user-favorites')} recipes={recipes} query={query} onSortRecipes={assignSorted} onReplaceRecipes={replaceRecipes} onAppendRecipes={appendRecipes} onDelete={removeRecipe} />
    ) : null}
  </Container>
    </>
  );
}
