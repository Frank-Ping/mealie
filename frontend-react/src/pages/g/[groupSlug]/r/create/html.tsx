import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, CardActions, CardContent, CardHeader, Collapse, Divider, FormControlLabel, TextField, form } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import type { AxiosResponse } from "axios";
import { useTagStore } from "@/composables/store/use-tag-store";
import { useUserApi } from "@/composables/api";
import { useGroupSelf } from "@/composables/use-groups";
import { useNewRecipeOptions } from "@/composables/use-new-recipe-options";
import { validators } from "@/composables/use-validators";
import type { VForm } from "@/types/auto-forms";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function Html() {
  const { t } = useTranslation();

  const state = /* WF4-REVIEW [J] */ reactive({
    error: false,
    loading: false,
    isEditJSON: false,
  });
  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  const [domUrlForm, setDomUrlForm] = useState(null);

  const { group } = useGroupSelf();
  const aiImporterTarget = useMemo(() => `/g/${groupSlug}/r/create/ai`, []); // WF4-REVIEW: dependency array
  const aiEnabled = useMemo(() => !!group?.aiProviderSettings?.aiEnabled, []); // WF4-REVIEW: dependency array

  const api = useUserApi();
  const tags = useTagStore();

  const {
    importKeywordsAsTags,
    importCategories,
    stayInEditMode,
    parseRecipe,
    navigateToRecipe,
  } = useNewRecipeOptions();

  function handleResponse(response: AxiosResponse<string> | null, refreshTags = false) {
    if (response?.status !== 201) {
      state.error = true;
      state.loading = false;
      return;
    }
    if (refreshTags) {
      tags.actions.refresh();
    }

    navigateToRecipe(response.data, groupSlug, `/g/${groupSlug}/r/create/html`);
  }

  const [newRecipeData, setNewRecipeData] = useState(null);
  const [newRecipeUrl, setNewRecipeUrl] = useState(null);

  function handleIsEditJson() {
    if (state.isEditJSON) {
      if (newRecipeData) {
        try {
          setNewRecipeData(JSON.parse(newRecipeData as string));
        }
        catch {
          setNewRecipeData({ data: newRecipeData });
        }
      }
      else {
        setNewRecipeData({});
      }
    }
    else if (newRecipeData && Object.keys(newRecipeData).length > 0) {
      setNewRecipeData(JSON.stringify(newRecipeData));
    }
    else {
      setNewRecipeData(null);
    }
  }
  handleIsEditJson();

  const [createStatus, setCreateStatus] = useState(null);
  async function createFromHtmlOrJson(htmlOrJsonData: string | object | null, importKeywordsAsTags: boolean, importCategories: boolean, url: string | null = null) {
    if (!htmlOrJsonData) {
      return;
    }

    const isValid = await domUrlForm?.validate();
    if (!isValid?.valid) {
      return;
    }

    let dataString;
    if (typeof htmlOrJsonData === "string") {
      dataString = htmlOrJsonData;
    }
    else {
      dataString = JSON.stringify(htmlOrJsonData);
    }

    state.error = false;
    state.loading = true;
    const { response } = await api.recipes.createOneByHtmlOrJson(
      dataString,
      importKeywordsAsTags,
      importCategories,
      url,
      (message: string) => setCreateStatus(message,
    ));
    setCreateStatus(null);
    handleResponse(response, importKeywordsAsTags);
  }

  return (
    <>
  {/* WF4-REVIEW: validation semantics [J] */}
  <form ref="domUrlForm" onSubmit={(e) => { e.preventDefault(); createFromHtmlOrJson(newRecipeData, importKeywordsAsTags, importCategories, newRecipeUrl); }}>
    <div>
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader className="headline">
        {t('recipe.import-from-html-or-json')}
      </CardHeader>
      <CardContent>
        <p>
          {t("recipe.import-from-html-or-json-description")}
        </p>
        <p>
          {t("recipe.json-import-format-description-colon")}
          <a href="https://schema.org/Recipe" target="_blank" className="text-primary">
            https://schema.org/Recipe
          </a>
        </p>
        {(aiEnabled) ? (
          <p>
            {t("recipe.import-from-html-or-json-have-ai-read-it")}
            <router-link to={aiImporterTarget} className="text-primary">
              {t("recipe.import-with-ai")}
            </router-link>
            .
          </p>
        ) : null}
        {/* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "state.isEditJSON" [J] */}
        <FormControlLabel {/* WF4-REVIEW: v-model state.isEditJSON */} label={t('recipe.json-editor')} color="primary" className="mt-2" onChange={handleIsEditJson} />
        {/* WF4-REVIEW: rules/error-messages → error+helperText */}
        <TextField value={newRecipeUrl} onChange={setNewRecipeUrl} label={t('new-recipe.recipe-url')} prepend-inner-icon={$globals.icons.link} validate-on="blur" variant="solo-filled" clearable rounded rules={[validators.urlOptional]} hint={t('new-recipe.copy-and-paste-the-source-url-of-your-data-optional')} persistent-hint className="mt-10 mb-4" style="max-width: 500px" />
        {(state.isEditJSON) ? (
          <RecipeJsonEditor value={newRecipeData} onChange={setNewRecipeData} height="250px" mode="code" main-menu-bar={false} />
        ) : (
          <TextField multiline value={newRecipeData} onChange={setNewRecipeData} label={t('new-recipe.recipe-html-or-json')} prepend-inner-icon={$globals.icons.codeTags} validate-on="blur" autofocus variant="solo-filled" clearable rounded />
        )}
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={importKeywordsAsTags} onChange={/* WF4-REVIEW: setter */ setImportKeywordsAsTags} color="primary" hide-details label={t('recipe.import-original-keywords-as-tags')} />
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={importCategories} onChange={/* WF4-REVIEW: setter */ setImportCategories} color="primary" hide-details label={t('recipe.import-original-categories')} />
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={stayInEditMode} onChange={/* WF4-REVIEW: setter */ setStayInEditMode} color="primary" hide-details label={t('recipe.stay-in-edit-mode')} />
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={parseRecipe} onChange={/* WF4-REVIEW: setter */ setParseRecipe} color="primary" hide-details label={t('recipe.parse-recipe-ingredients-after-import')} />
      </CardContent>
      <CardActions className="justify-center">
        <div style="width: 100%" className="text-center">
          <div style="width: 250px; margin: 0 auto">
            <BaseButton disabled={!newRecipeData} rounded block type="submit" loading={state.loading} />
          </div>
          <CardContent className="py-2">
            {createStatus}
          </CardContent>
        </div>
      </CardActions>
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
                {t("new-recipe.html-or-json-error-details")}
              </p>
            </div>
            <div className="d-flex row justify-space-around my-3 force-url-white">
              <a className="text-primary" href="https://developers.google.com/search/docs/data-types/recipe" target="_blank" rel="noreferrer nofollow">
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
  </form>
    </>
  );
}
