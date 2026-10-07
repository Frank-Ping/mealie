import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@mui/material";
import { icons } from "@/lib/icons";
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
  const { i18n } = useTranslation();

  useSeoMeta({
    title: i18n.t("tool.tools"),
  });

  const userHousehold = useMemo(() => auth.user?.householdSlug || "", []); // WF4-REVIEW: dependency array
  const tools = useMemo(() => toolStore.store.map(tool => (
    {
      ...tool,
      onHand: tool.householdsWithTool?.includes(userHousehold) || false,
    } as RecipeToolWithOnHand
  )), []); // WF4-REVIEW: dependency array

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
      <RecipeOrganizerPage icon={icons.potSteam} items={tools} item-type="tools" onDelete={deleteOne} onUpdate={updateOne}>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {t("tool.tools")}
        </>
      </RecipeOrganizerPage>
    ) : null}
  </Container>
    </>
  );
}
