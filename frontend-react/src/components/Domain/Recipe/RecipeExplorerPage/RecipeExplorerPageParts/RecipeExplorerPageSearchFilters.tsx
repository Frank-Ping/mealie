import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MdiIcon from "@/components/MdiIcon";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { useRecipeExplorerSearch } from "@/composables/use-recipe-explorer-search";
import {
  useCategoryStore,
  usePublicCategoryStore,
  useFoodStore,
  usePublicFoodStore,
  useHouseholdStore,
  usePublicHouseholdStore,
  useTagStore,
  usePublicTagStore,
  useToolStore,
  usePublicToolStore,
} from "@/composables/store";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function RecipeExplorerPageSearchFilters() {
  const { t } = useTranslation();

  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]

  const { isOwnGroup } = useLoggedInState();
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const {
    state,
    selectedCategories,
    selectedFoods,
    selectedHouseholds,
    selectedTags,
    selectedTools,
  } = useRecipeExplorerSearch(groupSlug);

  const { store: categories } = isOwnGroup ? useCategoryStore() : usePublicCategoryStore(groupSlug);
  const { store: tags } = isOwnGroup ? useTagStore() : usePublicTagStore(groupSlug);
  const { store: tools } = isOwnGroup ? useToolStore() : usePublicToolStore(groupSlug);
  const { store: foods } = isOwnGroup ? useFoodStore() : usePublicFoodStore(groupSlug);
  const { store: households } = isOwnGroup ? useHouseholdStore() : usePublicHouseholdStore(groupSlug);

  /* WF4-REVIEW [J] */ watch(
    households,
    () => {
      // if exactly one household exists, then we shouldn't be filtering by household
      if (households.length == 1) {
        selectedHouseholds = [];
      }
    },
  );

  return (
    <>
  {(categories) ? (
    /* WF4-REVIEW: v-model on complex expression "state.requireAllCategories" [J] */
    <SearchFilter value={selectedCategories} onChange={/* WF4-REVIEW: setter */ setSelectedCategories} {/* WF4-REVIEW: v-model state.requireAllCategories */} items={categories}>
      {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
      <MdiIcon name={$globals.icons.categories} />
      {t("category.categories")}
    </SearchFilter>
  ) : null}
  {(tags) ? (
    /* WF4-REVIEW: v-model on complex expression "state.requireAllTags" [J] */
    <SearchFilter value={selectedTags} onChange={/* WF4-REVIEW: setter */ setSelectedTags} {/* WF4-REVIEW: v-model state.requireAllTags */} items={tags}>
      {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
      <MdiIcon name={$globals.icons.tags} />
      {t("tag.tags")}
    </SearchFilter>
  ) : null}
  {(tools) ? (
    /* WF4-REVIEW: v-model on complex expression "state.requireAllTools" [J] */
    <SearchFilter value={selectedTools} onChange={/* WF4-REVIEW: setter */ setSelectedTools} {/* WF4-REVIEW: v-model state.requireAllTools */} items={tools}>
      {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
      <MdiIcon name={$globals.icons.potSteam} />
      {t("tool.tools")}
    </SearchFilter>
  ) : null}
  {(foods) ? (
    /* WF4-REVIEW: v-model on complex expression "state.requireAllFoods" [J] */
    <SearchFilter value={selectedFoods} onChange={/* WF4-REVIEW: setter */ setSelectedFoods} {/* WF4-REVIEW: v-model state.requireAllFoods */} items={foods}>
      {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
      <MdiIcon name={$globals.icons.foods} />
      {t("general.foods")}
    </SearchFilter>
  ) : null}
  {(households.length > 1) ? (
    <SearchFilter value={selectedHouseholds} onChange={/* WF4-REVIEW: setter */ setSelectedHouseholds} items={households} radio>
      {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
      <MdiIcon name={$globals.icons.household} />
      {t("household.households")}
    </SearchFilter>
  ) : null}
    </>
  );
}
