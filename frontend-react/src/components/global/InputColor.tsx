import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, TextField } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";

export default function InputColor() {
  const { t } = useTranslation();

  const modelValue = defineModel({
    type: String,
    required: true,
  });

  const [menu, setMenu] = useState(false);

  function getRandomHex() {
    return "#000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });
  }

  function setRandomHex() {
    modelValue = getRandomHex();
  }

  return (
    <>
  {/* WF4-REVIEW: rules/error-messages → error+helperText */}
  <TextField value={modelValue} onChange={/* WF4-REVIEW: setter */ setModelValue} label={t('general.color')}>
    <template>
      <Button className="elevation-0" size="small" height="30px" width="30px" color={modelValue || 'grey'} onClick={setRandomHex}>
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={$globals.icons.refreshCircle} color="white" />
      </Button>
    </template>
    <template>
      {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
      <VMenu value={menu} onChange={setMenu} start nudge-left="30" nudge-top="20" close-on-content-click={false}>
        <template>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={$globals.icons.formatColorFill} {...(props)} />
        </template>
        <Card>
          <CardContent className="pa-0">
            {/* WF4-REVIEW: unmapped <v-color-picker> — judgement component, convert manually [J] */}
            <VColorPicker value={modelValue} onChange={/* WF4-REVIEW: setter */ setModelValue} flat hide-inputs show-swatches swatches-max-height="200" />
          </CardContent>
        </Card>
      </VMenu>
    </template>
  </TextField>
    </>
  );
}
