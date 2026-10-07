import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper } from "@mui/material";
import { useUserApi } from "@/composables/api";
import RecipeTimeline from "@/components/Domain/Recipe/RecipeTimeline";

export const handle = {
  middleware: ["auth", "group-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Timeline() {
  const { t } = useTranslation();

  const i18n = useI18n();
  const api = useUserApi();
  const [ready, setReady] = useState(false);

  useSeoMeta({
    title: i18n.t("recipe.timeline"),
  });

  const [groupName, setGroupName] = useState("");
  const [queryFilter, setQueryFilter] = useState("");
  async function fetchHousehold() {
    const { data } = await api.households.getCurrentUserHousehold();
    if (data) {
      setQueryFilter(`recipe.group_id="${data.groupId}"`);
      setGroupName(data.group);
    }

    setReady(true);
  }

  useAsyncData("house-hold", fetchHousehold);

  return (
    <>
  <div>
    {(groupName) ? (
      <BasePageTitle className="mt-n4 pt-8">
        <template>
          {/* WF4-REVIEW: cover → objectFit */}
          <Box component="img" width="100%" max-height="200" max-width="150" src="/svgs/manage-members.svg" />
        </template>
        <template>
          {t("recipe.group-global-timeline", { groupName })}
        </template>
      </BasePageTitle>
    ) : null}
    <Paper className={$vuetify.display.smAndDown ? 'pa-0' : 'px-3 py-0'} style="background-color: transparent;">
      {(queryFilter) ? (
        <RecipeTimeline value={ready} onChange={setReady} show-recipe-cards query-filter={queryFilter} />
      ) : null}
    </Paper>
  </div>
    </>
  );
}
