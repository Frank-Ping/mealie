import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper } from "@mui/material";
import { useUserApi } from "@/composables/api";
import RecipeTimeline from "@/components/Domain/Recipe/RecipeTimeline";

export const handle = {
  middleware: ["auth", "group-only"],
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Timeline() {
  const { t } = useTranslation();

  const { i18n } = useTranslation();
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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        fetchHousehold
      }
      catch (err) {
        if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
      }
    })();
    return () => { cancelled = true; };
  }, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow

  return (
    <>
  <div>
    {(groupName) ? (
      <BasePageTitle className="mt-n4 pt-8">
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {/* WF4-REVIEW: cover → objectFit */}
          <Box component="img" width="100%" max-height="200" max-width="150" src="/svgs/manage-members.svg" />
        </>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {t("recipe.group-global-timeline", { groupName })}
        </>
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
