import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, CardActions, CardContent, CardHeader, Container, Divider, Grid, TextField, form } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useAdminApi } from "@/composables/api";
import { useGroups } from "@/composables/use-groups";
import { alert } from "@/composables/use-toast";
import type { AIProviderSummary } from "@/lib/api/types/group";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

export default function Openai() {
  const { t } = useTranslation();

  const api = useAdminApi();
  const i18n = useI18n();

  // Set page title
  useSeoMeta({
    title: i18n.t("admin.debug-openai-services"),
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const [uploadedImage, setUploadedImage] = useState(undefined);
  const [uploadedImageName, setUploadedImageName] = useState("");
  const [uploadedImagePreviewUrl, setUploadedImagePreviewUrl] = useState(undefined);

  // Group + provider selection
  const { groups } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupProviders, setGroupProviders] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState(null);

  /* WF4-REVIEW [J] */ watch(selectedGroupId, (id) => {
    setGroupProviders([]);
    setSelectedProviderId(null);
    if (!id) return;
    const group = groups?.find(g => g.id === id);
    setGroupProviders(group?.aiProviderSettings?.providers ?? []);
  });

  function uploadImage(fileObject: unknown) {
    setUploadedImage(fileObject as File);
    setUploadedImageName((fileObject as File).name);
    setUploadedImagePreviewUrl(URL.createObjectURL(fileObject as File));
  }

  function clearImage() {
    setUploadedImage(undefined);
    setUploadedImageName("");
    setUploadedImagePreviewUrl(undefined);
  }

  async function testOpenAI() {
    if (!selectedProviderId) {
      alert.error("Please select a provider");
      return;
    }

    setResponse("");

    setLoading(true);
    const { data } = await api.debug.debugOpenAI(selectedProviderId, uploadedImage);
    setLoading(false);

    if (!data) {
      alert.error("Unable to test OpenAI services");
    }
    else {
      setResponse(data.response || (data.success ? "Test Successful" : "Test Failed"));
    }
  }

  return (
    <>
  <Container className="pa-0">
    <Container>
      <BaseCardSectionTitle title={t('admin.debug-openai-services')}>
        {t('admin.debug-openai-services-description')}
        <br />
        <DocLink className="mt-2" link="/documentation/getting-started/installation/ai-providers" />
      </BaseCardSectionTitle>
    </Container>
    {/* WF4-REVIEW: validation semantics [J] */}
    <form ref="uploadForm" onSubmit={(e) => { e.preventDefault(); testOpenAI; }}>
      <div>
        <CardContent>
          <Container className="pa-0">
            <Grid container>
              {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
              <Grid cols="12" md="6">
                {(groups) ? (
                  /* WF4-REVIEW: items/item-title/item-value → MenuItem children */
                  <TextField select value={selectedGroupId} onChange={setSelectedGroupId} items={groups} item-title="name" item-value="id" label={t('group.group')} density="compact" variant="outlined" clearable hide-details />
                ) : null}
              </Grid>
              {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
              <Grid cols="12" md="6">
                {/* WF4-REVIEW: items/item-title/item-value → MenuItem children */}
                <TextField select value={selectedProviderId} onChange={setSelectedProviderId} items={groupProviders} item-title="name" item-value="id" label={t('group.ai-provider-settings.ai-provider')} density="compact" variant="outlined" clearable hide-details disabled={!selectedGroupId} />
              </Grid>
            </Grid>
            <Grid container>
              {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
              <Grid cols="auto" align-self="center">
                {(!uploadedImage) ? (
                  <AppButtonUpload className="ml-auto" url="none" file-name="image" accept="image/*" text={t('recipe.upload-image')} text-btn={false} post={false} onUploaded={uploadImage} />
                ) : null}
                {(!!uploadedImage) ? (
                  <Button color="error" onClick={clearImage}>
                    {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                    <MdiIcon name={$globals.icons.close} />
                    {t("recipe.remove-image")}
                  </Button>
                ) : null}
              </Grid>
              <Box sx={ flexGrow: 1 } />
            </Grid>
            {(uploadedImage && uploadedImagePreviewUrl) ? (
              <Grid container style="max-width: 25%;">
                <Box sx={ flexGrow: 1 } />
                {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
                <Grid cols="12">
                  {/* WF4-REVIEW: cover → objectFit */}
                  <Box component="img" src={uploadedImagePreviewUrl} />
                </Grid>
                <Box sx={ flexGrow: 1 } />
              </Grid>
            ) : null}
          </Container>
        </CardContent>
        <CardActions>
          <BaseButton type="submit" disabled={!selectedProviderId} text={t('admin.run-test')} icon={$globals.icons.check} loading={loading} className="ml-auto" />
        </CardActions>
      </div>
    </form>
    {(response) ? (
      <Divider className="mt-4" />
    ) : null}
    {(response) ? (
      <Container className="ma-0 pa-0">
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader>
          {t('admin.test-results')}
        </CardHeader>
        <CardContent>
          {response}
        </CardContent>
      </Container>
    ) : null}
  </Container>
    </>
  );
}
