import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Tooltip } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { useClipboard } from "@vueuse/core";

interface Props {
  copyText: string;
  color?: string;
  icon?: boolean;
  btnClass?: string;
}

export default function AppButtonCopy({ copyText, color = "", icon = true, btnClass = "" }: Props) {
  const { t } = useTranslation();

  const props = /* props via generated interface + destructured signature */

  const { copy, copied, isSupported } = useClipboard({ legacy: true });
  const [show, setShow] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(null);

  async function textToClipboard() {
    if (isSupported) {
      await copy(copyText);
      if (copied) {
        setCopiedSuccess(true);
        console.info(`Copied\n${copyText}`);
      }
      else {
        setCopiedSuccess(false);
        console.error("Copy failed: ", copied);
      }
    }
    else {
      console.warn("Clipboard is currently not supported by your browser. Ensure you're on a secure (https) site.");
    }

    setShow(true);
    setTimeout(() => {
      setShow(false);
    }, 3000);
  }

  return (
    <>
  {/* WF4-REVIEW: activator slot variants [J] */}
  <Tooltip ref="copyToolTip" value={show} onChange={setShow} location="top" open-on-hover={false} open-on-click={true} close-delay="500" transition="slide-y-transition">
    <template>
      <Button variant="flat" icon={icon} color={color} retain-focus-on-click className={btnClass} disabled={copyText !== '' ? false : true} {...(hoverProps)} onClick={textToClipboard()}>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={$globals.icons.contentCopy} />
        {icon ? "" : t("general.copy")}
      </Button>
    </template>
    {(!isSupported || copiedSuccess !== null) ? (
      <span>
        {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
        <MdiIcon name={$globals.icons.clipboardCheck} />
        {(!isSupported) ? (
          <slot>
            {t("general.your-browser-does-not-support-clipboard")}
          </slot>
        ) : (
          <slot>
            {copiedSuccess ? t("general.copied_message") : t("general.clipboard-copy-failure")}
          </slot>
        )}
      </span>
    ) : null}
  </Tooltip>
    </>
  );
}
