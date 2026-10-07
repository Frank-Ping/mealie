import { useTranslation } from "react-i18next";
import { Container } from "@mui/material";
import { icons } from "@/lib/icons";
import RecipeOrganizerPage from "@/components/Domain/Recipe/RecipeOrganizerPage";
import { useTagStore } from "@/composables/store";

export const handle = {
  middleware: ["auth", "group-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function TagsPage() {
  const { t } = useTranslation();

  const { store, actions } = useTagStore();
  const { i18n } = useTranslation();

  useSeoMeta({
    title: i18n.t("tag.tags"),
  });

  return (
    <>
  <Container>
    {(store) ? (
      <RecipeOrganizerPage items={store} icon={icons.tags} item-type="tags" onDelete={actions.deleteOne} onUpdate={actions.updateOne}>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {t("tag.tags")}
        </>
      </RecipeOrganizerPage>
    ) : null}
  </Container>
    </>
  );
}
