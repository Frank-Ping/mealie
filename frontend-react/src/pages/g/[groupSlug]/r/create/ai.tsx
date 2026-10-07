import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, CardActions, CardContent, CardHeader, Collapse, Divider, FormControlLabel, TextField, Tooltip, form } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
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

export default function Ai() {
  const { t } = useTranslation();

  const state = /* WF4-REVIEW [J] */ reactive({
    error: false,
    errorMessage: "",
    loading: false,
    isEditJSON: false,
  });

  const { i18n } = useTranslation();
  const api = useUserApi();
  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const tags = useTagStore();
  const { group } = useGroupSelf();

  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array
  const urlImporterTarget = useMemo(() => `/g/${groupSlug}/r/create/url`, []); // WF4-REVIEW: dependency array
  const htmlOrJsonImporterTarget = useMemo(() => `/g/${groupSlug}/r/create/html`, []); // WF4-REVIEW: dependency array
  const aiEnabled = useMemo(() => !!group?.aiProviderSettings?.aiEnabled, []); // WF4-REVIEW: dependency array
  const imagesEnabled = useMemo(() => !!group?.aiProviderSettings?.imageProviderEnabled, []); // WF4-REVIEW: dependency array
  const videosEnabled = useMemo(() => !!group?.aiProviderSettings?.audioProviderEnabled, []); // WF4-REVIEW: dependency array

  const [domUrlForm, setDomUrlForm] = useState(null);
  const [recipeUrl, setRecipeUrl] = useState(null);
  const [newRecipeData, setNewRecipeData] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [createStatus, setCreateStatus] = useState(null);

  const {
    stayInEditMode,
    parseRecipe,
    translateRecipe,
    createNewOrganizers,
    navigateToRecipe,
  } = useNewRecipeOptions({
    enableImportKeywords: false,
    enableImportCategories: false,
    enableTranslateRecipe: true,
    enableCreateNewOrganizers: true,
  });

  const contentAsString = useMemo(() => {
    const data = newRecipeData;
    if (!data) {
      return null;
    }

    return typeof data === "string" ? data : JSON.stringify(data);
  }, []); // WF4-REVIEW: dependency array

  const hasSource = useMemo(() => !!(recipeUrl || contentAsString || uploadedImages.length), []); // WF4-REVIEW: dependency array

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

  async function createRecipe() {
    if (!hasSource) {
      return;
    }

    const isValid = await domUrlForm?.validate();
    if (!isValid?.valid) {
      return;
    }

    state.error = false;
    state.errorMessage = "";
    state.loading = true;

    const { data, error } = await api.recipes.createOneWithAI(
      {
        content: contentAsString,
        url: recipeUrl,
        images: uploadedImages,
        translateLanguage: translateRecipe ? i18n.locale : null,
        createNewOrganizers: createNewOrganizers,
      },
      (message: string) => setCreateStatus(message,
    ));

    setCreateStatus(null);

    if (error || !data) {
      state.error = true;
      state.errorMessage = error?.message || "";
      state.loading = false;
      return;
    }

    if (createNewOrganizers) {
      tags.actions.refresh();
    }

    navigateToRecipe(data, groupSlug, `/g/${groupSlug}/r/create/ai`);
  }

  return (
    <>
  {/* WF4-REVIEW: validation semantics [J] */}
  <form ref="domUrlForm" onSubmit={(e) => { e.preventDefault(); createRecipe; }}>
    <div>
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader className="headline">
        {t('recipe.import-with-ai')}
      </CardHeader>
      {(!aiEnabled) ? (
        <CardContent>
          <Alert type="info" variant="tonal">
            {t('recipe.import-with-ai-provider-required')}
          </Alert>
        </CardContent>
      ) : (
        <CardContent>
          <p>
            {t('recipe.import-with-ai-description')}
          </p>
          {(videosEnabled) ? (
            <p>
              {t('recipe.import-with-ai-video-description')}
            </p>
          ) : null}
          <br />
          <p>
            {t('recipe.import-with-ai-without-ai-question')}
            <router-link to={urlImporterTarget} className="text-primary">
              {t('recipe.import-with-ai-use-url-import')}
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
          {/* WF4-REVIEW: rules/error-messages → error+helperText */}
          <TextField value={recipeUrl} onChange={setRecipeUrl} label={t('new-recipe.recipe-url')} prepend-inner-icon={icons.link} validate-on="blur" variant="solo-filled" clearable rounded rules={[validators.urlOptional]} hint={t('recipe.import-with-ai-url-hint')} persistent-hint className="mt-8 mb-4" disabled={state.loading} />
          {/* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "state.isEditJSON" [J] */}
          <FormControlLabel label={t('recipe.json-editor')} color="primary" className="mt-2" disabled={state.loading} onChange={handleIsEditJson} />
          {(state.isEditJSON) ? (
            <RecipeJsonEditor value={newRecipeData} onChange={setNewRecipeData} height="250px" mode="code" main-menu-bar={false} />
          ) : (
            <TextField multiline value={newRecipeData} onChange={setNewRecipeData} label={t('recipe.import-with-ai-content')} prepend-inner-icon={icons.textBox} validate-on="blur" variant="solo-filled" clearable rounded hint={t('recipe.import-with-ai-content-hint')} persistent-hint disabled={state.loading} />
          )}
          {(imagesEnabled) ? (
            <div className="mt-6">
              <RecipeImportImages value={uploadedImages} onChange={setUploadedImages} disabled={state.loading} />
            </div>
          ) : (
            <Alert type="info" variant="tonal" className="mt-6">
              {t('recipe.import-with-ai-image-provider-required')}
            </Alert>
          )}
          {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
          <FormControlLabel value={translateRecipe} onChange={/* WF4-REVIEW: setter */ setTranslateRecipe} color="primary" hide-details label={t('recipe.should-translate-description')} disabled={state.loading} />
          <div className="d-flex align-center">
            {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
            <FormControlLabel value={createNewOrganizers} onChange={/* WF4-REVIEW: setter */ setCreateNewOrganizers} color="primary" hide-details label={t('recipe.create-new-organizers')} disabled={state.loading} />
            {/* WF4-REVIEW: activator slot variants [J] */}
            <Tooltip location="bottom" max-width="300">
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={icons.help} {...(tooltipProps)} size="small" className="ms-2" />
              </>
              <span>
                {t('recipe.create-new-organizers-hint')}
              </span>
            </Tooltip>
          </div>
          {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
          <FormControlLabel value={stayInEditMode} onChange={/* WF4-REVIEW: setter */ setStayInEditMode} color="primary" hide-details label={t('recipe.stay-in-edit-mode')} disabled={state.loading} />
          {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
          <FormControlLabel value={parseRecipe} onChange={/* WF4-REVIEW: setter */ setParseRecipe} color="primary" hide-details label={t('recipe.parse-recipe-ingredients-after-import')} disabled={state.loading} />
        </CardContent>
      )}
      {(aiEnabled) ? (
        <CardActions className="justify-center">
          <div style="width: 100%" className="text-center">
            <div style="width: 250px; margin: 0 auto">
              <BaseButton disabled={!hasSource} rounded block type="submit" loading={state.loading} />
            </div>
            <CardContent className="py-2">
              {createStatus}
            </CardContent>
          </div>
        </CardActions>
      ) : null}
      {/* WF4-REVIEW: transition semantics */}
      <Collapse in={true}>
        {(state.error) ? (
          <Alert color="error" className="mt-6 white--text">
            {/* WF4-REVIEW: title text moves to the title prop */}
            <CardHeader className="ma-0 pa-0">
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={icons.robot} color="white" size="x-large" />
              {t("new-recipe.error-title")}
            </CardHeader>
            <Divider className="my-3 mx-2" />
            <div className="force-url-white">
              <p>
                {state.errorMessage || t("recipe.import-with-ai-error-details")}
              </p>
            </div>
          </Alert>
        ) : null}
      </Collapse>
    </div>
  </form>
    </>
  );
}
