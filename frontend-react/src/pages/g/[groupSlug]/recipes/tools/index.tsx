import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@mui/material";
import RecipeOrganizerPage from "@/components/Domain/Recipe/RecipeOrganizerPage";
import { useToolStore } from "@/composables/store";
import type { RecipeTool } from "@/lib/api/types/recipe";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  middleware: ["auth", "group-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function ToolsPage() {
  const { t } = useTranslation();

  interface RecipeToolWithOnHand extends RecipeTool {
    onHand: boolean;
  }



  const auth = useMealieAuth();
  const toolStore = useToolStore();
  const i18n = useI18n();

  useSeoMeta({
    title: i18n.t("tool.tools"),
  });

  const userHousehold = useMemo(() => auth.user?.householdSlug || "", []); // WF4-REVIEW: dependency array
  const tools = useMemo(() => toolStore.store.map(tool => (
    {
      ...tool,
      onHand: tool.householdsWithTool?.includes(userHousehold, []); // WF4-REVIEW: dependency array || false,
    } as RecipeToolWithOnHand
  )));

  async function deleteOne(id: string | number) {
    await toolStore.actions.deleteOne(id);
  }

  async function updateOne(tool: RecipeToolWithOnHand) {
    if (userHousehold) {
      if (tool.onHand && !tool.householdsWithTool?.includes(userHousehold)) {
        if (!tool.householdsWithTool) {
          tool.householdsWithTool = [userHousehold];
        }
        else {
          tool.householdsWithTool.push(userHousehold);
        }
      }
      else if (!tool.onHand && tool.householdsWithTool?.includes(userHousehold)) {
        tool.householdsWithTool = tool.householdsWithTool.filter(household => household !== userHousehold);
      }
    }
    await toolStore.actions.updateOne(tool);
  }

  return (
    <>
  <Container>
    {(tools) ? (
      <RecipeOrganizerPage icon={$globals.icons.potSteam} items={tools} item-type="tools" onDelete={deleteOne} onUpdate={updateOne}>
        <template>
          {t("tool.tools")}
        </template>
      </RecipeOrganizerPage>
    ) : null}
  </Container>
    </>
  );
}
