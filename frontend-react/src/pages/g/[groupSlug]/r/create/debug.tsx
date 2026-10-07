import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CardActions, CardContent, CardHeader, FormControlLabel, TextField, form } from "@mui/material";
import { icons } from "@/lib/icons";
import { useUserApi } from "@/composables/api";
import { useGroupSelf } from "@/composables/use-groups";
import { validators } from "@/composables/use-validators";
import type { Recipe } from "@/lib/api/types/recipe";

export default function Debug() {
  const { t } = useTranslation();

  const state = /* WF4-REVIEW [J] */ reactive({
    loading: false,
    useOpenAI: false,
  });

  const api = useUserApi();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const navigate = useNavigate();
  const { group } = useGroupSelf();

  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const recipeUrl = computed({
    set(recipe_import_url: string | null) {
      if (recipe_import_url !== null) {
        recipe_import_url = recipe_import_url.trim();
        navigate(/* WF4-REVIEW: replace+query */ { query: { ...route.query, recipe_import_url } });
      }
    },
    get() {
      return route.query.recipe_import_url as string | null;
    },
  });

  const [debugTreeView, setDebugTreeView] = useState(false);

  const [debugData, setDebugData] = useState(null);

  async function debugUrl(url: string | null) {
    if (url === null) {
      return;
    }

    state.loading = true;

    const { data } = await api.recipes.testCreateOneUrl(url, state.useOpenAI);

    state.loading = false;
    setDebugData(data);
  }

  return (
    <>
  <div>
    {/* WF4-REVIEW: validation semantics [J] */}
    <form ref="domUrlForm" onSubmit={(e) => { e.preventDefault(); debugUrl(recipeUrl); }}>
      <div>
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="headline">
          {t('recipe.recipe-debugger')}
        </CardHeader>
        <CardContent>
          {t('recipe.recipe-debugger-description')}
          {/* WF4-REVIEW: rules/error-messages → error+helperText */}
          <TextField value={recipeUrl} onChange={/* WF4-REVIEW: setter */ setRecipeUrl} label={t('new-recipe.recipe-url')} validate-on="blur" prepend-inner-icon={icons.link} autofocus variant="solo-filled" clearable rounded className="rounded-lg mt-2" rules={[validators.url]} hint={t('new-recipe.url-form-hint')} persistent-hint />
        </CardContent>
        {(group?.aiProviderSettings?.aiEnabled) ? (
          <CardContent>
            {t('recipe.recipe-debugger-use-openai-description')}
            {/* WF4-REVIEW: control={<Checkbox/>} + label prop; v-model on complex expression "state.useOpenAI" [J] */}
            <FormControlLabel label={t('recipe.use-openai')} />
          </CardContent>
        ) : null}
        <CardActions className="justify-center">
          <div style="width: 250px">
            <BaseButton disabled={recipeUrl === null} rounded block type="submit" color="info" loading={state.loading}>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {icons.robot}
              </>
              {t('recipe.debug')}
            </BaseButton>
          </div>
        </CardActions>
      </div>
    </form>
    {(debugData) ? (
      <section>
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={debugTreeView} onChange={setDebugTreeView} label={t('recipe.tree-view')} />
        <RecipeJsonEditor value={debugData} onChange={setDebugData} height="700px" mode={debugTreeView ? 'tree' : 'text'} main-menu-bar={false} read-only={true} />
      </section>
    ) : null}
  </div>
    </>
  );
}
