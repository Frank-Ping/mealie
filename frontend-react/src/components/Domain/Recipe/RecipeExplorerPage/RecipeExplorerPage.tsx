import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container, Divider } from "@mui/material";
import { icons } from "@/lib/icons";
import RecipeExplorerPageSearch from "./RecipeExplorerPageParts/RecipeExplorerPageSearch";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import RecipeCardSection from "@/components/Domain/Recipe/RecipeCardSection";
import { useLazyRecipes } from "@/composables/recipes";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function RecipeExplorerPage() {
  const { t } = useTranslation();

  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]

  const { isOwnGroup } = useLoggedInState();
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const { recipes, appendRecipes, replaceRecipes } = useLazyRecipes(isOwnGroup ? null : groupSlug);

  const [ready, setReady] = useState(false);
  const [searchComponent, setSearchComponent] = useState(undefined);

  const searchQuery = useMemo(() => {
    return searchComponent?.passedQueryWithSeed || {};
  }, []); // WF4-REVIEW: dependency array

  function onSearchReady() {
    setReady(true);
  }

  function onItemSelected(item: any, urlPrefix: string) {
    searchComponent?.filterItems(item, urlPrefix);
  }

  return (
    <>
  <Container fluid className="px-0">
    <RecipeExplorerPageSearch ref="searchComponent" onReady={onSearchReady} />
    <Divider />
    <Container className="mt-6 px-md-6 pb-16">
      {(ready) ? (
        <RecipeCardSection className="mt-n5" icon={icons.silverwareForkKnife} title={t('general.recipes')} recipes={recipes} query={searchQuery} disable-sort onItemSelected={onItemSelected} onReplaceRecipes={replaceRecipes} onAppendRecipes={appendRecipes} />
      ) : null}
    </Container>
  </Container>
    </>
  );
}
