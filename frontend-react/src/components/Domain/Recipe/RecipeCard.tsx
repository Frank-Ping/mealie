import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, Card, CardActions, CardContent, CardHeader, Collapse } from "@mui/material";
import RecipeFavoriteBadge from "./RecipeFavoriteBadge";
import RecipeChips from "./RecipeChips";
import RecipeContextMenu from "./RecipeContextMenu/RecipeContextMenu";
import RecipeCardImage from "./RecipeCardImage";
import RecipeCardRating from "./RecipeCardRating";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  name: string;
  slug: string;
  description?: string | null;
  rating?: number;
  ratingColor?: string;
  image?: string;
  tags?: Array<any>;
  recipeId: string;
  imageHeight?: number;
}

export default function RecipeCard({ description = null, rating = 0, ratingColor = "secondary", image = undefined, tags = [], imageHeight = 200 }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  defineEmits<{
    click: [];
    delete: [slug: string];
  }>();

  const auth = useMealieAuth();
  const { isOwnGroup } = useLoggedInState();

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  const showRecipeContent = useMemo(() => recipeId && slug, []); // WF4-REVIEW: dependency array
  const recipeRoute = computed<string>(() => {
    return showRecipeContent ? `/g/${groupSlug}/r/${slug}` : "";
  });
  const cursor = useMemo(() => showRecipeContent ? "pointer" : "auto", []); // WF4-REVIEW: dependency array

  return (
    <>
  <div>
    {/* WF4-REVIEW: unmapped <v-hover> — judgement component, convert manually [J] */}
    <VHover open-delay={50}>
      <Card {...(hoverProps)} className={{ 'on-hover': isHovering }} style={{ cursor }} elevation={isHovering ? 12 : 2} to={recipeRoute} min-height={imageHeight + 75} onClick={onClick?.()}>
        <RecipeCardImage small icon-size={imageHeight} height={imageHeight} slug={slug} recipe-id={recipeId} image-version={image}>
          {(description) ? (
            /* WF4-REVIEW: transition semantics */
            <Collapse in={true}>
              {(isHovering) ? (
                <div className="d-flex transition-fast-in-fast-out bg-secondary v-card--reveal" style="height: 100%">
                  <CardContent className="v-card--text-show white--text">
                    <div className="descriptionWrapper">
                      <SafeMarkdown source={description} />
                    </div>
                  </CardContent>
                </div>
              ) : null}
            </Collapse>
          ) : null}
        </RecipeCardImage>
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="px-4" style="font-size: 1.25rem;">
          {name}
        </CardHeader>
        <div className="recipe-card-footer" className={{ 'recipe-card-footer--no-tags': tags.length === 0 }}>
          {(tags.length > 0) ? (
            <RecipeChips className="recipe-card-tags px-4" truncate={false} items={tags} title={false} limit={2} small url-prefix="tags" {...($attrs)} />
          ) : null}
          <slot name="actions">
            {(showRecipeContent) ? (
              <CardActions className="recipe-card-actions px-1 py-0">
                {(isOwnGroup) ? (
                  <RecipeFavoriteBadge recipe-id={recipeId} show-always />
                ) : (
                  <div className="px-1" />
                )}
                <RecipeCardRating model-value={rating} recipe-id={recipeId} />
                <Box sx={ flexGrow: 1 } />
                {(isOwnGroup && showRecipeContent) ? (
                  <RecipeContextMenu color="grey-darken-2" slug={slug} menu-icon={$globals.icons.dotsVertical} name={name} recipe-id={recipeId} use-items={{
                  delete: false,
                  edit: false,
                  download: true,
                  mealplanner: true,
                  shoppingList: true,
                  print: false,
                  printPreferences: false,
                  share: true,
                }} onDeleted={onDelete?.(slug)} />
                ) : null}
              </CardActions>
            ) : null}
          </slot>
        </div>
        <slot />
      </Card>
    </VHover>
  </div>
    </>
  );
}
