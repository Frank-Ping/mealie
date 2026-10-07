import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, form } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useUserApi } from "@/composables/api";

interface Props {
  small?: boolean;
  post?: boolean;
  url?: string;
  text?: string;
  icon?: string;
  fileName?: string;
  textBtn?: boolean;
  accept?: string;
  color?: string;
  disabled?: boolean;
  multiple?: boolean;
}

export default function AppButtonUpload({ small = false, post = true, url = "", text = "", icon = null, fileName = "archive", textBtn = true, accept = "", color = "info", disabled = false, multiple = false }: Props) {
  const { t } = useTranslation();

  const UPLOAD_EVENT = "uploaded";

  const props = /* props via generated interface + destructured signature */

  const emit = defineEmits<{
    (e: "uploaded", payload: File | File[] | unknown | null): void;
  }>();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploader, setUploader] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const { i18n } = useTranslation();
  // icons imported directly (was $globals)
  const effIcon = icon ? icon : icons.upload;

  const defaultText = i18n.t("general.upload");

  const api = useUserApi();
  async function upload() {
    if (selectedFiles.length === 0) {
      return;
    }

    setIsSelecting(true);

    if (!post) {
      emit(UPLOAD_EVENT, multiple ? selectedFiles : selectedFiles[0]);
      setIsSelecting(false);
      return;
    }

    if (multiple && selectedFiles.length > 1) {
      console.warn("Multiple file uploads are not supported by the API.");
      return;
    }

    const file = selectedFiles[0];
    const formData = new FormData();
    formData.append(fileName, file);

    try {
      const response = await api.upload.file(url, formData);
      if (response) {
        emit(UPLOAD_EVENT, response);
      }
    }
    catch (e) {
      console.error(e);
      emit(UPLOAD_EVENT, null);
    }

    setIsSelecting(false);
  }

  function onFileChanged(e: Event) {
    const target = e.target as HTMLInputElement;

    if (target.files !== null && target.files.length > 0) {
      setSelectedFiles(Array.from(target.files));
      upload();
    }
  }

  function onButtonClick() {
    setIsSelecting(true);
    window.addEventListener(
      "focus",
      () => {
        setIsSelecting(false);
      },
      { once: true },
    );
    uploader?.click();
  }

  return (
    <>
  {/* WF4-REVIEW: validation semantics [J] */}
  <form ref="form">
    <input ref="uploader" className="d-none" type="file" accept={accept} multiple={multiple} onChange={onFileChanged} />
    <slot {...({ isSelecting, onButtonClick })}>
      <Button loading={isSelecting} small={small} color={color} variant={textBtn ? 'text' : 'elevated'} disabled={disabled} onClick={onButtonClick}>
        {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
        <MdiIcon name={effIcon} />
        {text ? text : defaultText}
      </Button>
    </slot>
  </form>
    </>
  );
}
