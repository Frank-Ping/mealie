import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, CardActions, CardContent, CardHeader, FormControlLabel, Grid, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { whenever } from "@vueuse/shared";
import { useUserApi } from "@/composables/api";
import { alert } from "@/composables/use-toast";
import RecipeOrganizerSelector from "@/components/Domain/Recipe/RecipeOrganizerSelector";
import type { ReportSummary } from "@/lib/api/types/reports";
import RecipeDialogBulkAdd from "@/components/Domain/Recipe/RecipeDialogBulkAdd";

export default function Bulk() {
  const { t } = useTranslation();

  const state = /* WF4-REVIEW [J] */ reactive({
    showCatTags: false,
    bulkDialog: false,
  });

  whenever(
    () => !state.showCatTags,
    () => {
      console.log("showCatTags changed");
    },
  );

  const api = useUserApi();
  const { i18n } = useTranslation();

  const [bulkUrls, setBulkUrls] = useState([{ url: "", categories: [], tags: [] }]);
  const [lockBulkImport, setLockBulkImport] = useState(false);

  async function bulkCreate() {
    if (bulkUrls.length === 0) {
      return;
    }

    const { response } = await api.recipes.createManyByUrl({ imports: bulkUrls });

    if (response?.status === 202) {
      alert.success(i18n.t("recipe.bulk-import-process-has-started"));
      setLockBulkImport(true);
    }
    else {
      alert.error(i18n.t("recipe.bulk-import-process-has-failed"));
    }

    fetchReports();
  }

  // =========================================================
  // Reports

  const [reports, setReports] = useState([]);

  async function fetchReports() {
    const { data } = await api.groupReports.getAll("bulk_import");
    setReports(data ?? []);
  }

  async function deleteReport(id: string) {
    console.log(id);
    const { response } = await api.groupReports.deleteOne(id);

    if (response?.status === 200) {
      fetchReports();
    }
    else {
      alert.error(i18n.t("recipe.report-deletion-failed"));
    }
  }

  fetchReports();

  function assignUrls(urls: string[]) {
    if (urls.length === 0) {
      return;
    }

    setBulkUrls(urls.map(url => ({ url, categories: [], tags: [] })));
  }

  return (
    <>
  <div>
    <div>
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader className="headline">
        {t('recipe.recipe-bulk-importer')}
      </CardHeader>
      <CardContent>
        {t('recipe.recipe-bulk-importer-description')}
      </CardContent>
      <div className="px-4">
        <section className="mt-2">
          {bulkUrls.map((_, idx) => (
            <Grid container key={'bulk-url' + idx} className="my-1" density="compact">
              {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
              <Grid cols="12" xs="12" sm="12" md="12">
                {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "bulkUrls[idx].url" [J] */}
                <TextField label={t('new-recipe.recipe-url')} density="compact" single-line validate-on="blur" autofocus variant="solo-filled" hide-details clearable prepend-inner-icon={icons.link} rounded className="rounded-lg">
                  {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                  <>
                    <Button style="margin-top: -2px" icon size="small" onClick={bulkUrls.splice(idx, 1)}>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={icons.delete} />
                    </Button>
                  </>
                </TextField>
              </Grid>
              {(state.showCatTags) ? (
                <>
                  {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                  <Grid cols="12" xs="12" sm="6" className="py-0">
                    {/* WF4-REVIEW: v-model on complex expression "bulkUrls[idx].categories" [J] */}
                    <RecipeOrganizerSelector selector-type="categories" input-attrs={{
                    variant: 'filled',
                    singleLine: true,
                    density: 'compact',
                    rounded: true,
                    class: 'rounded-lg',
                    hideDetails: true,
                    clearable: true,
                  }} />
                  </Grid>
                  {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                  <Grid cols="12" xs="12" sm="6" className="pt-0 pb-4">
                    {/* WF4-REVIEW: v-model on complex expression "bulkUrls[idx].tags" [J] */}
                    <RecipeOrganizerSelector selector-type="tags" input-attrs={{
                    variant: 'filled',
                    singleLine: true,
                    density: 'compact',
                    rounded: true,
                    class: 'rounded-lg',
                    hideDetails: true,
                    clearable: true,
                  }} />
                  </Grid>
                </>
              ) : null}
            </Grid>
          ))}
          <CardActions className="justify-end flex-wrap mt-3 pa-0">
            <BaseButton className="mt-1 pr-4" delete onClick={() => setBulkUrls([];
                lockBulkImport = false;)}>
              {t('general.clear')}
            </BaseButton>
            <Box sx={{ flexGrow: 1 }} />
            <BaseButton className="mr-1 mb-1" color="info" onClick={bulkUrls.push({ url: '', categories: [], tags: [] })}>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {icons.createAlt}
              </>
              {t('general.new')}
            </BaseButton>
            {/* WF4-REVIEW: v-model on complex expression "state.bulkDialog" [J] */}
            <RecipeDialogBulkAdd className="mr-1 mr-sm-0 mb-1" onBulkData={assignUrls} />
          </CardActions>
          <div className="px-0">
            {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "state.showCatTags" [J] */}
            <FormControlLabel hide-details label={t('recipe.set-categories-and-tags')} />
          </div>
          <CardActions className="justify-center">
            <div style="width: 250px">
              <BaseButton text={t('general.create')} disabled={bulkUrls.length === 0 || lockBulkImport} rounded block onClick={bulkCreate}>
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {icons.check}
                </>
              </BaseButton>
            </div>
          </CardActions>
        </section>
        <section className="mt-12">
          <BaseCardSectionTitle title={t('recipe.bulk-imports')} />
          <ReportTable items={reports} onDelete={deleteReport} />
        </section>
      </div>
    </div>
  </div>
    </>
  );
}
