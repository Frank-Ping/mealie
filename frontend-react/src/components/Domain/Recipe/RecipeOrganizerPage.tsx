import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Card, CardActions, CardContent, CardHeader, FormControlLabel, Grid, TextField, Typography } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import Fuse from "fuse.js";
import { useContextPresets } from "@/composables/use-context-presents";
import RecipeOrganizerDialog from "@/components/Domain/Recipe/RecipeOrganizerDialog";
import { Organizer, type RecipeOrganizer } from "@/lib/api/types/non-generated";
import { useRouteQuery } from "@/composables/use-router";
import { deepCopy } from "@/composables/use-utils";
import { useMealieAuth } from "@/composables/use-mealie-auth";

interface GenericItem {
  id: string;
  name: string;
  slug: string;
  onHand: boolean;
}

export default function RecipeOrganizerPage() {
  const { t } = useTranslation();

  const props = defineProps<{
    items: GenericItem[];
    icon: string;
    itemType: RecipeOrganizer;
  }>();

  const emit = defineEmits<{
    update: [item: GenericItem];
    delete: [id: string];
  }>();

  const state = /* WF4-REVIEW [J] */ reactive({
    // Search Options
    options: {
      ignoreLocation: true,
      shouldSort: true,
      threshold: 0.2,
      location: 0,
      distance: 20,
      findAllMatches: true,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ["name"],
    },
  });

  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user??.groupSlug || "", []); // WF4-REVIEW: dependency array

  // =================================================================
  // Context Menu

  const [dialogs, setDialogs] = useState({
    organizer: false,
    update: false,
    delete: false,
  });

  const presets = useContextPresets();

  const translationKey = computed<string>(() => {
    const typeMap = {
      categories: "category.category",
      tags: "tag.tag",
      tools: "tool.tool",
      foods: "shopping-list.food",
      households: "household.household",
    };
    return typeMap[props.itemType] || "";
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [updateTarget, setUpdateTarget] = useState(null);

  function confirmDelete(item: GenericItem) {
    setDeleteTarget(item);
    dialogs.delete = true;
  }

  function deleteOne() {
    if (!deleteTarget) {
      return;
    }

    emit("delete", deleteTarget.id);
  }

  function openUpdateDialog(item: GenericItem) {
    setUpdateTarget(deepCopy(item));
    dialogs.update = true;
  }

  function updateOne() {
    if (!updateTarget) {
      return;
    }

    emit("update", updateTarget);
  }

  // ================================================================
  // Search Functions

  const searchString = useRouteQuery("q", "");

  const fuse = useMemo(() =>  {
    return new Fuse(props.items, state.options, []); // WF4-REVIEW: dependency array
  });

  const fuzzyItems = useMemo(() =>  {
    if (searchString.trim(, []); // WF4-REVIEW: dependency array === "") {
      return props.items;
    }
    const result = fuse.search(searchString.trim() as string);
    return result.map(x => x.item);
  });

  // =================================================================
  // Sorted Items

  const itemsSorted = computed(() => {
    const byLetter: { [key: string]: Array<GenericItem> } = {};

    if (!fuzzyItems) {
      return byLetter;
    }

    [...fuzzyItems]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((item) => {
        const letter = item.name[0].toUpperCase();
        if (!byLetter[letter]) {
          byLetter[letter] = [];
        }
        byLetter[letter].push(item);
      });

    return byLetter;
  });

  function isTitle(str: number | string) {
    return typeof str === "string" && str.length === 1;
  }

  return (
    <>
  {(items) ? (
    <div>
      {/* WF4-REVIEW: v-model on complex expression "dialogs.organizer" [J] */}
      <RecipeOrganizerDialog {/* WF4-REVIEW: v-model dialogs.organizer */} item-type={itemType} />
      {(deleteTarget) ? (
        /* WF4-REVIEW: v-model on complex expression "dialogs.delete" [J] */
        <BaseDialog {/* WF4-REVIEW: v-model dialogs.delete */} bottom-sheet title={t('general.delete-with-name', { name: t(translationKey) })} color="error" icon={$globals.icons.alertCircle} can-confirm onConfirm={deleteOne()}>
          <CardContent>
            <p>
              {t("general.confirm-delete-generic-with-name", { name: t(translationKey) })}
            </p>
            <p className="mt-4 mb-0 ml-4">
              {deleteTarget.name}
            </p>
          </CardContent>
        </BaseDialog>
      ) : null}
      {(updateTarget) ? (
        /* WF4-REVIEW: v-model on complex expression "dialogs.update" [J] */
        <BaseDialog {/* WF4-REVIEW: v-model dialogs.update */} title={t('general.update')} icon={$globals.icons.edit} can-confirm onConfirm={updateOne()}>
          <CardContent>
            {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "updateTarget.name" [J] */}
            <TextField {/* WF4-REVIEW: v-model updateTarget.name */} label={t('general.name')} />
            {(itemType === Organizer.Tool) ? (
              /* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "updateTarget.onHand" [J] */
              <FormControlLabel {/* WF4-REVIEW: v-model updateTarget.onHand */} label={t('tool.on-hand')} />
            ) : null}
          </CardContent>
        </BaseDialog>
      ) : null}
      <Grid container density="comfortable">
        {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
        <Grid>
          {/* WF4-REVIEW: rules/error-messages → error+helperText */}
          <TextField value={searchString} onChange={/* WF4-REVIEW: setter */ setSearchString} variant="outlined" autofocus color="primary accent-3" placeholder={t('search.search-placeholder')} prepend-inner-icon={$globals.icons.search} clearable />
        </Grid>
      </Grid>
      <Grid container color="transparent" flat className="mt-n1 rounded align-center position-relative w-100 left-0 top-0">
        {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
        <MdiIcon name={icon} size="large" />
        <Typography variant="h6" className="headline">
          <slot name="title" />
        </Typography>
        <Box sx={ flexGrow: 1 } />
        <BaseButton create onClick={dialogs.organizer = true} />
      </Grid>
      {itemsSorted.map((itms, key, idx) => (
        <section key={'header' + idx} className={idx === 1 ? null : 'my-4'}>
          {(isTitle(key)) ? (
            <BaseCardSectionTitle title={key} />
          ) : null}
          <Grid container>
            {itms.map((item, index) => (
              /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
              <Grid key={'cat' + index} cols="12" sm={12} md={6} lg={4} xl={3}>
                {(item) ? (
                  <Card className="left-border" hover to={`/g/${groupSlug}?${itemType}=${item.id}`}>
                    <CardActions>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={icon} />
                      {/* WF4-REVIEW: title text moves to the title prop */}
                      <CardHeader className="py-1 text-truncate flex-shrink-1 flex-grow-1">
                        {item.name}
                      </CardHeader>
                      <ContextMenu items={[presets.delete, presets.edit]} onDelete={confirmDelete(item)} onEdit={openUpdateDialog(item)} />
                    </CardActions>
                  </Card>
                ) : null}
              </Grid>
            ))}
          </Grid>
        </section>
      ))}
    </div>
  ) : null}
    </>
  );
}
