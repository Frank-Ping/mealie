import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, CardHeader, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { alertUnreportedError } from "@/composables/use-toast";
import { useUserApi } from "@/composables/api";

export default function RecipeImageUploadBtn() {
  const { t } = useTranslation();

  const UPLOAD_EVENT = "upload";
  const DELETE_EVENT = "delete";
  const REFRESH_EVENT = "refresh";

  const props = defineProps<{ slug: string }>();

  const emit = defineEmits<{
    refresh: [image: string];
    upload: [fileObject: File];
    delete: [];
  }>();

  const { i18n } = useTranslation();
  const api = useUserApi();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState(false);
  const [dialogDeleteImage, setDialogDeleteImage] = useState(false);

  function uploadImage(fileObject: File) {
    emit(UPLOAD_EVENT, fileObject);
    setMenu(false);
  }

  async function deleteImage() {
    setLoading(true);
    const { error } = await api.recipes.deleteImage(props.slug);
    setLoading(false);

    if (error) {
      alertUnreportedError(error, i18n.t("events.something-went-wrong"));
      return;
    }

    emit(DELETE_EVENT);
    setMenu(false);
  }

  async function getImageFromURL() {
    setLoading(true);
    const { data, error } = await api.recipes.updateImagebyURL(props.slug, url);
    setLoading(false);

    if (error) {
      alertUnreportedError(error, i18n.t("events.something-went-wrong"));
      return;
    }

    if (data?.image) {
      emit(REFRESH_EVENT, data.image);
    }
    setMenu(false);
  }

  const messages = useMemo(() => props.slug ? [""] : [i18n.t("recipe.save-recipe-before-use")],, []); // WF4-REVIEW: dependency array

  return (
    <>
  <div className="text-center">
    <BaseDialog value={dialogDeleteImage} onChange={setDialogDeleteImage} bottom-sheet title={t('recipe.delete-image')} icon={icons.alertCircle} color="error" can-delete onDelete={deleteImage}>
      <CardContent>
        {t("recipe.delete-image-confirmation")}
      </CardContent>
    </BaseDialog>
    {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
    <VMenu value={menu} onChange={setMenu} offset-y top nudge-top="6" close-on-content-click={false}>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-btn> */}
        <Button color="accent" {...(activatorProps)}>
          {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
          <MdiIcon name={icons.fileImage} />
          {t("general.image")}
        </Button>
      </>
      <Card width="400">
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="headline flex-wrap mb-0">
          <div>
            {t("recipe.recipe-image")}
          </div>
          <div className="d-flex gap-2">
            <AppButtonUpload url="none" file-name="image" text-btn={false} post={false} onUploaded={uploadImage} />
            <BaseButton className="ml-2" delete onClick={() => setDialogDeleteImage(true)} />
          </div>
        </CardHeader>
        <CardContent className="mt-n5">
          <div>
            {/* WF4-REVIEW: rules/error-messages → error+helperText */}
            <TextField value={url} onChange={setUrl} label={t('general.url')} className="pt-5" clearable messages={messages}>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                <Button className="ml-2" color="primary" loading={loading} disabled={!slug} onClick={getImageFromURL}>
                  {t("general.get")}
                </Button>
              </>
            </TextField>
          </div>
        </CardContent>
      </Card>
    </VMenu>
  </div>
    </>
  );
}
