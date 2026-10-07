import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Autocomplete, Chip } from "@mui/material";
import { icons } from "@/lib/icons";
import type { IngredientFood, RecipeCategory, RecipeTag, RecipeTool } from "@/lib/api/types/recipe";
import { Organizer, type RecipeOrganizer } from "@/lib/api/types/non-generated";
import type { HouseholdSummary } from "@/lib/api/types/household";
import { useCategoryStore, useFoodStore, useLabelStore, useHouseholdStore, useTagStore, useToolStore } from "@/composables/store";
import { useUserStore } from "@/composables/store/use-user-store";
import { normalizeFilter } from "@/composables/use-utils";
import type { UserSummary } from "@/lib/api/types/user";

interface Props {
  selectorType: RecipeOrganizer;
  inputAttrs?: Record<string, any>;
  showAdd?: boolean;
  showLabel?: boolean;
  showIcon?: boolean;
  variant?: "filled" | "underlined" | "outlined" | "plain" | "solo" | "solo-inverted" | "solo-filled";
}

export default function RecipeOrganizerSelector({ inputAttrs = ({}), showAdd = true, showLabel = true, showIcon = true, variant = "outlined" }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const selected = defineModel<(
    | HouseholdSummary
    | RecipeTag
    | RecipeCategory
    | RecipeTool
    | IngredientFood
    | UserSummary
  )[] | undefined>({ required: true });

  /* WF4-REVIEW [J] */ onMounted(() => {
    if (selected === undefined) {
      selected = [];
    }
  });

  const { i18n } = useTranslation();
  // icons imported directly (was $globals)

  const label = useMemo(() => {
    if (!showLabel) {
      return "";
    }

    switch (selectorType) {
      case Organizer.Tag:
        return i18n.t("tag.tags");
      case Organizer.Category:
        return i18n.t("category.categories");
      case Organizer.Tool:
        return i18n.t("tool.tools");
      case Organizer.Food:
        return i18n.t("general.foods");
      case Organizer.Label:
        return i18n.t("data-pages.foods.food-label");
      case Organizer.Household:
        return i18n.t("household.households");
      case Organizer.User:
        return i18n.t("user.users");
      default:
        return i18n.t("general.organizer");
    }
  }, []); // WF4-REVIEW: dependency array

  const icon = useMemo(() => {
    if (!showIcon) {
      return "";
    }

    switch (selectorType) {
      case Organizer.Tag:
        return icons.tags;
      case Organizer.Category:
        return icons.categories;
      case Organizer.Tool:
        return icons.tools;
      case Organizer.Food:
        return icons.foods;
      case Organizer.Label:
        return icons.tags;
      case Organizer.Household:
        return icons.household;
      case Organizer.User:
        return icons.user;
      default:
        return icons.tags;
    }
  }, []); // WF4-REVIEW: dependency array

  const itemTitle = useMemo(() => selectorType === Organizer.User
      ? (i: any) => i?.fullName ?? i?.name ?? ""
      : "name",, []); // WF4-REVIEW: dependency array

  // ===========================================================================
  // Store & Items Setup

  const storeMap = {
    [Organizer.Category]: useCategoryStore(),
    [Organizer.Tag]: useTagStore(),
    [Organizer.Tool]: useToolStore(),
    [Organizer.Food]: useFoodStore(),
    [Organizer.Label]: useLabelStore(),
    [Organizer.Household]: useHouseholdStore(),
    [Organizer.User]: useUserStore(),
  };

  const activeStore = useMemo(() => {
    const { store } = storeMap[selectorType];
    return store;
  }, []); // WF4-REVIEW: dependency array

  const items = useMemo(() => {
    const list = (activeStore as unknown as any[]) ?? [];
    return list;
  }, []); // WF4-REVIEW: dependency array

  function removeByIndex(index: number) {
    if (selected === undefined) {
      return;
    }

    const newSelected = selected.filter((_, i) => i !== index);
    selected = [...newSelected];
  }

  function appendCreated(item: any) {
    if (selected === undefined) {
      return;
    }

    selected = [...selected, item];
  }

  function handleEnter() {
    if (!searchInput) {
      return;
    }
    const exactMatch = items.some(
      (item: any) => (item.name ?? "").toLowerCase() === searchInput.toLowerCase(),
    );
    if (!exactMatch) {
      createItem();
    }
  }

  async function createItem() {
    if (!searchInput) {
      return;
    }

    const actions = storeMap[selectorType].actions;
    // @ts-expect-error different organizer types have different required fields
    const newItem = await actions.createOne({ name: searchInput });
    if (newItem) {
      appendCreated(newItem);
    }
    setSearchInput("");
  }

  const [dialog, setDialog] = useState(false);

  const [searchInput, setSearchInput] = useState("");

  function resetSearchInput() {
    setSearchInput("");
  }

  return (
    <>
  {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S] */}
  <Autocomplete value={selected} onChange={/* WF4-REVIEW: setter */ setSelected} {...(inputAttrs)} value={searchInput} onChange={setSearchInput} items={items} custom-filter={normalizeFilter} label={label} chips closable-chips item-title={itemTitle} item-value="name" multiple variant={variant} prepend-inner-icon={icon} append-icon={showAdd ? icons.create : undefined} return-object auto-select-first className="pa-0 ma-0" onUpdateModelValue={resetSearchInput} onClickAppend={() => setDialog(true)} onKeyUp={handleEnter}>
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      <Chip key={index} className="ma-1" color="accent" variant="flat" label text={item.name} closable onClickClose={removeByIndex(index)} />
    </>
    {(showAdd) ? (
      /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
      <>
        <div className="caption text-center pb-2">
          {t("recipe.press-enter-to-create")}
        </div>
      </>
    ) : null}
    {(showAdd && searchInput) ? (
      /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
      <>
        <div className="px-2">
          <BaseButton block size="small" onClick={createItem()} />
        </div>
      </>
    ) : null}
    {(showAdd) ? (
      /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
      <>
        <RecipeOrganizerDialog value={dialog} onChange={setDialog} item-type={selectorType} onCreatedItem={appendCreated} />
      </>
    ) : null}
  </Autocomplete>
    </>
  );
}
