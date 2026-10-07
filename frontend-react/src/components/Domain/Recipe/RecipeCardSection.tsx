import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, Fade, Grid, List, ListItem, ListItemText } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useThrottleFn } from "@vueuse/core";
import RecipeCard from "./RecipeCard";
import RecipeCardMobile from "./RecipeCardMobile";
import { useLoggedInState } from "@/composables/use-logged-in-state";
import { useLazyRecipes } from "@/composables/recipes";
import type { Recipe } from "@/lib/api/types/recipe";
import { useUserSortPreferences } from "@/composables/use-users/preferences";
import type { RecipeSearchQuery } from "@/lib/api/user/recipes/recipe";
import { useMealieAuth } from "@/composables/use-mealie-auth";
import { useScrollPosition } from "@/composables/use-scroll-position";

interface Props {
  disableToolbar?: boolean;
  disableSort?: boolean;
  icon?: string | null;
  title?: string | null;
  singleColumn?: boolean;
  recipes?: Recipe[];
  query?: RecipeSearchQuery | null;
}

export default function RecipeCardSection({ disableToolbar = false, disableSort = false, icon = null, title = null, singleColumn = false, recipes = [], query = null }: Props) {
  const { t } = useTranslation();

  const REPLACE_RECIPES_EVENT = "replaceRecipes";
  const APPEND_RECIPES_EVENT = "appendRecipes";


  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const emit = defineEmits<{
    replaceRecipes: [recipes: Recipe[]];
    appendRecipes: [recipes: Recipe[]];
  }>();

  const display = useDisplay();
  const preferences = useUserSortPreferences();

  const EVENTS = {
    az: "az",
    rating: "rating",
    created: "created",
    updated: "updated",
    lastMade: "lastMade",
    shuffle: "shuffle",
  };

  const auth = useMealieAuth();
  // icons imported directly (was $globals)
  const { isOwnGroup } = useLoggedInState();
  const useMobileCards = useMemo(() => {
    return display.smAndDown || preferences.useMobileCards;
  }, []); // WF4-REVIEW: dependency array

  const displayTitleIcon = useMemo(() => {
    return icon || icons.tags;
  }, []); // WF4-REVIEW: dependency array

  const [sortLoading, setSortLoading] = useState(false);
  const [randomSeed, setRandomSeed] = useState(Date.now().toString());

  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const [page, setPage] = useState(1);
  const perPage = 32;
  const [hasMore, setHasMore] = useState(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const { fetchMore, getRandom } = useLazyRecipes(isOwnGroup ? null : groupSlug);
  const { savePosition, getSavedPage, restorePosition } = useScrollPosition();
  const navigate = useNavigate();

  const queryFilter = useMemo(() => {
    return query?.queryFilter || null;

    // TODO: allow user to filter out null values when ordering by a value that may be null (such as lastMade)

    // const orderBy = query?.orderBy || preferences.orderBy;
    // const orderByFilter = preferences.filterNull && orderBy ? `${orderBy} IS NOT NULL` : null;

    // if (query.queryFilter && orderByFilter) {
    //   return `(${query.queryFilter}) AND ${orderByFilter}`;
    // } else if (query.queryFilter) {
    //   return query.queryFilter;
    // } else {
    //   return orderByFilter;
    // }
  }, []); // WF4-REVIEW: dependency array

  async function fetchRecipes(pageCount = 1) {
    const orderDir = query?.orderDirection || preferences.orderDirection;
    const orderByNullPosition = query?.orderByNullPosition || orderDir === "asc" ? "first" : "last";
    const orderBy = query?.orderBy || preferences.orderBy;
    const localQuery = { ...query };
    if (orderBy === "random") {
      localQuery._searchSeed = randomSeed;
    }
    return await fetchMore(
      page,
      perPage * pageCount,
      orderBy,
      orderDir,
      orderByNullPosition,
      localQuery,
      // we use a computed queryFilter to filter out recipes that have a null value for the property we're sorting by
      queryFilter,
    );
  }

  /* WF4-REVIEW [J] */ onMounted(async () => {
    setLoading(true);
    const savedPage = getSavedPage(route.path);

    if (savedPage && savedPage > 2) {
      setPage(1);
      setHasMore(true);
      const newRecipes = await fetchRecipes(savedPage);
      if (newRecipes.length < perPage * savedPage) {
        setHasMore(false);
      }
      setPage(savedPage);
      emit(REPLACE_RECIPES_EVENT, newRecipes);
      setReady(true);
      restorePosition(route.path);
    }
    else {
      await initRecipes();
      setReady(true);
      if (savedPage) {
        restorePosition(route.path);
      }
    }
    setLoading(false);
  });

  let lastQuery: string | undefined = JSON.stringify(query);
  /* WF4-REVIEW [J] */ watch(
    () => query,
    async (newValue: RecipeSearchQuery | undefined | null) => {
      const newValueString = JSON.stringify(newValue);
      if (lastQuery !== newValueString) {
        lastQuery = newValueString;
        setReady(false);
        await initRecipes();
        setReady(true);
      }
    },
  );

  async function initRecipes() {
    if (preferences.orderBy === "random") {
      setRandomSeed(Date.now().toString());
    }
    setPage(1);
    setHasMore(true);

    // we double-up the first call to avoid a bug with large screens that render
    // the entire first page without scrolling, preventing additional loading
    const newRecipes = await fetchRecipes(page + 1);
    if (newRecipes.length < perPage) {
      setHasMore(false);
    }

    // since we doubled the first call, we also need to advance the page
    setPage(page + 1);

    emit(REPLACE_RECIPES_EVENT, newRecipes);
  }

  const infiniteScroll = useThrottleFn(async () => {
    if (!hasMore || loading) {
      return;
    }

    setLoading(true);
    setPage(page + 1);

    const newRecipes = await fetchRecipes();
    if (newRecipes.length < perPage) {
      setHasMore(false);
    }
    if (newRecipes.length) {
      emit(APPEND_RECIPES_EVENT, newRecipes);
    }

    savePosition(route.path, page);

    setLoading(false);
  }, 500);

  async function sortRecipes(sortType: string) {
    if (sortLoading || loading) {
      return;
    }

    function setter(
      orderBy: string,
      ascIcon: string,
      descIcon: string,
      defaultOrderDirection = "asc",
      filterNull = false,
    ) {
      if (preferences.orderBy !== orderBy) {
        preferences.orderBy = orderBy;
        preferences.orderDirection = defaultOrderDirection;
        preferences.filterNull = filterNull;
      }
      else {
        preferences.orderDirection = preferences.orderDirection === "asc" ? "desc" : "asc";
      }
      preferences.sortIcon = preferences.orderDirection === "asc" ? ascIcon : descIcon;
    }

    switch (sortType) {
      case EVENTS.az:
        setter(
          "name",
          icons.sortAlphabeticalAscending,
          icons.sortAlphabeticalDescending,
          "asc",
          false,
        );
        break;
      case EVENTS.rating:
        setter("rating", icons.sortAscending, icons.sortDescending, "desc", true);
        break;
      case EVENTS.created:
        setter(
          "created_at",
          icons.sortCalendarAscending,
          icons.sortCalendarDescending,
          "desc",
          false,
        );
        break;
      case EVENTS.updated:
        setter("updated_at", icons.sortClockAscending, icons.sortClockDescending, "desc", false);
        break;
      case EVENTS.lastMade:
        setter(
          "last_made",
          icons.sortCalendarAscending,
          icons.sortCalendarDescending,
          "desc",
          true,
        );
        break;
      case EVENTS.shuffle:
        setter(
          "random",
          icons.diceMultiple,
          icons.diceMultiple, // icon in asc and desc is the same for random
        );
        // We update the seed value to have a different order
        setRandomSeed(Date.now().toString());
        break;
      default:
        console.log("Unknown Event", sortType);
        return;
    }

    // reset pagination
    setPage(1);
    setHasMore(true);

    setSortLoading(true);
    setLoading(true);

    // fetch new recipes
    const newRecipes = await fetchRecipes();
    emit(REPLACE_RECIPES_EVENT, newRecipes);

    setSortLoading(false);
    setLoading(false);
  }

  async function navigateRandom() {
    const recipe = await getRandom(query, queryFilter);
    if (!recipe?.slug) {
      return;
    }

    navigate(`/g/${groupSlug}/r/${recipe.slug}`);
  }

  function toggleMobileCards() {
    preferences.useMobileCards = !preferences.useMobileCards;
  }

  return (
    <>
  <div>
    {(!disableToolbar) ? (
      <Grid container className="align-center pb-2">
        {(title) ? (
          /* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */
          <MdiIcon name={displayTitleIcon} size="large" />
        ) : null}
        <span className="text-headline-small">
          {title}
        </span>
        <Box sx={{ flexGrow: 1 }} />
        <Button icon={$vuetify.display.xs} variant="text" disabled={recipes.length === 0} onClick={navigateRandom}>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={icons.diceMultiple} start={!$vuetify.display.xs} />
          {$vuetify.display.xs ? null : t("general.random")}
        </Button>
        {(!disableSort) ? (
          /* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */
          <VMenu offset-y start>
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              <Button variant="text" icon={$vuetify.display.xs} {...(activatorProps)} loading={sortLoading}>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={preferences.sortIcon} start={!$vuetify.display.xs} />
                {$vuetify.display.xs ? null : t("general.sort")}
              </Button>
            </>
            <List>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem onClick={sortRecipes(EVENTS.az)}>
                <div className="d-flex align-center flex-nowrap">
                  {/* WF4-REVIEW: icon name resolves via lib/icons */}
                  <MdiIcon name={icons.orderAlphabeticalAscending} className="mr-2" inline />
                  {/* WF4-REVIEW: content → primary prop */}
                  <ListItemText>
                    {t("general.sort-alphabetically")}
                  </ListItemText>
                </div>
              </ListItem>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem onClick={sortRecipes(EVENTS.rating)}>
                <div className="d-flex align-center flex-nowrap">
                  {/* WF4-REVIEW: icon name resolves via lib/icons */}
                  <MdiIcon name={icons.star} className="mr-2" inline />
                  {/* WF4-REVIEW: content → primary prop */}
                  <ListItemText>
                    {t("general.rating")}
                  </ListItemText>
                </div>
              </ListItem>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem onClick={sortRecipes(EVENTS.created)}>
                <div className="d-flex align-center flex-nowrap">
                  {/* WF4-REVIEW: icon name resolves via lib/icons */}
                  <MdiIcon name={icons.newBox} className="mr-2" inline />
                  {/* WF4-REVIEW: content → primary prop */}
                  <ListItemText>
                    {t("general.created")}
                  </ListItemText>
                </div>
              </ListItem>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem onClick={sortRecipes(EVENTS.updated)}>
                <div className="d-flex align-center flex-nowrap">
                  {/* WF4-REVIEW: icon name resolves via lib/icons */}
                  <MdiIcon name={icons.update} className="mr-2" inline />
                  {/* WF4-REVIEW: content → primary prop */}
                  <ListItemText>
                    {t("general.updated")}
                  </ListItemText>
                </div>
              </ListItem>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem onClick={sortRecipes(EVENTS.lastMade)}>
                <div className="d-flex align-center flex-nowrap">
                  {/* WF4-REVIEW: icon name resolves via lib/icons */}
                  <MdiIcon name={icons.chefHat} className="mr-2" inline />
                  {/* WF4-REVIEW: content → primary prop */}
                  <ListItemText>
                    {t("general.last-made")}
                  </ListItemText>
                </div>
              </ListItem>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem onClick={sortRecipes(EVENTS.shuffle)}>
                <div className="d-flex align-center flex-nowrap">
                  {/* WF4-REVIEW: icon name resolves via lib/icons */}
                  <MdiIcon name={icons.diceMultiple} className="mr-2" inline />
                  {/* WF4-REVIEW: content → primary prop */}
                  <ListItemText>
                    {t("general.random")}
                  </ListItemText>
                </div>
              </ListItem>
            </List>
          </VMenu>
        ) : null}
        {(!$vuetify.display.smAndDown) ? (
          <ContextMenu items={[
          {
            title: t('general.toggle-view'),
            icon: icons.eye,
            event: 'toggle-dense-view',
          },
        ]} onToggleDenseView={toggleMobileCards()} />
        ) : null}
      </Grid>
    ) : null}
    {(recipes && ready) ? (
      <div>
        <div className="mt-2">
          {(!useMobileCards) ? (
            <Grid container>
              {recipes.map(recipe => (
                /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
                <Grid key={recipe.id!} sm={6} md={6} lg={4} xl={3}>
                  <RecipeCard name={recipe.name!} description={recipe.description!} slug={recipe.slug!} rating={recipe.rating!} image={recipe.image!} tags={recipe.tags!} recipe-id={recipe.id!} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container density="comfortable">
              {recipes.map(recipe => (
                /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
                <Grid key={recipe.id!} cols="12" sm={singleColumn ? '12' : '12'} md={singleColumn ? '12' : '6'} lg={singleColumn ? '12' : '4'} xl={singleColumn ? '12' : '3'}>
                  <RecipeCardMobile name={recipe.name!} description={recipe.description!} slug={recipe.slug!} rating={recipe.rating!} image={recipe.image!} tags={recipe.tags!} recipe-id={recipe.id!} />
                </Grid>
              ))}
            </Grid>
          )}
        </div>
        <Card variant="flat" />
      </div>
    ) : null}
    {/* WF4-REVIEW: transition semantics */}
    <Fade in={true}>
      {(loading) ? (
        <AppLoader loading={loading} waiting-text={t('general.loading-recipes')} />
      ) : null}
    </Fade>
    <AppScrollToTop />
  </div>
    </>
  );
}
