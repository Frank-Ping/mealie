import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CardContent, Divider, List, ListItem, ListItemText, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useClipboard, useShare } from "@vueuse/core";
import RecipeDialogAddToShoppingList from "@/components/Domain/Recipe/RecipeDialogAddToShoppingList";
import RecipeDialogPrintPreferences from "@/components/Domain/Recipe/RecipeDialogPrintPreferences";
import RecipeDialogShare from "@/components/Domain/Recipe/RecipeDialogShare";
import { useUserApi } from "@/composables/api";
import { useDownloader } from "@/composables/api/use-downloader";
import { useAddToShoppingListDialog } from "@/composables/shopping-list-page/use-add-to-shopping-list-dialog";
import { useGroupRecipeActions } from "@/composables/use-group-recipe-actions";
import { useGroupSelf } from "@/composables/use-groups";
import { useHouseholdSelf } from "@/composables/use-households";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { alert } from "@/composables/use-toast";
import type { GroupRecipeActionOut, HouseholdSummary } from "@/lib/api/types/household";
import type { Recipe } from "@/lib/api/types/recipe";
import { isRecipeFullyPublic } from "@/lib/recipe/recipe-visibility";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface Props {
  useItems?: ContextMenuIncludes;
  appendItems?: ContextMenuItem[];
  leadingItems?: ContextMenuItem[];
  menuTop?: boolean;
  fab?: boolean;
  color?: string;
  slug: string;
  menuIcon?: string | null;
  name: string;
  recipe?: Recipe;
  recipeId: string;
  recipeScale?: number;
}

export interface ContextMenuIncludes {
  delete: boolean;
  edit: boolean;
  download: boolean;
  duplicate: boolean;
  mealplanner: boolean;
  shoppingList: boolean;
  print: boolean;
  printPreferences: boolean;
  share: boolean;
  recipeActions: boolean;
}

export interface ContextMenuItem {
  title: string;
  icon: string;
  color: string | undefined;
  event: string;
  isPublic: boolean;
}

