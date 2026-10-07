import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CardActions, CardContent, CardHeader, form } from "@mui/material";
import { icons } from "@/lib/icons";
import { useUserApi } from "@/composables/api";
import { useGlobalI18n } from "@/composables/use-global-i18n";
import { alert } from "@/composables/use-toast";
import { useMealieAuth } from "@/composables/use-mealie-auth";

export default function Zip() {
  const { t } = useTranslation();

  const state = /* WF4-REVIEW [J] */ reactive({
    loading: false,
  });
  const auth = useMealieAuth();
  const route = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]
  const groupSlug = useMemo(() => route.params.groupSlug as string || auth.user?.groupSlug || "", []); // WF4-REVIEW: dependency array

  const api = useUserApi();
  const navigate = useNavigate();

  const [newRecipeZip, setNewRecipeZip] = useState(null);
  const newRecipeZipFileName = "archive";

  async function createByZip() {
    if (!newRecipeZip) {
      return;
    }
    const formData = new FormData();
    formData.append(newRecipeZipFileName, newRecipeZip);

    try {
      const response = await api.upload.file("/api/recipes/create/zip", formData);
      if (response?.status !== 201) {
        throw new Error("Failed to upload zip");
      }
      navigate(`/g/${groupSlug}/r/${response.data}`);
    }
    catch (error) {
      console.error(error);
      const i18n = useGlobalI18n();
      alert.error(i18n.t("events.something-went-wrong"));
    }
    finally {
      state.loading = false;
    }
  }

  return (
    <>
  {/* WF4-REVIEW: validation semantics [J] */}
  <form>
    <div>
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader className="headline">
        {t('recipe.import-from-zip')}
      </CardHeader>
      <CardContent>
        {t('recipe.import-from-zip-description')}
        {/* WF4-REVIEW: unmapped <v-file-input> — judgement component, convert manually [J] */}
        <VFileInput value={newRecipeZip} onChange={setNewRecipeZip} accept=".zip" label=".zip" variant="solo-filled" clearable className="rounded-lg mt-2" rounded truncate-length="100" hint={t('recipe.zip-files-must-have-been-exported-from-mealie')} persistent-hint prepend-icon="" prepend-inner-icon={icons.zip} />
      </CardContent>
      <CardActions className="justify-center">
        <div style="width: 250px">
          <BaseButton disabled={newRecipeZip === null} rounded block loading={state.loading} onClick={createByZip} />
        </div>
      </CardActions>
    </div>
  </form>
    </>
  );
}
