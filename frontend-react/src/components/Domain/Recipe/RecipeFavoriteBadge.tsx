import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Tooltip } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useUserSelfRatings } from "@/composables/use-users";
import { useUserApi } from "@/composables/api";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  recipeId?: string;
  showAlways?: boolean;
  buttonStyle?: boolean;
}

export default function RecipeFavoriteBadge({ recipeId = "", showAlways = false, buttonStyle = false }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const { userRatings, refreshUserRatings } = useUserSelfRatings();

  const isFavorite = useMemo(() =>  {
    const rating = userRatings.find(r => r.recipeId === recipeId, []); // WF4-REVIEW: dependency array
    return rating?.isFavorite || false;
  });

  async function toggleFavorite() {
    const api = useUserApi();
    const auth = useMealieAuth();

    if (!auth.user) return;
    if (!isFavorite) {
      await api.users.addFavorite(auth.user?.id, recipeId);
    }
    else {
      await api.users.removeFavorite(auth.user?.id, recipeId);
    }
    await refreshUserRatings();
  }

  return (
    <>
  {/* WF4-REVIEW: activator slot variants [J] */}
  <Tooltip location="bottom" nudge-right="50" color={buttonStyle ? 'info' : 'secondary'}>
    <template>
      {(isFavorite || showAlways) ? (
        <Button icon variant={buttonStyle ? 'flat' : undefined} rounded={buttonStyle ? 'circle' : undefined} size="small" color={buttonStyle ? 'info' : 'secondary'} fab={buttonStyle} {...({ ...tooltipProps, ...$attrs })} onClick={(e) => { e.preventDefault(); toggleFavorite; }}>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={isFavorite ? $globals.icons.heart : $globals.icons.heartOutline} size={!buttonStyle ? undefined : 'x-large'} color={buttonStyle ? 'white' : 'secondary'} />
        </Button>
      ) : null}
    </template>
    <span>
      {isFavorite ? t("recipe.remove-from-favorites") : t("recipe.add-to-favorites")}
    </span>
  </Tooltip>
    </>
  );
}
