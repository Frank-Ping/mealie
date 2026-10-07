import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, CardActions, CardContent, CardHeader, Collapse, Divider, FormControlLabel, TextField, form } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import type { AxiosResponse } from "axios";
import { useUserApi } from "@/composables/api";
import { useGroupSelf } from "@/composables/use-groups";
import { useTagStore } from "@/composables/store/use-tag-store";
import { useNewRecipeOptions } from "@/composables/use-new-recipe-options";
import { validators } from "@/composables/use-validators";
import type { VForm } from "@/types/auto-forms";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export const handle = {
  key: route => route.path,
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Url() {
  const { t } = useTranslation();

  const state = /* WF4-REVIEW [J] */ reactive({
    error: false,
    loading: false,
  });

  const auth = useMealieAuth();
  const api = useUserApi();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  const { group } = useGroupSelf();

  const navigate = useNavigate();
  const tags = useTagStore();

  const {
    importKeywordsAsTags,
    importCategories,
    stayInEditMode,
    parseRecipe,
    navigateToRecipe,
  } = useNewRecipeOptions();

  const bulkImporterTarget = useMemo(() => `/g/${groupSlug}/r/create/bulk`, []); // WF4-REVIEW: dependency array
  const htmlOrJsonImporterTarget = useMemo(() => `/g/${groupSlug}/r/create/html`, []); // WF4-REVIEW: dependency array
  const aiImporterTarget = useMemo(() => `/g/${groupSlug}/r/create/ai`, []); // WF4-REVIEW: dependency array
  const aiEnabled = useMemo(() => !!group?.aiProviderSettings?.aiEnabled, []); // WF4-REVIEW: dependency array

  function handleResponse(response: AxiosResponse<string> | null, refreshTags = false) {
    if (response?.status !== 201) {
      state.error = true;
      state.loading = false;
      return;
    }
    if (refreshTags) {
      tags.actions.refresh();
    }

    navigateToRecipe(response.data, groupSlug, `/g/${groupSlug}/r/create/url`);
  }

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const recipeUrl = computed({
    set(recipe_import_url: string | null) {
      if (recipe_import_url !== null) {
        recipe_import_url = recipe_import_url.trim();
        navigate(/* WF4-REVIEW: replace+query */ { query: { ...route.query, recipe_import_url } });
      }
    },
    get() {
      // Prefer the 'url' share field (recipe_import_url, populated by Chrome when
      // sharing a page URL). Fall back to the 'text' share field (recipe_import_text)
      // for apps that share URLs as plain text, but only when the text value is
      // actually a valid http/https URL — shared text can be arbitrary.
      const urlFromField = route.query.recipe_import_url as string | null;
      if (urlFromField) {
        return urlFromField;
      }
      const textFromField = route.query.recipe_import_text as string | null;
      if (textFromField) {
        try {
          const parsed = new URL(textFromField);
          if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return textFromField;
          }
        }
        catch { /* not a URL, ignore */ }
      }
      return null;
    },
  });

  /* WF4-REVIEW [J] */ onMounted(() => {
    if (recipeUrl) {
      // Apply legacy query params for older automations such as the Bookmarklet.
      // These are no longer used by the app itself but are easy to keep supporting.
      const importKeywordsAsTagsParam = route.query.use_keywords;
      if (importKeywordsAsTagsParam === "1") {
        importKeywordsAsTags = true;
      }
      else if (importKeywordsAsTagsParam === "0") {
        importKeywordsAsTags = false;
      }

      const stayInEditModeParam = route.query.edit;
      if (stayInEditModeParam === "1") {
        stayInEditMode = true;
      }
      else if (stayInEditModeParam === "0") {
        stayInEditMode = false;
      }

      // The URL is pre-filled via the recipeUrl computed property.
      // Do not auto-submit: the user should review the import options and
      // confirm by clicking the submit button.
    }
  });

  const [domUrlForm, setDomUrlForm] = useState(null);

  // Remove import URL from query params when leaving the page
  const [isLeaving, setIsLeaving] = useState(false);
  onBeforeRouteLeave((to) => {
    if (isLeaving) {
      return;
    }
    setIsLeaving(true);
    navigate(/* WF4-REVIEW: replace+query */ { query: undefined }).then(() => navigate(to));
  });

  const [createStatus, setCreateStatus] = useState(null);
  async function createByUrl(url: string | null, importKeywordsAsTags: boolean, importCategories: boolean) {
    if (url === null) {
      return;
    }

    if (!domUrlForm?.validate() || url === "") {
      console.log("Invalid URL", url);
      return;
    }
    state.loading = true;
    const { response } = await api.recipes.createOneByUrl(
      url,
      importKeywordsAsTags,
      importCategories,
      (message: string) => setCreateStatus(message,
    ));
    setCreateStatus(null);
    handleResponse(response, importKeywordsAsTags);
  }

  return (
    <>
  <div>
    {/* WF4-REVIEW: validation semantics [J] */}
    <form ref="domUrlForm" onSubmit={(e) => { e.preventDefault(); createByUrl(recipeUrl, importKeywordsAsTags, importCategories); }}>
      <div>
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="headline">
          {t('recipe.scrape-recipe')}
        </CardHeader>
        <CardContent>
          <CardContent className="pa-0">
            <p>
              {t('recipe.scrape-recipe-description')}
            </p>
            {(group?.aiProviderSettings?.audioProviderEnabled) ? (
              <p>
                {t('recipe.scrape-recipe-description-transcription')}
              </p>
            ) : null}
          </CardContent>
          <CardContent className="px-0">
            <p>
              {t('recipe.scrape-recipe-have-a-lot-of-recipes')}
              <router-link to={bulkImporterTarget} className="text-primary">
                {t('recipe.scrape-recipe-suggest-bulk-importer')}
              </router-link>
              .
            </p>
            <p>
              {t('recipe.scrape-recipe-have-raw-html-or-json-data')}
              <router-link to={htmlOrJsonImporterTarget} className="text-primary">
                {t('recipe.scrape-recipe-you-can-import-from-raw-data-directly')}
              </router-link>
              .
            </p>
            {(aiEnabled) ? (
              <p>
                {t('recipe.scrape-recipe-have-ai-read-the-page')}
                <router-link to={aiImporterTarget} className="text-primary">
                  {t('recipe.import-with-ai')}
                </router-link>
                .
              </p>
            ) : null}
          </CardContent>
          {/* WF4-REVIEW: rules/error-messages → error+helperText */}
          <TextField value={recipeUrl} onChange={/* WF4-REVIEW: setter */ setRecipeUrl} label={t('new-recipe.recipe-url')} prepend-inner-icon={$globals.icons.link} validate-on="blur" autofocus variant="solo-filled" clearable className="rounded-lg mt-2" rounded rules={[validators.url]} hint={t('new-recipe.url-form-hint')} persistent-hint />
        </CardContent>
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={importKeywordsAsTags} onChange={/* WF4-REVIEW: setter */ setImportKeywordsAsTags} color="primary" hide-details label={t('recipe.import-original-keywords-as-tags')} />
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={importCategories} onChange={/* WF4-REVIEW: setter */ setImportCategories} color="primary" hide-details label={t('recipe.import-original-categories')} />
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={stayInEditMode} onChange={/* WF4-REVIEW: setter */ setStayInEditMode} color="primary" hide-details label={t('recipe.stay-in-edit-mode')} />
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={parseRecipe} onChange={/* WF4-REVIEW: setter */ setParseRecipe} color="primary" hide-details label={t('recipe.parse-recipe-ingredients-after-import')} />
        <CardActions className="justify-center">
          <div style="width: 100%" className="text-center">
            <div style="width: 250px; margin: 0 auto">
              <BaseButton disabled={recipeUrl === null} rounded block type="submit" loading={state.loading} />
            </div>
            <CardContent className="py-2">
              {createStatus}
            </CardContent>
          </div>
        </CardActions>
      </div>
    </form>
    {/* WF4-REVIEW: transition semantics */}
    <Collapse in={true}>
      {(state.error) ? (
        <Alert color="error" className="mt-6 white--text">
          {/* WF4-REVIEW: title text moves to the title prop */}
          <CardHeader className="ma-0 pa-0">
            {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
            <MdiIcon name={$globals.icons.robot} color="white" size="x-large" />
            {t("new-recipe.error-title")}
          </CardHeader>
          <Divider className="my-3 mx-2" />
          <div className="force-url-white">
            <p>
              {t("recipe.scrape-recipe-website-being-blocked")}
              <router-link to={htmlOrJsonImporterTarget}>
                {t("recipe.scrape-recipe-try-importing-raw-html-instead")}
              </router-link>
            </p>
            {(aiEnabled) ? (
              <p>
                {t("recipe.scrape-recipe-have-ai-read-the-page")}
                <router-link to={aiImporterTarget}>
                  {t("recipe.import-with-ai")}
                </router-link>
                .
              </p>
            ) : null}
            <br />
            <p>
              {t("new-recipe.error-details")}
            </p>
          </div>
          <div className="d-flex row justify-space-around my-3 force-url-white">
            <a className="dark text-primary" href="https://developers.google.com/search/docs/data-types/recipe" target="_blank" rel="noreferrer nofollow">
              {t("new-recipe.google-ld-json-info")}
            </a>
            <a className="text-primary" href="https://github.com/mealie-recipes/mealie/issues" target="_blank" rel="noreferrer nofollow">
              {t("new-recipe.github-issues")}
            </a>
            <a className="text-primary" href="https://schema.org/Recipe" target="_blank" rel="noreferrer nofollow">
              {t("new-recipe.recipe-markup-specification")}
            </a>
          </div>
        </Alert>
      ) : null}
    </Collapse>
  </div>
    </>
  );
}
