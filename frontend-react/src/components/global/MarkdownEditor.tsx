import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TextField } from "@mui/material";

interface Props {
  label?: string;
  preview?: boolean;
  displayPreview?: boolean;
}

export default function MarkdownEditor({ label = "", preview = undefined, displayPreview = true }: Props) {
  const { t } = useTranslation();

  const props = /* props via generated interface + destructured signature */,
    },
  });

  const emit = defineEmits<{
    (e: "input:preview", value: boolean): void;
  }>();

  const modelValue = defineModel<string>("modelValue");

  const [fallbackPreview, setFallbackPreview] = useState(false);
  /* WF4-REVIEW [J]: writable computed — split into state + handlers */ const previewState = computed({
    get: () => preview ?? fallbackPreview,
    set: (val: boolean) => {
      if (preview) {
        emit("input:preview", val);
      }
      else {
        setFallbackPreview(val);
      }
    },
  });

  return (
    <>
  <div>
    {(displayPreview) ? (
      <div className="d-flex justify-end">
        <BaseButtonGroup buttons={[
          {
            icon: previewState ? $globals.icons.edit : $globals.icons.eye,
            text: previewState ? t('general.edit') : t('markdown-editor.preview-markdown-button-label'),
            event: 'toggle',
          },
        ]} onToggle={previewState = !previewState} />
      </div>
    ) : null}
    {(!previewState) ? (
      <TextField multiline {...(textarea)} value={modelValue} onChange={/* WF4-REVIEW: setter */ setModelValue} className={label == '' ? '' : 'mt-5'} label={label} auto-grow density="compact" rows="4" variant="underlined" />
    ) : (
      <SafeMarkdown source={modelValue} />
    )}
  </div>
    </>
  );
}
