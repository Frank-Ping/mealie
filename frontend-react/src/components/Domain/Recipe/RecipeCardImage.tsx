import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useStaticRoutes } from "@/composables/api";

interface Props {
  tiny?: boolean | null;
  small?: boolean | null;
  large?: boolean | null;
  iconSize?: number | string;
  slug?: string | null;
  recipeId: string;
  // Recipe.image is typed unknown in the generated API types, so callers
  // passing it directly cannot narrow to string here.
  imageVersion?: unknown;
  height?: number | string;
  minHeight?: number | string;
}

export default function RecipeCardImage({ tiny = null, small = null, large = null, iconSize = 100, slug = null, imageVersion = null, height = "100%", minHeight = 125 }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  defineEmits<{
    click: [];
  }>();

  const { recipeImage, recipeSmallImage, recipeTinyImage } = useStaticRoutes();

  const [fallBackImage, setFallBackImage] = useState(false);

  // Recipes without an image have no image version, so there is nothing to fetch.
  // Rendering the image anyway would only produce a 404 before falling back.
  const showImage = useMemo(() => !!imageVersion && !fallBackImage, []); // WF4-REVIEW: dependency array

  const imageSize = useMemo(() =>  {
    if (tiny, []); // WF4-REVIEW: dependency array return "tiny";
    if (small) return "small";
    if (large) return "large";
    return "large";
  });

  /* WF4-REVIEW [J] */ watch(
    [() => recipeId, () => imageVersion],
    () => {
      setFallBackImage(false);
    },
  );

  function getImage(recipeId: string) {
    switch (imageSize) {
      case "tiny":
        return recipeTinyImage(recipeId, imageVersion);
      case "small":
        return recipeSmallImage(recipeId, imageVersion);
      case "large":
        return recipeImage(recipeId, imageVersion);
    }
  }

  return (
    <>
  {(showImage) ? (
    /* WF4-REVIEW: cover → objectFit */
    <Box component="img" height={height} cover min-height={minHeight} max-height="fill-height" src={getImage(recipeId)} onClick={onClick?.()} onLoad={fallBackImage = false} onError={fallBackImage = true}>
      <slot />
    </Box>
  ) : (
    <div className="icon-slot" onClick={onClick?.()}>
      {/* WF4-REVIEW: icon name resolves via lib/icons */}
      <MdiIcon name={$globals.icons.primary} color="primary" className="icon-position" size={iconSize} />
      <slot />
    </div>
  )}
    </>
  );
}
