import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, CardContent, Divider, TextField, form } from "@mui/material";
import { icons } from "@/lib/icons";
import { useAIProviders } from "@/composables/use-ai-providers";
import { validators } from "@/composables/use-validators";
import type { AIProviderCreate, AIProviderTestResult, AIProviderUpdate } from "@/lib/api/types/group";

export default function GroupAIProviderDialog({ providerId = undefined }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<?>) */

  const emit = defineEmits<{
    (e: "create", data: AIProviderCreate): void;
    (e: "update", id: string, data: AIProviderUpdate): void;
  }>();

  const dialog = defineModel<boolean>({ default: false });

  // icons imported directly (was $globals)
  const { i18n } = useTranslation();
  const { loading, getOne, testOne, testSavedOne } = useAIProviders();
  const [init, setInit] = useState(false);

  const [form, setForm] = useState(undefined);
  const [advancedPanel, setAdvancedPanel] = useState(undefined);

  const isEdit = useMemo(() => !!providerId, []); // WF4-REVIEW: dependency array

  const defaultForm = () => ({
    name: "",
    model: "",
    apiKey: "",
    baseUrl: "",
    timeout: 300,
    requestHeaders: {} as Record<string, string>,
    requestParams: {} as Record<string, string>,
  });

  const formData = /* WF4-REVIEW [J] */ reactive(defaultForm());

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const submitDisabled = useMemo(() => {
    return !formData.name?.trim() || !formData.model?.trim() || (!isEdit && !formData.apiKey?.trim());
  }, []); // WF4-REVIEW: dependency array

  const connectionMessage = useMemo(() => {
    const result = testResult;
    if (!result) return "";
    if (result.success) return i18n.t("group.ai-provider-settings.test-connection-succeeded");
    return result.message || i18n.t("group.ai-provider-settings.test-connection-failed");
  }, []); // WF4-REVIEW: dependency array

  // Capability info rather than a second pass/fail check - a text-only provider is a valid setup,
  // it just can't be used as the image provider. Appended to the connection message above.
  const imageSupportMessage = useMemo(() => {
    const result = testResult;
    if (!result?.success) return "";
    return result.supportsImages
      ? ` — ${i18n.t("group.ai-provider-settings.supports-images")}`
      : ` — ${i18n.t("group.ai-provider-settings.text-only-provider")}`;
  }, []); // WF4-REVIEW: dependency array

  // Fetch existing provider when editing; reset form for create mode
  let requestToken = 0;

  /* WF4-REVIEW [J] */ watch(
    () => [dialog, providerId] as const,
    async ([open, id]) => {
      // Bump the token even when bailing out below, so a fetch still in flight from a
      // previous provider/dialog state can never apply its (now stale) result afterward.
      const token = ++requestToken;
      if (!open) return;
      setTestResult(null);
      if (!id) {
        // Create mode — just show the empty form
        resetForm();
        setInit(true);
        return;
      }
      setInit(false);
      const { data } = await getOne(id);
      if (token !== requestToken) return;
      setInit(true);
      if (data) {
        formData.name = data.name;
        formData.model = data.model;
        formData.apiKey = "";
        formData.baseUrl = data.baseUrl ?? "";
        formData.timeout = data.timeout ?? 300;
        formData.requestHeaders = { ...(data.requestHeaders ?? {}) };
        formData.requestParams = { ...(data.requestParams ?? {}) };
      }
    },
    { immediate: true },
  );

  function handleSubmit() {
    // Required field guard (button is also disabled, but keep as a safeguard)
    if (!formData.name?.trim() || !formData.model?.trim()) return;
    if (!isEdit && !formData.apiKey?.trim()) return;

    if (isEdit && providerId) {
      const payload: AIProviderUpdate & { apiKey?: string } = {
        name: formData.name,
        model: formData.model,
        baseUrl: formData.baseUrl || null,
        timeout: formData.timeout,
        requestHeaders: Object.keys(formData.requestHeaders).length ? formData.requestHeaders : undefined,
        requestParams: Object.keys(formData.requestParams).length ? formData.requestParams : undefined,
      };
      if (formData.apiKey) {
        payload.apiKey = formData.apiKey;
      }
      emit("update", providerId, payload);
    }
    else {
      const createPayload = {
        name: formData.name,
        model: formData.model,
        apiKey: formData.apiKey,
        baseUrl: formData.baseUrl || null,
        timeout: formData.timeout,
        requestHeaders: Object.keys(formData.requestHeaders).length ? formData.requestHeaders : undefined,
        requestParams: Object.keys(formData.requestParams).length ? formData.requestParams : undefined,
      };
      emit("create", createPayload as AIProviderCreate);
    }
  }

  function resetForm() {
    Object.assign(formData, defaultForm());
    form?.reset();
    setAdvancedPanel(undefined);
    setTestResult(null);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      let data: AIProviderTestResult | null;
      if (isEdit && providerId) {
        // Test the form's CURRENT values, not what's saved in the DB — the user may have just
        // changed the model/base_url. If they left the API key blank (meaning "keep the existing
        // one"), the backend falls back to the saved key since we don't have that value here.
        const overrides: AIProviderUpdate & { apiKey?: string } = {
          name: formData.name,
          model: formData.model,
          baseUrl: formData.baseUrl || null,
          timeout: formData.timeout,
          requestHeaders: Object.keys(formData.requestHeaders).length ? formData.requestHeaders : undefined,
          requestParams: Object.keys(formData.requestParams).length ? formData.requestParams : undefined,
        };
        if (formData.apiKey) {
          overrides.apiKey = formData.apiKey;
        }
        ({ data } = await testSavedOne(providerId, overrides));
      }
      else {
        ({ data } = await testOne({
          name: formData.name,
          model: formData.model,
          apiKey: formData.apiKey,
          baseUrl: formData.baseUrl || null,
          timeout: formData.timeout,
          requestHeaders: Object.keys(formData.requestHeaders).length ? formData.requestHeaders : undefined,
          requestParams: Object.keys(formData.requestParams).length ? formData.requestParams : undefined,
        } as AIProviderCreate));
      }

      setTestResult(data);
    }
    finally {
      setTesting(false);
    }
  }

  return (
    <>
  <BaseDialog value={dialog} onChange={/* WF4-REVIEW: setter */ setDialog} title={isEdit ? t('group.ai-provider-settings.edit-provider') : t('group.ai-provider-settings.create-provider')} icon={icons.robot} loading={loading} can-submit submit-icon={isEdit ? icons.save : icons.createAlt} submit-text={isEdit ? t('general.update') : t('general.create')} submit-disabled={submitDisabled} onSubmit={handleSubmit} onClose={resetForm}>
    {(init) ? (
      <CardContent style="max-height: 70vh; overflow-y: auto;">
        {/* WF4-REVIEW: validation semantics [J] */}
        <form ref="form">
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "formData.name" [J] */}
          <TextField label={t('group.ai-provider-settings.provider-name')} rules={[validators.required]} density="compact" variant="outlined" className="mb-4" />
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "formData.model" [J] */}
          <TextField label={t('group.ai-provider-settings.model')} hint={t('group.ai-provider-settings.model-description')} rules={[validators.required]} density="compact" variant="outlined" className="mb-4" />
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "formData.apiKey" [J] */}
          <TextField label={t('group.ai-provider-settings.api-key')} hint={t(
            isEdit
              ? 'group.ai-provider-settings.api-key-description-edit'
              : 'group.ai-provider-settings.api-key-description-create',
          )} persistent-hint={isEdit} rules={isEdit ? [] : [validators.required]} density="compact" variant="outlined" type="password" className="mb-4" />
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "formData.baseUrl" [J] */}
          <TextField label={t('group.ai-provider-settings.base-url')} hint={t('group.ai-provider-settings.base-url-description')} density="compact" variant="outlined" className="mb-4" />
          {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J]; v-model on complex expression "formData.timeout" [J] */}
          <VNumberInput label={t('group.ai-provider-settings.request-timeout-seconds')} type="number" min={0} hide-details density="compact" variant="outlined" className="mb-4" />
          {/* WF4-REVIEW: wrapper — accordion group semantics */}
          <Box value={advancedPanel} onChange={setAdvancedPanel} variant="accordion">
            <Accordion>
              <AccordionSummary className="text-subtitle-2" expand-icon="$expand" collapse-icon="$expand">
                {t('search.advanced')}
              </AccordionSummary>
              <AccordionDetails className="px-0">
                <div className="mb-2 text-subtitle-2">
                  {t('group.ai-provider-settings.request-headers')}
                </div>
                {/* WF4-REVIEW: v-model on complex expression "formData.requestHeaders" [J] */}
                <BaseKeyValueEditor className="mb-4" />
                <Divider className="mb-4" />
                <div className="mb-2 text-subtitle-2">
                  {t('group.ai-provider-settings.request-params')}
                </div>
                {/* WF4-REVIEW: v-model on complex expression "formData.requestParams" [J] */}
                <BaseKeyValueEditor />
              </AccordionDetails>
            </Accordion>
          </Box>
          {(testResult) ? (
            <Alert type={testResult.success ? 'success' : 'error'} density="compact" variant="tonal" className="mt-4">
              {connectionMessage}
              {imageSupportMessage}
            </Alert>
          ) : null}
        </form>
      </CardContent>
    ) : (
      <AppLoader />
    )}
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      <Button variant="text" loading={testing} disabled={submitDisabled || testing} onClick={handleTest}>
        {t('group.ai-provider-settings.test-connection')}
      </Button>
    </>
  </BaseDialog>
    </>
  );
}
