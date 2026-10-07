import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CardContent, Container, Paper, Typography } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useLazyRecipes } from "@/composables/recipes";
import RecipeCardSection from "@/components/Domain/Recipe/RecipeCardSection";
import { useCookbookStore } from "@/composables/store/use-cookbook-store";
import { useCookbook } from "@/composables/use-group-cookbooks";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import type { ReadCookBook } from "@/lib/api/types/cookbook";
import CookbookEditor from "@/components/Domain/Cookbook/CookbookEditor";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function CookbookPage() {
  const { t } = useTranslation();

  const auth = useMealieAuth();
  const { isOwnGroup } = useLoggedInState();

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const { recipes, appendRecipes, assignSorted, removeRecipe, replaceRecipes } = useLazyRecipes(isOwnGroup ? null : groupSlug);
  const slug = route.params.slug as string;
  const { getOne } = useCookbook(isOwnGroup ? null : groupSlug);
  const { actions } = useCookbookStore();
  const navigate = useNavigate();

  const book = getOne(slug);

  const isOwnHousehold = useMemo(() => {
    if (!(auth.user && book?.householdId)) {
      return false;
    }

    return auth.user.householdId === book.householdId;
  }, []); // WF4-REVIEW: dependency array
  const canEdit = useMemo(() => isOwnGroup && isOwnHousehold, []); // WF4-REVIEW: dependency array

  const dialogStates = /* WF4-REVIEW [J] */ reactive({
    edit: false,
  });

  const [editTarget, setEditTarget] = useState(null);
  function handleEditCookbook() {
    dialogStates.edit = true;
    setEditTarget(book);
  }

  async function editCookbook() {
    if (!editTarget) {
      return;
    }
    const response = await actions.updateOne(editTarget);

    if (response?.slug && book?.slug !== response?.slug) {
      // if name changed, redirect to new slug
      navigate(`/g/${route.params.groupSlug}/cookbooks/${response?.slug}`);
    }
    else {
      // otherwise reload the page, since the recipe criteria changed
      router.go(0);
    }
    dialogStates.edit = false;
    setEditTarget(null);
  }

  useSeoMeta({
    title: book?.name || "Cookbook",
  });

  return (
    <>
  <div>
    {(editTarget) ? (
      /* WF4-REVIEW: v-model on complex expression "dialogStates.edit" [J] */
      <BaseDialog width="100%" max-width="1100px" icon={icons.pages} title={t('general.edit')} submit-icon={icons.save} submit-text={t('general.save')} submit-disabled={!editTarget.queryFilterString} can-submit onSubmit={editCookbook}>
        <CardContent>
          <CookbookEditor value={editTarget} onChange={setEditTarget} />
        </CardContent>
      </BaseDialog>
    ) : null}
    {(book) ? (
      <Container className="my-0">
        <Paper color="transparent" className="d-flex flex-column w-100 pa-0 ma-0" elevation="0">
          <div className="d-flex align-center w-100 mb-2">
            <Typography variant="h6" className="headline mb-0">
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={icons.pages} size="large" className="mr-3" />
              {book.name}
            </Typography>
            {(canEdit) ? (
              <BaseButton className="mx-1" edit={true} onClick={handleEditCookbook} />
            ) : null}
          </div>
          {(book.description) ? (
            <div className="subtitle-1 text-grey-lighten-1 mb-2">
              {book.description}
            </div>
          ) : null}
        </Paper>
        <Container className="pa-0">
          <RecipeCardSection className="mb-5 mx-1" recipes={recipes} query={{ cookbook: slug }} onSortRecipes={assignSorted} onReplaceRecipes={replaceRecipes} onAppendRecipes={appendRecipes} onDelete={removeRecipe} />
        </Container>
      </Container>
    ) : null}
  </div>
    </>
  );
}
