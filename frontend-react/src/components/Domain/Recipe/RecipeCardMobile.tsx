import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, Card, CardActions, Collapse, ListItem, ListItemText } from "@mui/material";
import { icons } from "@/lib/icons";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import RecipeCardImage from "./RecipeCardImage";
import RecipeCardRating from "./RecipeCardRating";
import RecipeChips from "./RecipeChips";
import RecipeContextMenu from "./RecipeContextMenu/RecipeContextMenu";
import RecipeFavoriteBadge from "./RecipeFavoriteBadge";
import type { ContextMenuItem } from "./RecipeContextMenu/RecipeContextMenu";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  name: string;
  slug: string;
  description: string;
  rating?: number;
  image?: string;
  tags?: Array<any>;
  recipeId: string;
  vertical?: boolean;
  isFlat?: boolean;
  height?: number;
  disableHighlight?: boolean;
  contextMenuAppendItems?: ContextMenuItem[];
  contextMenuLeadingItems?: ContextMenuItem[];
}

export default function RecipeCardMobile({ rating = 0, image = undefined, tags = [], vertical = false, isFlat = false, height = 150, disableHighlight = false }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  defineEmits<{
    mealplanRemove: [];
    mealplanEdit: [];
    selected: [];
    delete: [slug: string];
  }>();

  const auth = useMealieAuth();
  const { isOwnGroup } = useLoggedInState();

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  const showRecipeContent = useMemo(() => recipeId && slug, []); // WF4-REVIEW: dependency array
  const recipeRoute = useMemo(() => {
    return showRecipeContent ? `/g/${groupSlug}/r/${slug}` : "";
  }, []); // WF4-REVIEW: dependency array
  const cursor = useMemo(() => showRecipeContent ? "pointer" : "auto", []); // WF4-REVIEW: dependency array

  return (
    <>
  <div style={`height: ${height}px;`}>
    {/* WF4-REVIEW: transition semantics */}
    <Collapse in={true}>
      <Card ripple={false} className={[
          isFlat ? 'mx-auto flat' : 'mx-auto',
          { 'disable-highlight': disableHighlight },
        ]} style={{ cursor }} hover height="100%" to={$attrs.selected ? undefined : recipeRoute} onClick={onSelected?.()}>
        {(vertical) ? (
          /* WF4-REVIEW: cover → objectFit */
          <Box component="img" className="rounded-sm" cover>
            <RecipeCardImage tiny icon-size={100} slug={slug} recipe-id={recipeId} image-version={image} height={height} />
          </Box>
        ) : null}
        {/* WF4-REVIEW: @click → ListItemButton */}
        <ListItem lines="two" className="py-0" className={vertical ? 'px-2' : 'px-0'} item-props height="100%" density="compact">
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {(!vertical) ? (
              <slot name="avatar">
                <RecipeCardImage tiny icon-size={100} slug={slug} recipe-id={recipeId} image-version={image} width="125" height={height} />
              </slot>
            ) : null}
          </>
          <div className="pl-4 d-flex flex-column justify-space-between align-stretch pr-2">
            {/* WF4-REVIEW: content → primary prop */}
            <ListItemText className="mt-3 mb-1 text-top text-truncate w-100">
              {name}
            </ListItemText>
            {/* WF4-REVIEW: content → secondary prop */}
            <ListItemText className="ma-0 text-top">
              {(description) ? (
                <SafeMarkdown source={description} />
              ) : (
                <p>
                  <br />
                  <br />
                  <br />
                </p>
              )}
            </ListItemText>
            <div className="d-flex flex-nowrap justify-start ma-0 pt-2 pb-0" style="overflow-x: hidden; overflow-y: hidden; white-space: nowrap;">
              <RecipeChips truncate={true} items={tags} title={false} limit={2} small url-prefix="tags" {...($attrs)} />
            </div>
          </div>
          <slot name="actions">
            <CardActions className="w-100 my-0 px-1 py-0">
              {(isOwnGroup && showRecipeContent) ? (
                <RecipeFavoriteBadge recipe-id={recipeId} show-always className="ma-0 pa-0" />
              ) : (
                <div className="my-0 px-1 py-0" />
              )}
              {(showRecipeContent) ? (
                <RecipeCardRating className={[{ 'pb-2': !isOwnGroup }, 'ml-n2']} model-value={rating} recipe-id={recipeId} />
              ) : null}
              <slot name="context-menu">
                {(isOwnGroup && showRecipeContent) ? (
                  <RecipeContextMenu slug={slug} menu-icon={icons.dotsHorizontal} name={name} recipe-id={recipeId} className="ml-auto" use-items={{
                    delete: false,
                    edit: false,
                    download: true,
                    mealplanner: true,
                    shoppingList: true,
                    print: false,
                    printPreferences: false,
                    share: true,
                  }} leading-items={contextMenuLeadingItems} append-items={contextMenuAppendItems} onDeleted={onDelete?.(slug)} onMealplanRemove={onMealplanRemove?.()} onMealplanEdit={onMealplanEdit?.()} />
                ) : null}
              </slot>
            </CardActions>
          </slot>
        </ListItem>
        <slot />
      </Card>
    </Collapse>
  </div>
    </>
  );
}
