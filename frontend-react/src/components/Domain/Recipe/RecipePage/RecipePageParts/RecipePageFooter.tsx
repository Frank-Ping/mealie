import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, CardActions, CardContent, CardHeader, Divider, Grid, TextField } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { usePageState } from "@/composables/recipe-page/shared-state";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { Recipe } from "@/lib/api/types/recipe";

export default function RecipePageFooter() {
  const { t } = useTranslation();

  const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
  const { isEditForm, isCookMode } = usePageState(recipe.slug);
  const [apiNewKey, setApiNewKey] = useState("");

  function createApiExtra() {
    if (!recipe) {
      return;
    }
    if (!recipe.extras) {
      recipe.extras = {};
    }
    // check for duplicate keys
    if (Object.keys(recipe.extras).includes(apiNewKey)) {
      return;
    }
    recipe.extras[apiNewKey] = "";
    setApiNewKey("");
  }

  function removeApiExtra(key: string | number) {
    if (!recipe) {
      return;
    }
    if (!recipe.extras) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete recipe.extras[key];
    recipe.extras = { ...recipe.extras };
  }

  return (
    <>
  <div>
    <CardActions className="justify-end">
      {(isEditForm) ? (
        /* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "recipe.orgURL" [J] */
        <TextField {/* WF4-REVIEW: v-model recipe.orgURL */} className="mt-10" variant="underlined" label={t('recipe.original-url')} />
      ) : (recipe.orgURL && !isCookMode) ? (
        <Button hover={false} ripple={false} variant="flat" to={recipe.orgURL} color="secondary-darken-1" target="_blank" className="mr-n2" size="small">
          {t("recipe.original-url")}
        </Button>
      ) : null}
    </CardActions>
    <AdvancedOnly>
      {(isEditForm) ? (
        <Card flat className="mb-2 mx-n2">
          {/* WF4-REVIEW: title text moves to the title prop */}
          <CardHeader className="text-h5 font-weight-medium opacity-80">
            {t('recipe.api-extras')}
          </CardHeader>
          <Divider className="ml-4" />
          <CardContent>
            {t('recipe.api-extras-description')}
            {recipe.extras.map((_, key) => (
              <Grid container key={key} className="mt-1">
                {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                <Grid style="max-width: 400px;">
                  {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "recipe.extras[key]" [J] */}
                  <TextField {/* WF4-REVIEW: v-model recipe.extras[key] */} density="compact" variant="underlined" label={key}>
                    <template>
                      <Button color="error" icon className="mt-n4" onClick={removeApiExtra(key)}>
                        {/* WF4-REVIEW: icon name resolves via lib/icons */}
                        <MdiIcon name={$globals.icons.delete} />
                      </Button>
                    </template>
                  </TextField>
                </Grid>
              </Grid>
            ))}
          </CardContent>
          <CardActions className="d-flex ml-2 mt-n3">
            <div>
              {/* WF4-REVIEW: rules/error-messages → error+helperText */}
              <TextField value={apiNewKey} onChange={setApiNewKey} min-width="200px" label={t('recipe.message-key')} variant="underlined" />
            </div>
            <BaseButton create size="small" className="ml-5" onClick={createApiExtra} />
          </CardActions>
        </Card>
      ) : null}
    </AdvancedOnly>
  </div>
    </>
  );
}
