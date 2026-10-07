import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Avatar, ListItem, ListItemText } from "@mui/material";
import RecipeCardImage from "./RecipeCardImage";
import type { RecipeSummary } from "@/lib/api/types/recipe";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  recipe: RecipeSummary;
  active?: boolean;
  disableLink?: boolean;
}

export default function RecipeCardLineItem({ active = false, disableLink = false }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]

  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  const recipeRoute = useMemo(() =>  {
    if (disableLink || !recipe.slug, []); // WF4-REVIEW: dependency array {
      return undefined;
    }

    return `/g/${groupSlug}/r/${recipe.slug}`;
  });

  return (
    <>
  {/* WF4-REVIEW: @click → ListItemButton */}
  <ListItem active={active} to={recipeRoute} className={{ 'cursor-pointer': !recipeRoute }}>
    <template>
      <Avatar className="recipe-thumbnail" rounded="lg" width="56" height="40">
        <RecipeCardImage tiny recipe-id={recipe.id!} slug={recipe.slug} image-version={recipe.image} height="40" min-height="0" icon-size={24} />
      </Avatar>
    </template>
    {/* WF4-REVIEW: content → primary prop */}
    <ListItemText className="text-truncate">
      {recipe.name}
    </ListItemText>
    {($slots.subtitle) ? (
      /* WF4-REVIEW: content → secondary prop */
      <ListItemText>
        <slot name="subtitle" />
      </ListItemText>
    ) : null}
    {($slots.append) ? (
      <template>
        <slot name="append" />
      </template>
    ) : null}
  </ListItem>
    </>
  );
}
