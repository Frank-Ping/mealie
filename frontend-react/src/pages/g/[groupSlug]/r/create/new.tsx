import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CardActions, CardContent, CardHeader, TextField, form } from "@mui/material";
import type { AxiosResponse } from "axios";
import { useUserApi } from "@/composables/api";
import { validators } from "@/composables/use-validators";
import type { VForm } from "@/types/auto-forms";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function New() {
  const { t } = useTranslation();

  const state = /* WF4-REVIEW [J] */ reactive({
    error: false,
    loading: false,
  });
  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const api = useUserApi();
  const navigate = useNavigate();

  function handleResponse(response: AxiosResponse<string> | null, edit = false) {
    if (response?.status !== 201) {
      state.error = true;
      state.loading = false;
      return;
    }
    navigate(`/g/${groupSlug}/r/${response.data}?edit=${edit.toString()}`);
  }

  const [newRecipeName, setNewRecipeName] = useState("");
  const [domCreateByName, setDomCreateByName] = useState(null);

  async function createByName(name: string) {
    if (!domCreateByName?.validate() || name === "") {
      return;
    }
    const { response } = await api.recipes.createOne({ name });
    handleResponse(response as any, true);
  }

  return (
    <>
  <div>
    {/* WF4-REVIEW: title text moves to the title prop */}
    <CardHeader className="headline">
      {t('recipe.create-recipe')}
    </CardHeader>
    <CardContent>
      {t('recipe.create-a-recipe-by-providing-the-name-all-recipes-must-have-unique-names')}
      {/* WF4-REVIEW: validation semantics [J] */}
      <form ref="domCreateByName" onSubmit={(e) => { e.preventDefault(); ; }}>
        {/* WF4-REVIEW: rules/error-messages → error+helperText */}
        <TextField value={newRecipeName} onChange={setNewRecipeName} label={t('recipe.recipe-name')} prepend-inner-icon={$globals.icons.primary} validate-on="blur" autofocus variant="solo-filled" clearable className="rounded-lg mt-2" color="primary" rounded rules={[validators.required]} hint={t('recipe.new-recipe-names-must-be-unique')} persistent-hint onKeyUp={createByName(newRecipeName)} />
      </form>
    </CardContent>
    <CardActions className="justify-center">
      <div style="width: 250px">
        <BaseButton disabled={newRecipeName.trim() === ''} rounded block loading={state.loading} onClick={createByName(newRecipeName)} />
      </div>
    </CardActions>
  </div>
    </>
  );
}
