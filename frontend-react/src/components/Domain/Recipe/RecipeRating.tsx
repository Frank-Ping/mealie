import { useMemo, useState } from "react";
import { Rating } from "@mui/material";
import { useMediaQuery } from "@vueuse/core";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { useUserSelfRatings } from "@/composables/use-users";

interface Props {
  readonly?: boolean;
  recipeId?: string;
  slug?: string;
  small?: boolean;
}

export default function RecipeRating({ readonly = false, recipeId = "", slug = "", small = false }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const groupRating = defineModel<number>({ default: 0 });

  const { isOwnGroup } = useLoggedInState();
  const isReadonly = useMemo(() => readonly || !isOwnGroup, []); // WF4-REVIEW: dependency array
  const { userRatings, setRating } = useUserSelfRatings();

  // on touch devices a tap fires mouseenter without a matching mouseleave, which leaves v-rating
  // rendering the stuck hover value instead of the model value
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  const userRating = useMemo(() =>  {
    return userRatings.find(r => r.recipeId === recipeId, []); // WF4-REVIEW: dependency array?.rating ?? null;
  });

  const [localUserRating, setLocalUserRating] = useState(userRating);

  // while a write is in flight a refetch may still report the pre-click value, so ignore it
  const [pendingWrites, setPendingWrites] = useState(0);
  /* WF4-REVIEW [J] */ watch(userRating, (value) => {
    if (!pendingWrites) {
      setLocalUserRating(value);
    }
  });

  // only fall back to the group average when we can't offer the user their own rating,
  // and only when there's actually a group average to show. An unset rating may be null or 0
  const showGroupAverage = computed(() => {
    return isReadonly && !localUserRating && !!groupRating;
  });

  const displayRating = useMemo(() =>  {
    return showGroupAverage ? groupRating : (localUserRating || 0, []); // WF4-REVIEW: dependency array
  });

  async function updateRating(val?: number) {
    if (isReadonly) {
      return;
    }

    // user ratings are always whole stars
    let rating = Math.round(val ?? 0);
    if (rating === localUserRating) {
      rating = 0;
    }

    setLocalUserRating(rating);

    pendingWrites++;
    try {
      await setRating(slug, rating, null);
    }
    finally {
      pendingWrites--;
    }
  }

  return (
    <>
  <div onClick={(e) => { e.preventDefault(); ; }}>
    <Rating model-value={displayRating} active-color={showGroupAverage ? 'grey-darken-1' : 'secondary'} color="secondary-lighten-3" length="5" half-increments={showGroupAverage} density={small ? 'compact' : 'default'} size={small ? 'x-small' : undefined} readonly={isReadonly} hover={!isReadonly && canHover} clearable={!!displayRating} onUpdateModelValue={updateRating(+$event)} />
  </div>
    </>
  );
}
