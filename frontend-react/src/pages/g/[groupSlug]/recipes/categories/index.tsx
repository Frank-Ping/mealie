import { useTranslation } from "react-i18next";
import { Container } from "@mui/material";
import { icons } from "@/lib/icons";
import RecipeOrganizerPage from "@/components/Domain/Recipe/RecipeOrganizerPage";
import { useCategoryStore } from "@/composables/store";

export const handle = {
  middleware: ["auth", "group-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function CategoriesPage() {
  const { t } = useTranslation();

  const { store, actions } = useCategoryStore();
  const { i18n } = useTranslation();

  useSeoMeta({
    title: i18n.t("category.categories"),
  });

  return (
    <>
  <Container>
    {(store) ? (
      <RecipeOrganizerPage items={store} icon={icons.categories} item-type="categories" onDelete={actions.deleteOne} onUpdate={actions.updateOne}>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {t("category.categories")}
        </>
      </RecipeOrganizerPage>
    ) : null}
  </Container>
    </>
  );
}
