import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, CardContent, Toolbar, Tooltip } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import RecipeContextMenu from "./RecipeContextMenu/RecipeContextMenu";
import RecipeFavoriteBadge from "./RecipeFavoriteBadge";
import RecipeTimelineBadge from "./RecipeTimelineBadge";
import type { Recipe } from "@/lib/api/types/recipe";

interface Props {
  recipe: Recipe;
  slug: string;
  recipeScale?: number;
  open: boolean;
  name: string;
  loggedIn?: boolean;
  recipeId: string;
  canEdit?: boolean;
  onPrint?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onInput?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onSave?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onDelete?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onClose?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onJson?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
  onEdit?: (...args: unknown[]) => void; // WF4-REVIEW: payload types
}

export default function RecipeActionMenu({ recipeScale = 1, loggedIn = false, canEdit = false, onPrint, onInput, onSave, onDelete, onClose, onJson, onEdit }: Props) {
  const { t } = useTranslation();

  const SAVE_EVENT = "save";
  const DELETE_EVENT = "delete";
  const CLOSE_EVENT = "close";
  const JSON_EVENT = "json";


  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const emit = /* emits → props: onPrint, onInput, onSave, onDelete, onClose, onJson, onEdit */

  const [deleteDialog, setDeleteDialog] = useState(false);

  const { i18n } = useTranslation();
  // icons imported directly (was $globals)

  const editorButtons = [
    {
      text: i18n.t("general.delete"),
      icon: icons.delete,
      event: DELETE_EVENT,
      color: "error",
    },
    {
      text: i18n.t("general.json"),
      icon: icons.codeBraces,
      event: JSON_EVENT,
      color: "accent",
    },
    {
      text: i18n.t("general.close"),
      icon: icons.close,
      event: CLOSE_EVENT,
      color: "",
    },
    {
      text: i18n.t("general.save"),
      icon: icons.save,
      event: SAVE_EVENT,
      color: "success",
    },
  ];

  function emitHandler(event: string) {
    switch (event) {
      case CLOSE_EVENT:
        emit("close");
        emit("input", false);
        break;
      case DELETE_EVENT:
        setDeleteDialog(true);
        break;
      default:
        emit(event as any);
        break;
    }
  }

  function emitDelete() {
    emit("delete");
    emit("input", false);
  }

  return (
    <>
  <Toolbar className="fixed-bar mt-0" style="z-index: 2; position: sticky; background: transparent; box-shadow: none;" density="compact" elevation="0">
    <BaseDialog value={deleteDialog} onChange={setDeleteDialog} bottom-sheet title={t('recipe.delete-recipe')} color="error" icon={icons.alertCircle} can-confirm onConfirm={emitDelete()}>
      <CardContent>
        {t("recipe.delete-confirmation")}
      </CardContent>
    </BaseDialog>
    <Box sx={{ flexGrow: 1 }} />
    {(!open) ? (
      <div className="custom-btn-group ma-1">
        {(loggedIn) ? (
          <RecipeFavoriteBadge color="info" button-style recipe-id={recipe.id!} show-always />
        ) : null}
        {(loggedIn) ? (
          <RecipeTimelineBadge className="ml-1" color="info" button-style slug={recipe.slug} recipe-name={recipe.name!} />
        ) : null}
        {(loggedIn) ? (
          <div>
            {(canEdit) ? (
              /* WF4-REVIEW: activator slot variants [J] */
              <Tooltip location="bottom" color="info">
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  <Button icon variant="flat" rounded="circle" size="small" color="info" className="ml-1" {...(tooltipProps)} onClick={onEdit?.(true)}>
                    {/* WF4-REVIEW: icon name resolves via lib/icons */}
                    <MdiIcon name={icons.edit} size="x-large" />
                  </Button>
                </>
                <span>
                  {t("general.edit")}
                </span>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
        <RecipeContextMenu show-print menu-top={false} name={recipe.name!} slug={recipe.slug!} menu-icon={icons.dotsVertical} fab color="info" card-menu={false} recipe={recipe} recipe-id={recipe.id!} recipe-scale={recipeScale} use-items={{
          edit: false,
          download: loggedIn,
          duplicate: loggedIn,
          mealplanner: loggedIn,
          shoppingList: loggedIn,
          print: true,
          printPreferences: true,
          share: loggedIn,
          recipeActions: true,
          delete: loggedIn,
        }} className="ml-1" onPrint={onPrint?.()} />
      </div>
    ) : null}
    {(open) ? (
      <div className="custom-btn-group gapped ma-1">
        {editorButtons.map((btn, index) => (
          <Button key={index} className={{ 'rounded-circle': $vuetify.display.xs }} size={$vuetify.display.xs ? 'small' : undefined} color={btn.color} variant="elevated" icon={$vuetify.display.xs} onClick={emitHandler(btn.event)}>
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={btn.icon} left={!$vuetify.display.xs} />
            {$vuetify.display.xs ? "" : btn.text}
          </Button>
        ))}
      </div>
    ) : null}
  </Toolbar>
    </>
  );
}
