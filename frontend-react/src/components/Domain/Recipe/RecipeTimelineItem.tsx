import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { TimelineItem } from "@mui/lab";
import { Box, Card, CardContent, CardHeader, Chip, Divider, Grid } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import RecipeCardMobile from "./RecipeCardMobile";
import RecipeTimelineContextMenu from "./RecipeTimelineContextMenu";
import { useStaticRoutes } from "@/composables/api";
import { useTimelineEventTypes } from "@/composables/recipes/use-recipe-timeline-events";
import type { Recipe, RecipeTimelineEventOut, RecipeTimelineEventUpdate } from "@/lib/api/types/recipe";
import UserAvatar from "@/components/Domain/User/UserAvatar";
import SafeMarkdown from "@/components/global/SafeMarkdown";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  event: RecipeTimelineEventOut;
  recipe?: Recipe;
  showRecipeCards?: boolean;
}

export default function RecipeTimelineItem({ recipe = undefined, showRecipeCards = false }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  defineEmits<{
    selected: [];
    update: [event: RecipeTimelineEventUpdate];
    delete: [];
  }>();

  // icons imported directly (was $globals)
  const display = useDisplay();
  const { recipeTimelineEventSmallImage } = useStaticRoutes();
  const { eventTypeOptions } = useTimelineEventTypes();

  const { user: currentUser } = useMealieAuth();

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => (route.params.groupSlug as string) || currentUser?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const useMobileFormat = useMemo(() => {
    return display.smAndDown;
  }, []); // WF4-REVIEW: dependency array

  const attrs = useMemo(() => {
    if (useMobileFormat) {
      return {
        class: "px-0",
        small: false,
        avatar: {
          size: "30px",
          class: "pr-0",
        },
        image: {
          maxHeight: "250",
          class: "my-3",
        },
      };
    }
    else {
      return {
        class: "px-3",
        small: false,
        avatar: {
          size: "42px",
          class: "",
        },
        image: {
          maxHeight: "300",
          class: "mb-5",
        },
      };
    }
  }, []); // WF4-REVIEW: dependency array

  const icon = useMemo(() => {
    const option = eventTypeOptions.find(option => option === event.eventType);
    return option ? option.icon : icons.informationVariant;
  }, []); // WF4-REVIEW: dependency array

  const [hideImage, setHideImage] = useState(false);
  const eventImageUrl = useMemo(() => {
    if (event.image !== "has image") {
      return "";
    }

    return recipeTimelineEventSmallImage(event.recipeId, event.id);
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  <TimelineItem className={attrs.class} fill-dot small={attrs.small} icon={icon} dot-color="primary">
    {(!useMobileFormat) ? (
      /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
      <>
        {(event.timestamp) ? (
          <Chip label large>
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={icons.calendar} className="mr-1" />
            {$d(new Date(event.timestamp))}
          </Chip>
        ) : null}
      </>
    ) : null}
    <Card hover to={$attrs.selected || !recipe ? undefined : `/g/${groupSlug}/r/${recipe.slug}`} className="elevation-12" onClick={onSelected?.()}>
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader className="background">
        <Grid container>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid align-self="center" cols={useMobileFormat ? 'auto' : '2'} className={attrs.avatar.class}>
            <UserAvatar user-id={event.userId} size={attrs.avatar.size} />
          </Grid>
          {(useMobileFormat) ? (
            /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
            <Grid align-self="center" className="pr-0">
              <Chip label>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={icons.calendar} />
                {$d(new Date(event.timestamp || ""))}
              </Chip>
            </Grid>
          ) : (
            /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
            <Grid cols="9" className="text-wrap break-word" style="margin: auto; text-align: center">
              {event.subject}
            </Grid>
          )}
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid cols={useMobileFormat ? 'auto' : '1'} className="px-0 pt-0">
            {(currentUser && currentUser.id == event.userId && event.eventType != 'system') ? (
              <RecipeTimelineContextMenu menu-top={false} event={event} menu-icon={icons.dotsVertical} color="transparent" elevation={0} card-menu={false} use-items={{
                edit: true,
                delete: true,
              }} onUpdate={onUpdate?.($event)} onDelete={onDelete?.()} />
            ) : null}
          </Grid>
        </Grid>
      </CardHeader>
      {(showRecipeCards && recipe) ? (
        <CardContent className="background">
          <Grid container className={useMobileFormat ? 'py-3 mx-0' : 'py-3 mx-0'} style="max-width: 100%">
            {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
            <Grid align-self="center" className="pa-0">
              <RecipeCardMobile disable-highlight vertical={useMobileFormat} name={recipe.name} slug={recipe.slug} description={recipe.description} rating={recipe.rating} image={recipe.image} recipe-id={recipe.id} is-flat={true} />
            </Grid>
          </Grid>
        </CardContent>
      ) : null}
      {(showRecipeCards && recipe && (useMobileFormat || event.eventMessage)) ? (
        <Divider />
      ) : null}
      <CardContent className="background">
        <Grid container>
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid>
            {(useMobileFormat) ? (
              <strong className="break-word">
                {event.subject}
              </strong>
            ) : null}
            {(eventImageUrl) ? (
              /* WF4-REVIEW: cover → objectFit */
              <Box component="img" src={eventImageUrl} min-height="50" height={hideImage ? undefined : 'auto'} max-height={attrs.image.maxHeight} contain className={attrs.image.class} onError={() => setHideImage(true)} />
            ) : null}
            {(event.eventMessage) ? (
              <div className="break-word" className={useMobileFormat ? 'text-caption' : ''}>
                <SafeMarkdown source={event.eventMessage} />
              </div>
            ) : null}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  </TimelineItem>
    </>
  );
}