export default function RecipeContextMenuContent({ useItems = ({
    delete: true,
    edit: true,
    download: true,
    duplicate: false,
    mealplanner: true,
    shoppingList: true,
    print: true,
    printPreferences: true,
    share: true,
    recipeActions: true,
  }), appendItems = [], leadingItems = [], menuTop = true, fab = false, color = "primary", menuIcon = null, recipe = undefined, recipeScale = 1 }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const emit = defineEmits<{
    [key: string]: any;
    deleted: [slug: string];
    print: [];
    mealplanEdit: [];
    mealplanRemove: [];
  }>();

  const api = useUserApi();
  const { open: shoppingListDialog, shoppingLists, getShoppingLists } = useAddToShoppingListDialog();

  const [printPreferencesDialog, setPrintPreferencesDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);
  const [recipeDeleteDialog, setRecipeDeleteDialog] = useState(false);
  const [mealplannerDialog, setMealplannerDialog] = useState(false);
  const [recipeDuplicateDialog, setRecipeDuplicateDialog] = useState(false);
  const [recipeName, setRecipeName] = useState(name);
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);

  const { i18n } = useTranslation();
  const auth = useMealieAuth();
  // icons imported directly (was $globals)
  const { group, actions: groupActions } = useGroupSelf();
  const { household } = useHouseholdSelf();
  const { isOwnGroup } = useLoggedInState();

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const { share, isSupported: shareIsSupported } = useShare();
  const { copy, copied, isSupported: clipboardIsSupported } = useClipboard({ legacy: true });

  function getPlainRecipeLink() {
    return `${window.location.origin}/g/${groupSlug}/r/${slug}`;
  }

  async function sharePlainLink() {
    if (shareIsSupported) {
      await share({
        title: name,
        url: getPlainRecipeLink(),
      });
      return;
    }
    if (!clipboardIsSupported) {
      alert.error(i18n.t("general.clipboard-not-supported") as string);
      return;
    }
    await copy(getPlainRecipeLink());
    alert[copied ? "success" : "error"](
      i18n.t(copied ? "recipe-share.recipe-link-copied-message" : "general.clipboard-copy-failure") as string,
    );
  }

  // ===========================================================================
  // Context Menu Setup

  const defaultItems: { [key: string]: ContextMenuItem } = {
    edit: {
      title: i18n.t("general.edit"),
      icon: icons.edit,
      color: undefined,
      event: "edit",
      isPublic: false,
    },
    delete: {
      title: i18n.t("general.delete"),
      icon: icons.delete,
      color: undefined,
      event: "delete",
      isPublic: false,
    },
    download: {
      title: i18n.t("general.download"),
      icon: icons.download,
      color: undefined,
      event: "download",
      isPublic: false,
    },
    duplicate: {
      title: i18n.t("general.duplicate"),
      icon: icons.duplicate,
      color: undefined,
      event: "duplicate",
      isPublic: false,
    },
    mealplanner: {
      title: i18n.t("recipe.add-to-plan"),
      icon: icons.calendar,
      color: undefined,
      event: "mealplanner",
      isPublic: false,
    },
    shoppingList: {
      title: i18n.t("recipe.add-to-list"),
      icon: icons.cartCheck,
      color: undefined,
      event: "shoppingList",
      isPublic: false,
    },
    print: {
      title: i18n.t("general.print"),
      icon: icons.printer,
      color: undefined,
      event: "print",
      isPublic: true,
    },
    printPreferences: {
      title: i18n.t("general.print-preferences"),
      icon: icons.printerSettings,
      color: undefined,
      event: "printPreferences",
      isPublic: true,
    },
    share: {
      title: i18n.t("general.share"),
      icon: icons.shareVariant,
      color: undefined,
      event: "share",
      isPublic: false,
    },
  };

  // Add leading and Appending Items
  setMenuItems([...menuItems, ...leadingItems, ...appendItems]);

  // ===========================================================================
  // Context Menu Event Handler

  const [recipeRef, setRecipeRef] = useState(recipe);
  const recipeRefWithScale = useMemo(() => recipeRef ? { scale: recipeScale, ...recipeRef } : undefined,, []); // WF4-REVIEW: dependency array
  // the recipe may belong to another household in our group, so we can't reuse the current user's
  const [recipeHousehold, setRecipeHousehold] = useState(undefined);

  async function refreshRecipeHousehold() {
    const householdId = recipeRef?.householdId;
    if (!householdId || !isOwnGroup) {
      setRecipeHousehold(undefined);
      return;
    }
    if (householdId === recipeHousehold?.id) {
      return;
    }
    if (householdId === household?.id) {
      setRecipeHousehold(household);
      return;
    }

    const { data } = await api.households.getOne(householdId);
    setRecipeHousehold(data || undefined);
  }

  /* WF4-REVIEW [J] */ watch(() => recipeRef?.householdId, refreshRecipeHousehold, { immediate: true });

  const isFullyPublic = useMemo(() => isRecipeFullyPublic(recipeRef, group, recipeHousehold),, []); // WF4-REVIEW: dependency array
  const isAdminAndNotOwner = useMemo(() => {
    return (
      auth.user?.admin
      && auth.user?.id !== recipeRef?.userId
    );
  }, []); // WF4-REVIEW: dependency array
  const canDelete = useMemo(() => {
    const user = auth.user;
    const recipe = recipeRef;
    return user && recipe && (user.admin || user.id === recipe.userId);
  }, []); // WF4-REVIEW: dependency array

  // Get Default Menu Items Specified in Props
  for (const [key, value] of Object.entries(useItems)) {
    if (!value) continue;

    // Skip delete if not allowed
    if (key === "delete" && !canDelete) continue;

    const item = defaultItems[key];
    if (item && (item.isPublic || isOwnGroup)) {
      menuItems.push(item);
    }
  }

  async function refreshRecipe() {
    const { data } = await api.recipes.getOne(slug);
    if (data) {
      setRecipeRef(data);
    }
  }

  const navigate = useNavigate();
  const groupRecipeActionsStore = useGroupRecipeActions();

  async function executeRecipeAction(action: GroupRecipeActionOut) {
    if (!recipe) return;
    const response = await groupRecipeActionsStore.execute(action, recipe, recipeScale);

    if (action.actionType === "post") {
      if (!response?.error) {
        alert.success(i18n.t("events.message-sent"));
      }
      else {
        alert.error(i18n.t("events.something-went-wrong"));
      }
    }
  }

  async function deleteRecipe() {
    const { data } = await api.recipes.deleteOne(slug);
    if (data?.slug) {
      navigate(`/g/${groupSlug}`);
    }
    emit("deleted", slug);
  }

  const download = useDownloader();

  async function handleDownloadEvent() {
    const { data: shareToken } = await api.recipes.share.createOne({ recipeId: recipeId });
    if (!shareToken) {
      console.error("No share token received");
      alert.error(i18n.t("events.something-went-wrong"));
      return;
    }

    download(api.recipes.share.getZipRedirectUrl(shareToken.id), `${slug}.zip`);
  }

  async function duplicateRecipe() {
    const { data } = await api.recipes.duplicateOne(slug, recipeName);
    if (data && data.slug) {
      navigate(`/g/${groupSlug}/r/${data.slug}`);
    }
  }

  // Note: Print is handled as an event in the parent component
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  const eventHandlers: { [key: string]: () => void | Promise<any> } = {
    delete: () => {
      setRecipeDeleteDialog(true);
    },
    edit: () => navigate(`/g/${groupSlug}/r/${slug}` + "?edit=true"),
    download: handleDownloadEvent,
    duplicate: () => {
      setRecipeDuplicateDialog(true);
    },
    mealplanner: () => {
      setMealplannerDialog(true);
    },
    printPreferences: async () => {
      if (!recipeRef) {
        await refreshRecipe();
      }
      setPrintPreferencesDialog(true);
    },
    shoppingList: () => {
      const promises: Promise<void>[] = [getShoppingLists()];
      if (!recipeRef) {
        promises.push(refreshRecipe());
      }

      Promise.allSettled(promises).then(() => {
        shoppingListDialog = true;
      });
    },
    share: async () => {
      // resolve everything the visibility check needs, so we don't fall back to a
      // share token just because the recipe/group/household hadn't loaded yet
      if (!recipeRef) {
        await refreshRecipe();
      }
      if (!group) {
        await groupActions.refresh();
      }
      await refreshRecipeHousehold();

      if (isFullyPublic) {
        await sharePlainLink();
      }
      else {
        setShareDialog(true);
      }
    },
  };

  function contextMenuEventHandler(eventKey: string) {
    const handler = eventHandlers[eventKey];

    if (handler && typeof handler === "function") {
      handler();
      setLoading(false);
      return;
    }

    emit(eventKey);
    setLoading(false);
  }

  const recipeActions = groupRecipeActionsStore.recipeActions;

  return (
    <>
  <RecipeDialogShare value={shareDialog} onChange={setShareDialog} recipe-id={recipeId} name={name} />
  <RecipeDialogPrintPreferences value={printPreferencesDialog} onChange={setPrintPreferencesDialog} recipe={recipeRef} />
  <BaseDialog value={recipeDeleteDialog} onChange={setRecipeDeleteDialog} bottom-sheet title={t('recipe.delete-recipe')} color="error" icon={icons.alertCircle} can-confirm onConfirm={deleteRecipe()}>
    <CardContent>
      {(isAdminAndNotOwner) ? (
        <>
          {t("recipe.admin-delete-confirmation")}
        </>
      ) : (
        <>
          {t("recipe.delete-confirmation")}
        </>
      )}
    </CardContent>
  </BaseDialog>
  <BaseDialog value={recipeDuplicateDialog} onChange={setRecipeDuplicateDialog} bottom-sheet title={t('recipe.duplicate')} color="primary" icon={icons.duplicate} can-confirm onConfirm={duplicateRecipe()}>
    <CardContent>
      {/* WF4-REVIEW: rules/error-messages → error+helperText */}
      <TextField value={recipeName} onChange={setRecipeName} density="compact" label={t('recipe.recipe-name')} autofocus />
    </CardContent>
  </BaseDialog>
  <MealPlanAddRecipeDialog value={mealplannerDialog} onChange={setMealplannerDialog} recipe-id={recipeId} />
  {(shoppingLists && recipeRefWithScale) ? (
    <RecipeDialogAddToShoppingList value={shoppingListDialog} onChange={/* WF4-REVIEW: setter */ setShoppingListDialog} recipes={[recipeRefWithScale]} shopping-lists={shoppingLists} />
  ) : null}
  <List density="compact">
    {menuItems.map((item, index) => (
      /* WF4-REVIEW: @click → ListItemButton */
      <ListItem key={index} onClick={contextMenuEventHandler(item.event)}>
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={item.icon} color={item.color} />
        </>
        {/* WF4-REVIEW: content → primary prop */}
        <ListItemText>
          {item.title}
        </ListItemText>
      </ListItem>
    ))}
    {(useItems.recipeActions && recipeActions && recipeActions.length) ? (
      <div>
        <Divider />
        {recipeActions.map((action, index) => (
          /* WF4-REVIEW: @click → ListItemButton */
          <ListItem key={index} onClick={executeRecipeAction(action)}>
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={icons.linkVariantPlus} color="undefined" />
            </>
            {/* WF4-REVIEW: content → primary prop */}
            <ListItemText>
              {action.title}
            </ListItemText>
          </ListItem>
        ))}
      </div>
    ) : null}
  </List>
    </>
  );
}
