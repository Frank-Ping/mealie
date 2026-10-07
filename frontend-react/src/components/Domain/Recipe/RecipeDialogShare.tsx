import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Avatar, Button, CardActions, CardContent, ListItem, ListItemText, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import MdiIcon from "@/components/MdiIcon";
import { useClipboard, useShare, whenever } from "@vueuse/core";
import type { RecipeShareToken } from "@/lib/api/types/recipe";
import { useUserApi } from "@/composables/api";
import { useHouseholdSelf } from "@/composables/use-households";
import { alert } from "@/composables/use-toast";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  recipeId: string;
  name: string;
}

export default function RecipeDialogShare({ recipeId, name }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature */

  const dialog = defineModel<boolean>({ default: false });

  const [datePickerMenu, setDatePickerMenu] = useState(false);
  const [expirationDate, setExpirationDate] = useState(new Date(Date.now(); - new Date().getTimezoneOffset() * 60000));
  const [tokens, setTokens] = useState([]);

  whenever(
    () => dialog,
    () => {
      // Set expiration date to today + 30 Days
      const today = new Date();
      setExpirationDate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000));
      refreshTokens();
    },
  );

  const i18n = useI18n();
  const auth = useMealieAuth();
  const { household } = useHouseholdSelf();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const firstDayOfWeek = computed(() => {
    return household?.preferences?.firstDayOfWeek || 0;
  });

  // ============================================================
  // Token Actions

  const userApi = useUserApi();

  async function createNewToken() {
    // Convert expiration date to timestamp
    const { data } = await userApi.recipes.share.createOne({
      recipeId: recipeId,
      expiresAt: expirationDate.toISOString(),
    });

    if (data) {
      tokens.push(data);
    }
  }

  async function deleteToken(id: string) {
    await userApi.recipes.share.deleteOne(id);
    setTokens(tokens.filter(token => token.id !== id));
  }

  async function refreshTokens() {
    const { data } = await userApi.recipes.share.getAll(1, -1, { recipe_id: recipeId });

    if (data) {
      // @ts-expect-error - TODO: This routes doesn't have pagination, but the type are mismatched.
      setTokens(data ?? []);
    }
  }

  const { share, isSupported: shareIsSupported } = useShare();
  const { copy, copied, isSupported } = useClipboard({ legacy: true });

  function getTokenLink(token: string) {
    return `${window.location.origin}/g/${groupSlug}/shared/r/${token}`;
  }

  async function copyTokenLink(token: string) {
    if (isSupported) {
      await copy(getTokenLink(token));
      if (copied) {
        alert.success(i18n.t("recipe-share.recipe-link-copied-message") as string);
      }
      else {
        alert.error(i18n.t("general.clipboard-copy-failure") as string);
      }
    }
    else {
      alert.error(i18n.t("general.clipboard-not-supported") as string);
    }
  }

  async function shareRecipe(token: string) {
    if (shareIsSupported) {
      share({
        title: name,
        url: getTokenLink(token),
      });
    }
    else {
      await copyTokenLink(token);
    }
  }

  return (
    <>
  <div>
    <BaseDialog value={dialog} onChange={/* WF4-REVIEW: setter */ setDialog} bottom-sheet title={t('recipe-share.share-recipe')} icon={$globals.icons.link}>
      <CardContent>
        {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
        <VMenu value={datePickerMenu} onChange={setDatePickerMenu} close-on-content-click={false} transition="scale-transition" offset-y max-width="290px" min-width="auto">
          <template>
            {/* WF4-REVIEW: rules/error-messages → error+helperText */}
            <TextField model-value={$d(expirationDate)} label={t('recipe-share.expiration-date')} hint={t('recipe-share.default-30-days')} persistent-hint prepend-icon={$globals.icons.calendar} {...(activatorProps)} readonly />
          </template>
          {/* WF4-REVIEW: value format + LocalizationProvider */}
          <DatePicker value={expirationDate} onChange={setExpirationDate} hide-header first-day-of-week={firstDayOfWeek} local={$i18n.locale} onUpdateModelValue={datePickerMenu = false} />
        </VMenu>
      </CardContent>
      <CardActions className="justify-end">
        <BaseButton size="small" onClick={createNewToken}>
          {t("general.new")}
        </BaseButton>
      </CardActions>
      {tokens.map(token => (
        /* WF4-REVIEW: @click → ListItemButton */
        <ListItem key={token.id} className="px-2" style="padding-top: 8px; padding-bottom: 8px;" onClick={shareRecipe(token.id)}>
          <div className="d-flex align-center" style="width: 100%;">
            <Avatar color="grey">
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={$globals.icons.link} />
            </Avatar>
            <div className="pl-3 flex-grow-1" style="min-width: 0;">
              {/* WF4-REVIEW: content → primary prop */}
              <ListItemText className="text-wrap">
                {t("recipe-share.expires-at") + ' ' + $d(new Date(token.expiresAt!))}
              </ListItemText>
            </div>
            <Button icon variant="text" className="ml-2" onClick={(e) => { e.stopPropagation(); deleteToken(token.id); }}>
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={$globals.icons.delete} color="error-lighten-1" />
            </Button>
            <Button icon variant="text" className="ml-2" onClick={(e) => { e.stopPropagation(); copyTokenLink(token.id); }}>
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={$globals.icons.contentCopy} color="info-lighten-1" />
            </Button>
          </div>
        </ListItem>
      ))}
    </BaseDialog>
  </div>
    </>
  );
}
