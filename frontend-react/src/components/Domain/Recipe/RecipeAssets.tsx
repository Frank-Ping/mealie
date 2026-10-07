import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Avatar, Box, Button, Card, CardContent, CardHeader, Divider, List, ListItem, ListItemText, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useStaticRoutes, useUserApi } from "@/composables/api";
import { alert } from "@/composables/use-toast";
import type { RecipeAsset } from "@/lib/api/types/recipe";
import { useCopy } from "@/composables/use-copy";

interface Props {
  slug: string;
  recipeId: string;
  edit?: boolean;
}

export default function RecipeAssets({ slug, recipeId, edit = true }: Props) {
  const { t } = useTranslation();

  const props = /* props via generated interface + destructured signature */

  const model = defineModel<RecipeAsset[]>({ required: true });

  const api = useUserApi();

  const state = /* WF4-REVIEW [J] */ reactive({
    newAssetDialog: false,
    fileObject: {} as File,
    newAsset: {
      name: "",
      icon: "mdi-file",
    },
  });

  const { i18n } = useTranslation();
  // icons imported directly (was $globals)
  const { copyText } = useCopy();

  const iconOptions = [
    {
      name: "mdi-file",
      title: i18n.t("asset.file"),
      icon: icons.file,
    },
    {
      name: "mdi-file-pdf-box",
      title: i18n.t("asset.pdf"),
      icon: icons.filePDF,
    },
    {
      name: "mdi-file-image",
      title: i18n.t("asset.image"),
      icon: icons.fileImage,
    },
    {
      name: "mdi-code-json",
      title: i18n.t("asset.code"),
      icon: icons.codeJson,
    },
    {
      name: "mdi-silverware-fork-knife",
      title: i18n.t("asset.recipe"),
      icon: icons.primary,
    },
  ];

  const serverBase = useRequestURL().origin;

  function getIconDefinition(icon: string) {
    return iconOptions.find(item => item.name === icon) || iconOptions[0];
  }

  function isImage(fileName?: string | null) {
    if (!fileName) return false;
    return /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(fileName);
  }

  const lightbox = /* WF4-REVIEW [J] */ reactive({
    open: false,
    imageUrl: undefined as string | undefined,
    imageAlt: undefined as string | undefined,
  });

  function openLightbox(item: RecipeAsset) {
    lightbox.imageUrl = assetURL(item.fileName ?? "");
    lightbox.imageAlt = item.name;
    lightbox.open = true;
  }

  function handleViewClick(event: Event, item: RecipeAsset) {
    if (!isImage(item.fileName)) {
      return;
    }

    event.preventDefault();
    openLightbox(item);
  }

  // The row itself only opens the lightbox outside edit mode; the menu's view action
  // (which exists only while editing) goes straight to handleViewClick.
  function handleRowClick(event: Event, item: RecipeAsset) {
    if (edit) {
      return;
    }

    handleViewClick(event, item);
  }

  const { recipeAssetPath } = useStaticRoutes();
  function assetURL(assetName: string) {
    return recipeAssetPath(recipeId, assetName);
  }

  function assetEmbed(name: string) {
    return `<img src="${serverBase}${assetURL(name)}" height="100%" width="100%" />`;
  }

  function setFileObject(fileObject: File) {
    state.fileObject = fileObject;
    // If the user didn't provide a name, default to the file base name
    if (!state.newAsset.name?.trim()) {
      state.newAsset.name = fileObject.name.substring(0, fileObject.name.lastIndexOf("."));
    }
  }

  function validFields() {
    // Only require a file; name will fall back to the file name if empty
    return Boolean(state.fileObject?.name);
  }

  async function addAsset() {
    if (!validFields()) {
      alert.error(i18n.t("asset.error-submitting-form") as string);
      return;
    }

    const nameToUse = state.newAsset.name?.trim() || state.fileObject.name;

    const { data } = await api.recipes.createAsset(slug, {
      name: nameToUse,
      icon: state.newAsset.icon,
      file: state.fileObject,
      extension: state.fileObject.name.split(".").pop() || "",
    });
    if (data) {
      model = [...model, data];
    }
    state.newAsset = { name: "", icon: "mdi-file" };
    state.fileObject = {} as File;
  }

  return (
    <>
  {(model.length > 0 || edit) ? (
    <div>
      <Card className="mt-4">
        {/* WF4-REVIEW: @click → ListItemButton */}
        <ListItem className="pr-2 pl-0">
          {/* WF4-REVIEW: title text moves to the title prop */}
          <CardHeader>
            {t("asset.assets")}
          </CardHeader>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {(edit) ? (
              <Button variant="plain" icon={icons.create} onClick={state.newAssetDialog = true} />
            ) : null}
          </>
        </ListItem>
        <Divider className="mx-2" />
        {(model.length > 0) ? (
          <List lines="two" flat={!edit}>
            {model.map((item, i) => (
              /* WF4-REVIEW: @click → ListItemButton */
              <ListItem key={i} to={!edit && !isImage(item.fileName) ? assetURL(item.fileName ?? '') : undefined} target={!edit && !isImage(item.fileName) ? '_blank' : undefined} className="pr-2" onClick={handleRowClick($event, item)}>
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  <Avatar size="48" rounded="lg" className="elevation-1">
                    {(isImage(item.fileName)) ? (
                      /* WF4-REVIEW: cover → objectFit */
                      <Box component="img" src={assetURL(item.fileName ?? '')} alt={item.name} loading="lazy" cover />
                    ) : (
                      /* WF4-REVIEW: icon name resolves via lib/icons */
                      <MdiIcon name={getIconDefinition(item.icon).icon} size="large" />
                    )}
                  </Avatar>
                </>
                {/* WF4-REVIEW: content → primary prop */}
                <ListItemText>
                  {item.name}
                </ListItemText>
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {(edit) ? (
                    /* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */
                    <VMenu location="bottom end">
                      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                      <>
                        <Button {...(menuProps)} icon variant="plain">
                          {/* WF4-REVIEW: icon name resolves via lib/icons */}
                          <MdiIcon icon={icons.dotsVertical} />
                        </Button>
                      </>
                      <List density="compact" min-width="220">
                        {/* WF4-REVIEW: @click → ListItemButton */}
                        <ListItem to={!isImage(item.fileName) ? assetURL(item.fileName ?? '') : undefined} target={!isImage(item.fileName) ? '_blank' : undefined} prepend-icon={icons.eye} title={t('general.view')} onClick={handleViewClick($event, item)} />
                        {/* WF4-REVIEW: @click → ListItemButton */}
                        <ListItem to={assetURL(item.fileName ?? '')} prepend-icon={icons.download} title={t('general.download')} download onClick={(e) => { e.stopPropagation(); ; }} />
                        {(edit) ? (
                          /* WF4-REVIEW: @click → ListItemButton */
                          <ListItem prepend-icon={icons.contentCopy} title={t('general.copy')} onClick={copyText(assetEmbed(item.fileName ?? ''))} />
                        ) : null}
                        {(edit) ? (
                          /* WF4-REVIEW: @click → ListItemButton */
                          <ListItem prepend-icon={icons.delete} title={t('general.delete')} onClick={model.splice(i, 1)} />
                        ) : null}
                      </List>
                    </VMenu>
                  ) : null}
                  {(!edit) ? (
                    <Button icon variant="plain" to={assetURL(item.fileName ?? '')} download onClick={(e) => { e.stopPropagation(); ; }}>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={icons.download} />
                    </Button>
                  ) : null}
                </>
              </ListItem>
            ))}
          </List>
        ) : null}
      </Card>
      {(lightbox.open) ? (
        /* WF4-REVIEW: v-model on complex expression "lightbox.open" [J] */
        <RecipeImageLightbox image-url={lightbox.imageUrl} image-alt={lightbox.imageAlt} />
      ) : null}
      <div className="d-flex ml-auto mt-2">
        <Box sx={{ flexGrow: 1 }} />
        {/* WF4-REVIEW: v-model on complex expression "state.newAssetDialog" [J] */}
        <BaseDialog title={t('asset.new-asset')} icon={getIconDefinition(state.newAsset.icon).icon} can-submit onSubmit={addAsset}>
          <CardContent className="pt-4">
            {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "state.newAsset.name" [J] */}
            <TextField label={t('general.name')} />
            <div className="d-flex justify-space-between">
              {/* WF4-REVIEW: items/item-title/item-value → MenuItem children; v-model on complex expression "state.newAsset.icon" [J] */}
              <TextField select density="compact" prepend-icon={getIconDefinition(state.newAsset.icon).icon} items={iconOptions} item-title="title" item-value="name" className="mr-2">
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  {/* WF4-REVIEW: @click → ListItemButton */}
                  <ListItem {...(itemProps)}>
                    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                    <>
                      <Avatar>
                        {/* WF4-REVIEW: icon name resolves via lib/icons */}
                        <MdiIcon name={item.icon} />
                      </Avatar>
                    </>
                  </ListItem>
                </>
              </TextField>
              <AppButtonUpload post={false} file-name="file" text-btn={false} onUploaded={setFileObject} />
            </div>
          </CardContent>
        </BaseDialog>
      </div>
    </div>
  ) : null}
    </>
  );
}
