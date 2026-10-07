import { useMemo } from "react";
import { useUserSelfRatings } from "@/composables/use-users";

interface Props {
  modelValue?: number;
  recipeId?: string;
}

type Star = "full" | "half" | "empty";

export default function RecipeCardRating({ modelValue = 0, recipeId = "" }: Props) {
  const props = /* props via generated interface + destructured signature */

  const { userRatings } = useUserSelfRatings();

  const userRating = useMemo(() => {
    return userRatings.find(r => r.recipeId === recipeId)?.rating ?? null;
  }, []); // WF4-REVIEW: dependency array

  // this display is always readonly, so we show the user's own rating if they have one,
  // and otherwise fall back to the group average (in grey), if there is one.
  // An unset rating may be null or 0
  const showGroupAverage = useMemo(() => !userRating && !!modelValue, []); // WF4-REVIEW: dependency array
  const ratingValue = useMemo(() => (showGroupAverage ? modelValue : userRating) || 0, []); // WF4-REVIEW: dependency array
  const ratingDisplay = useMemo(() => {
      const stars: Star[] = [];

      for (let i = 0; i < 5; i++) {
        const diff = ratingValue - i;
        if (diff >= 1) {
          stars.push("full");
        }
        else if (diff >= 0.25) { // round to half star if rating is at least 0.25 but not quite a full star
          stars.push("half");
        }
        else {
          stars.push("empty");
        }
      }

      return stars;
    },, []); // WF4-REVIEW: dependency array

  return (
    <>
  <div className="rating-display">
    {ratingDisplay.map((star, index) => (
      <span key={index} className="star" className={{
        'star-half': star === 'half',
        'text-secondary': !showGroupAverage,
        'text-grey-darken-1': showGroupAverage,
      }}>
        {(star === 'empty' || star === 'half') ? (
          <span className="star-empty">
            ☆
          </span>
        ) : null}
        {(star === 'full' || star === 'half') ? (
          <span className="star-full">
            ★
          </span>
        ) : null}
      </span>
    ))}
  </div>
    </>
  );
}
