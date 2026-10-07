import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Grid } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";

export default function RecipeImportImages() {
  const { t } = useTranslation();

  withDefaults(defineProps<{
    disabled?: boolean;
  }>(), {
    disabled: false,
  });

  const images = defineModel<(Blob | File)[]>({ default: () => [] });

  const [previewUrls, setPreviewUrls] = useState([]);

  function uploadImages(files: File[]) {
    images = [...images, ...files];
    setPreviewUrls([...previewUrls, ...files.map(file => URL.createObjectURL(file))]);
  }

  function clearImage(index: number) {
    // Revoke _before_ splicing
    URL.revokeObjectURL(previewUrls[index]);

    images.splice(index, 1);
    previewUrls.splice(index, 1);
  }

  function updateImage(index: number, croppedImage: Blob) {
    images.value[index] = croppedImage;
    previewUrls[index] = URL.createObjectURL(croppedImage);
  }

  function swapItem(array: any[], i: number, j: number) {
    if (i < 0 || j < 0 || i >= array.length || j >= array.length) {
      return;
    }

    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  // Put the intended cover image at the start of the array.
  // The backend uses the first image as the cover image.
  function setCoverImage(index: number) {
    if (index < 0 || index >= images.length || index === 0) {
      return;
    }

    swapItem(images, 0, index);
    swapItem(previewUrls, 0, index);
  }

  onBeforeUnmount(() => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
  });

  return (
    <>
  <div>
    <AppButtonUpload className="ml-auto" url="none" file-name="images" accept="image/*" text={images.length ? t('recipe.upload-more-images') : t('recipe.upload-images')} text-btn={false} post={false} multiple={true} disabled={disabled} onUploaded={uploadImages} />
    {(images.length) ? (
      <div className="mt-3">
        <p className="my-2">
          {t("recipe.crop-and-rotate-the-image")}
        </p>
        <Grid container>
          {previewUrls.map((imageUrl, index) => (
            /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
            <Grid key={index} cols="12" sm="6" lg="4" xl="3">
              {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
              <Grid>
                <ImageCropper img={imageUrl} cropper-width="100%" submitted={disabled} className="mt-4 mb-2" onSave={(croppedImage: Blob) => updateImage(index, croppedImage)} onDelete={clearImage(index)} />
                {(images.length > 1) ? (
                  <Button disabled={disabled || index === 0} color="primary" onClick={() => setCoverImage(index)}>
                    {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                    <MdiIcon name={index === 0 ? $globals.icons.check : $globals.icons.fileImage} />
                    {index === 0 ? t("recipe.cover-image") : t("recipe.set-as-cover-image")}
                  </Button>
                ) : null}
              </Grid>
            </Grid>
          ))}
        </Grid>
      </div>
    ) : null}
  </div>
    </>
  );
}
