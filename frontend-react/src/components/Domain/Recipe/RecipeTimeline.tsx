import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Timeline } from "@mui/lab";
import { Badge, Box, Button, Card, CardHeader, Divider, Grid, List, ListItem, ListItemText } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useThrottleFn, whenever } from "@vueuse/core";
import RecipeTimelineItem from "./RecipeTimelineItem";
import { useTimelinePreferences } from "@/composables/use-users/preferences";
import { useTimelineEventTypes } from "@/composables/recipes/use-recipe-timeline-events";
import { alert } from "@/composables/use-toast";
import { useUserApi } from "@/composables/api";
import type { Recipe, RecipeTimelineEventOut, RecipeTimelineEventUpdate, TimelineEventType } from "@/lib/api/types/recipe";

interface Props {
  modelValue?: boolean;
  queryFilter: string;
  maxHeight?: number | string;
  showRecipeCards?: boolean;
}

export default function RecipeTimeline({ modelValue = false, maxHeight = undefined, showRecipeCards = false }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const api = useUserApi();
  const { i18n } = useTranslation();
  const preferences = useTimelinePreferences();
  const { eventTypeOptions } = useTimelineEventTypes();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 32;
  const [hasMore, setHasMore] = useState(true);

  const [timelineEvents, setTimelineEvents] = useState([] as RecipeTimelineEventOut[]);
  const recipes = new Map<string, Recipe>();
  const filterBadgeCount = useMemo(() => eventTypeOptions.length - preferences.types.length, []); // WF4-REVIEW: dependency array
  const eventTypeFilterState = useMemo(() => {
    return eventTypeOptions.map((option) => {
      return {
        ...option,
        checked: preferences.types.includes(option),
      };
    });
  }, []); // WF4-REVIEW: dependency array
  const screenBuffer = 4;

  whenever(
    () => modelValue,
    () => {
      initializeTimelineEvents();
    },
  );

  // Preferences
  function reverseSort() {
    if (loading) {
      return;
    }

    preferences.orderDirection = preferences.orderDirection === "asc" ? "desc" : "asc";
    initializeTimelineEvents();
  }

  function toggleEventTypeOption(option: TimelineEventType) {
    if (loading) {
      return;
    }

    const index = preferences.types.indexOf(option);
    if (index === -1) {
      preferences.types.push(option);
    }
    else {
      preferences.types.splice(index, 1);
    }

    initializeTimelineEvents();
  }

  // Timeline Actions
  async function updateTimelineEvent(index: number, event: RecipeTimelineEventUpdate) {
    const eventId = timelineEvents[index].id;
    const { response } = await api.recipes.updateTimelineEvent(eventId, event);
    if (response?.status !== 200) {
      alert.error(i18n.t("events.something-went-wrong") as string);
      return;
    }

    // Update the local event data to reflect the changes in the UI
    timelineEvents[index] = response.data;

    alert.success(i18n.t("events.event-updated") as string);
  }

  async function deleteTimelineEvent(index: number) {
    const { response } = await api.recipes.deleteTimelineEvent(timelineEvents[index].id);
    if (response?.status !== 200) {
      alert.error(i18n.t("events.something-went-wrong") as string);
      return;
    }

    timelineEvents.splice(index, 1);
    alert.success(i18n.t("events.event-deleted") as string);
  }

  async function getRecipes(recipeIds: string[]): Promise<Recipe[]> {
    let qf = "";
    if (recipeIds.length) {
      qf = "id IN [" + recipeIds.map(id => `"${id}"`).join(", ") + "]";
    }
    const { data } = await api.recipes.getAll(1, -1, { queryFilter: qf });
    return data?.items || [];
  }

  async function updateRecipes(events: RecipeTimelineEventOut[]) {
    const recipeIds: string[] = [];
    events.forEach((event) => {
      if (recipeIds.includes(event.recipeId) || recipes.has(event.recipeId)) {
        return;
      }

      recipeIds.push(event.recipeId);
    });

    const results = await getRecipes(recipeIds);
    results.forEach((result) => {
      if (!result?.id) {
        return;
      }
      recipes.set(result.id, result);
    });
  }

  async function scrollTimelineEvents() {
    const orderBy = "timestamp";
    const orderDirection = preferences.orderDirection === "asc" ? "asc" : "desc";

    const eventTypeValue = `["${preferences.types.join("\", \"")}"]`;
    const queryFilter = `(${queryFilter}) AND eventType IN ${eventTypeValue}`;

    const response = await api.recipes.getAllTimelineEvents(page, perPage, { orderBy, orderDirection, queryFilter });
    page += 1;
    if (!response?.data) {
      return;
    }

    const events = response.data.items;
    if (events.length < perPage) {
      setHasMore(false);
      if (!events.length) {
        return;
      }
    }

    // fetch recipes
    if (showRecipeCards) {
      await updateRecipes(events);
    }

    // this is set last so Vue knows to re-render
    timelineEvents.push(...events);
  }

  async function initializeTimelineEvents() {
    setLoading(true);
    setReady(false);

    setPage(1);
    setHasMore(true);
    setTimelineEvents([]);
    await scrollTimelineEvents();

    setReady(true);
    setLoading(false);
  }

  const infiniteScroll = useThrottleFn(async () => {
    if (!hasMore || loading) {
      return;
    }
    setLoading(true);
    try {
      await scrollTimelineEvents();
    }
    finally {
      setLoading(false);
    }
  }, 500);

  // preload events
  initializeTimelineEvents();

  /* WF4-REVIEW [J] */ onMounted(
    () => {
      document.onscroll = () => {
        // if the inner element is scrollable, let its scroll event handle the infiniteScroll
        const timelineContainerElement = document.getElementById("timeline-container");
        if (timelineContainerElement) {
          const { clientHeight, scrollHeight } = timelineContainerElement;

          // if scrollHeight == clientHeight, the element is not scrollable, so we need to look at the global position
          // if scrollHeight > clientHeight, it is scrollable and we don't need to do anything here
          if (scrollHeight > clientHeight) {
            return;
          }
        }

        const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight >= document.documentElement.offsetHeight - (window.innerHeight * screenBuffer);
        if (bottomOfWindow) {
          infiniteScroll();
        }
      };
    },
  );

  return (
    <>
  <div style="height: 100%;">
    <Grid container className="mb-0 mt-3 mx-7">
      <Box sx={{ flexGrow: 1 }} />
      {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
      <Grid className="text-right">
        {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
        <VMenu offset-y bottom start nudge-bottom="3" close-on-content-click={false}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {/* WF4-REVIEW: content → badgeContent */}
            <Badge content={filterBadgeCount} model-value={filterBadgeCount > 0} bordered>
              <Button variant="text" {...(activatorProps)} prepend-icon={icons.filter}>
                {t("general.filter")}
              </Button>
            </Badge>
          </>
          <Card>
            <List>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem prepend-icon={preferences.orderDirection === 'asc' ? icons.sortCalendarDescending : icons.sortCalendarAscending} title={preferences.orderDirection === 'asc' ? t('general.sort-descending') : t('general.sort-ascending')} onClick={reverseSort} />
              <Divider />
              {/* WF4-REVIEW: unparseable v-for "option, idx in eventTypeFilterState" */}
                /* WF4-REVIEW: @click → ListItemButton */
                <ListItem key={idx} active={option.checked} color={option.checked ? 'primary' : undefined} onClick={toggleEventTypeOption(option)}>
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    {/* WF4-REVIEW: icon name resolves via lib/icons */}
                    <MdiIcon name={option.icon} />
                  </>
                  {/* WF4-REVIEW: content → primary prop */}
                  <ListItemText>
                    {option.label}
                  </ListItemText>
                </ListItem>
            </List>
          </Card>
        </VMenu>
      </Grid>
    </Grid>
    {(timelineEvents.length) ? (
      <div id="timeline-container" height="fit-content" width="100%" className="px-1" style={maxHeight ? `max-height: ${maxHeight}; overflow-y: auto;` : ''}>
        {/* WF4-REVIEW: lab component */}
        <Timeline density={$vuetify.display.smAndDown ? ($vuetify.display.xs ? 'compact' : 'comfortable') : undefined} justify="center" className="timeline">
          {timelineEvents.map((event, index) => (
            <RecipeTimelineItem key={event.id} event={event} recipe={recipes.get(event.recipeId)} show-recipe-cards={showRecipeCards} width={$vuetify.display.smAndDown ? '100%' : undefined} onUpdate={updateTimelineEvent(index, $event)} onDelete={deleteTimelineEvent(index)} />
          ))}
        </Timeline>
      </div>
    ) : (!loading) ? (
      <Card className="mt-2">
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="justify-center pa-9">
          {t("recipe.timeline-no-events-found-try-adjusting-filters")}
        </CardHeader>
      </Card>
    ) : null}
    {(loading) ? (
      <div className="mb-3 text-center">
        <AppLoader loading={loading} waiting-text={t('general.loading-events')} />
      </div>
    ) : null}
  </div>
    </>
  );
}
