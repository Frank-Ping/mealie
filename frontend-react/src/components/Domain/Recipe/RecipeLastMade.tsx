import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, CardContent, Container, FormControlLabel, Grid, List, ListItem, TextField, Tooltip, form } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import MdiIcon from "@/components/MdiIcon";
import { whenever } from "@vueuse/core";
import { formatISO } from "date-fns";
import { useUserApi } from "@/composables/api";
import { alert } from "@/composables/use-toast";
import { useHouseholdSelf } from "@/composables/use-households";
import type { Recipe, RecipeTimelineEventIn, RecipeTimelineEventOut } from "@/lib/api/types/recipe";
import type { VForm } from "@/types/auto-forms";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function RecipeLastMade() {
  const { t } = useTranslation();

  const props = defineProps<{ recipe: Recipe }>();
  const emit = defineEmits<{
    eventCreated: [event: RecipeTimelineEventOut];
  }>();

  const [madeThisDialog, setMadeThisDialog] = useState(false);
  const userApi = useUserApi();
  const { household } = useHouseholdSelf();
  const i18n = useI18n();
  const auth = useMealieAuth();
  const [domMadeThisForm, setDomMadeThisForm] = useState(undefined);
  const [newTimelineEvent, setNewTimelineEvent] = useState({
    subject: "",
    eventType: "comment",
    eventMessage: "",
    timestamp: undefined,
    recipeId: props.recipe?.id || "",
  });
  const [newTimelineEventImage, setNewTimelineEventImage] = useState(undefined);
  const [newTimelineEventImageName, setNewTimelineEventImageName] = useState("");
  const [newTimelineEventImagePreviewUrl, setNewTimelineEventImagePreviewUrl] = useState(undefined);
  const [newTimelineEventTimestamp, setNewTimelineEventTimestamp] = useState(new Date(););
  const newTimelineEventTimestampString = useMemo(() =>  {
    return formatISO(newTimelineEventTimestamp, { representation: "date" }, []); // WF4-REVIEW: dependency array
  });

  const [lastMade, setLastMade] = useState(props.recipe.lastMade);
  const [lastMadeReady, setLastMadeReady] = useState(false);
  /* WF4-REVIEW [J] */ onMounted(async () => {
    if (!auth.user??.householdSlug) {
      setLastMade(props.recipe.lastMade);
    }
    else {
      const { data } = await userApi.households.getCurrentUserHouseholdRecipe(props.recipe.slug || "");
      setLastMade(data?.lastMade);
    }

    setLastMadeReady(true);
  });

  const childRecipes = useMemo(() =>  {
    return props.recipe.recipeIngredient?.map((ingredient, []); // WF4-REVIEW: dependency array => {
      if (ingredient.referencedRecipe) {
        return {
          checked: false, // Default value for checked
          recipeId: ingredient.referencedRecipe.id || "", // Non-nullable recipeId
          ...ingredient.referencedRecipe, // Spread the rest of the referencedRecipe properties
        };
      }
      else {
        return undefined;
      }
    }).filter(recipe => recipe !== undefined); // Filter out undefined values
  });

  whenever(
    () => madeThisDialog,
    () => {
      // Set timestamp to now
      setNewTimelineEventTimestamp(new Date());
    },
  );

  const firstDayOfWeek = computed(() => {
    return household?.preferences?.firstDayOfWeek || 0;
  });

  function clearImage() {
    setNewTimelineEventImage(undefined);
    setNewTimelineEventImageName("");
    setNewTimelineEventImagePreviewUrl(undefined);
  }

  function uploadImage(fileObject: File) {
    setNewTimelineEventImage(fileObject);
    setNewTimelineEventImageName(fileObject.name);
    setNewTimelineEventImagePreviewUrl(URL.createObjectURL(fileObject));
  }

  function updateUploadedImage(fileObject: Blob) {
    setNewTimelineEventImage(fileObject);
    setNewTimelineEventImagePreviewUrl(URL.createObjectURL(fileObject));
  }

  const [datePickerMenu, setDatePickerMenu] = useState(false);
  const [madeThisFormLoading, setMadeThisFormLoading] = useState(false);

  function resetMadeThisForm() {
    setMadeThisFormLoading(false);

    newTimelineEvent.eventMessage = "";
    newTimelineEvent.timestamp = undefined;
    clearImage();
    setMadeThisDialog(false);
    domMadeThisForm?.reset();
  }

  async function createTimelineEvent() {
    if (!(newTimelineEventTimestampString && props.recipe?.id && props.recipe?.slug)) {
      return;
    }

    setMadeThisFormLoading(true);

    newTimelineEvent.recipeId = props.recipe.id;
    // Note: auth.user is now a ref
    newTimelineEvent.subject = i18n.t("recipe.user-made-this", { user: auth.user?.fullName });

    // the user only selects the date, so we set the time to end of day local time
    // we choose the end of day so it always comes after "new recipe" events
    newTimelineEvent.timestamp = new Date(newTimelineEventTimestampString + "T23:59:59").toISOString();

    let newEvent: RecipeTimelineEventOut | null = null;
    try {
      const eventResponse = await userApi.recipes.createTimelineEvent(newTimelineEvent);
      newEvent = eventResponse.data;
      if (!newEvent) {
        throw new Error("No event created");
      }
    }
    catch (error) {
      console.error("Failed to create timeline event:", error);
      alert.error(i18n.t("recipe.failed-to-add-to-timeline"));
      resetMadeThisForm();
      return;
    }

    // we also update the recipe's last made value
    if (!lastMade || newTimelineEvent.timestamp > lastMade) {
      try {
        setLastMade(newTimelineEvent.timestamp);
        await userApi.recipes.updateLastMade(props.recipe.slug, newTimelineEvent.timestamp);
      }
      catch (error) {
        console.error("Failed to update last made date:", error);
        alert.error(i18n.t("recipe.failed-to-update-recipe"));
      }
    }

    for (const childRecipe of childRecipes || []) {
      if (!childRecipe.checked) {
        continue;
      }

      const childTimelineEvent = {
        ...newTimelineEvent,
        recipeId: childRecipe.recipeId,
        eventMessage: i18n.t("recipe.made-for-recipe", { recipe: childRecipe.name }),
        image: undefined,
      };
      try {
        await userApi.recipes.createTimelineEvent(childTimelineEvent);
      }
      catch (error) {
        console.error(`Failed to create timeline event for child recipe ${childRecipe.slug}:`, error);
      }

      if (
        newTimelineEvent.timestamp
        && (!childRecipe.lastMade || newTimelineEvent.timestamp > childRecipe.lastMade)
      ) {
        try {
          await userApi.recipes.updateLastMade(childRecipe.slug || "", newTimelineEvent.timestamp);
        }
        catch (error) {
          console.error(`Failed to update last made date for child recipe ${childRecipe.slug}:`, error);
        }
      }
    }

    // update the image, if provided
    let imageError = false;
    if (newTimelineEventImage) {
      try {
        const imageResponse = await userApi.recipes.updateTimelineEventImage(
          newEvent.id,
          newTimelineEventImage,
          newTimelineEventImageName,
        );
        if (imageResponse.data) {
          newEvent.image = imageResponse.data.image;
        }
      }
      catch (error) {
        imageError = true;
        console.error("Failed to upload image for timeline event:", error);
      }
    }
    if (imageError) {
      alert.error(i18n.t("recipe.added-to-timeline-but-failed-to-add-image"));
    }
    else {
      alert.success(i18n.t("recipe.added-to-timeline"));
    }

    resetMadeThisForm();
    emit("eventCreated", newEvent);
  }

  return (
    <>
  <div>
    <div>
      <BaseDialog value={madeThisDialog} onChange={setMadeThisDialog} bottom-sheet loading={madeThisFormLoading} icon={$globals.icons.chefHat} title={t('recipe.made-this')} submit-text={t('recipe.add-to-timeline')} can-submit disable-submit-on-enter onSubmit={createTimelineEvent}>
        <CardContent>
          {/* WF4-REVIEW: validation semantics [J] */}
          <form ref="domMadeThisForm">
            {/* WF4-REVIEW: v-model on complex expression "newTimelineEvent.eventMessage" [J] */}
            <TextField multiline {/* WF4-REVIEW: v-model newTimelineEvent.eventMessage */} autofocus label={t('recipe.comment')} hint={t('recipe.how-did-it-turn-out')} persistent-hint rows="4" />
            {(childRecipes?.length) ? (
              <div>
                <CardContent className="pt-6 pb-0 text-title-medium">
                  {t('recipe.include-linked-recipes')}
                </CardContent>
                <List>
                  {childRecipes.map((childRecipe, i) => (
                    /* WF4-REVIEW: @click → ListItemButton */
                    <ListItem key={childRecipe.recipeId + i} density="compact" className="my-0 py-0" onClick={childRecipe.checked = !childRecipe.checked}>
                      {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
                      <FormControlLabel hide-details density="compact" input-value={childRecipe.checked} label={childRecipe.name} className="my-0 py-0" color="secondary" />
                    </ListItem>
                  ))}
                </List>
              </div>
            ) : null}
            <Container>
              <Grid container className="mt-4">
                {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                <Grid cols="5">
                  {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
                  <VMenu value={datePickerMenu} onChange={setDatePickerMenu} close-on-content-click={false} transition="scale-transition" offset-y>
                    <template>
                      {/* WF4-REVIEW: rules/error-messages → error+helperText */}
                      <TextField model-value={$d(newTimelineEventTimestamp)} prepend-icon={$globals.icons.calendar} {...(activatorProps)} readonly density="compact" min-width="160" />
                    </template>
                    {/* WF4-REVIEW: value format + LocalizationProvider */}
                    <DatePicker value={newTimelineEventTimestamp} onChange={setNewTimelineEventTimestamp} hide-header first-day-of-week={firstDayOfWeek} local={$i18n.locale} onUpdateModelValue={datePickerMenu = false} />
                  </VMenu>
                </Grid>
                <Box sx={ flexGrow: 1 } />
                {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                <Grid cols="auto">
                  {(!newTimelineEventImage) ? (
                    <AppButtonUpload className="ml-auto" url="none" file-name="image" accept="image/*" text={t('recipe.upload-image')} text-btn={false} post={false} onUploaded={uploadImage} />
                  ) : null}
                  {(!!newTimelineEventImage) ? (
                    <Button color="error" onClick={clearImage}>
                      {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                      <MdiIcon name={$globals.icons.close} />
                      {t("recipe.remove-image")}
                    </Button>
                  ) : null}
                </Grid>
              </Grid>
              {(newTimelineEventImage && newTimelineEventImagePreviewUrl) ? (
                <Grid container>
                  {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                  <Grid cols="12">
                    <ImageCropper img={newTimelineEventImagePreviewUrl} cropper-width="100%" onSave={updateUploadedImage} />
                  </Grid>
                </Grid>
              ) : null}
            </Container>
          </form>
        </CardContent>
      </BaseDialog>
    </div>
    <div>
      {(lastMadeReady) ? (
        <div className="d-flex justify-center flex-wrap">
          <Grid container no-gutters className="d-flex flex-wrap align-center" style="font-size: larger">
            {/* WF4-REVIEW: activator slot variants [J] */}
            <Tooltip location="bottom">
              <template>
                <Button rounded variant="outlined" size="large" {...(tooltipProps)} className="font-weight-400" style="border-color: rgb(var(--v-theme-primary));" onClick={madeThisDialog = true}>
                  {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                  <MdiIcon name={$globals.icons.calendar} size="large" color="primary" />
                  <span className="opacity-80">
                    <strong>
                      {t("general.last-made")}
                    </strong>
                    <br />
                    {lastMade ? $d(new Date(lastMade)) : t("general.never")}
                  </span>
                  {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "end" on <v-icon> */}
                  <MdiIcon name={$globals.icons.createAlt} size="large" color="primary" />
                </Button>
              </template>
              <span>
                {t("recipe.made-this")}
              </span>
            </Tooltip>
          </Grid>
        </div>
      ) : null}
    </div>
  </div>
    </>
  );
}
