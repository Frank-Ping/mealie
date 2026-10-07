import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, CardHeader, Divider } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import RecipeSettingsSwitches from "./RecipeSettingsSwitches";

export default function RecipeSettingsMenu() {
  const { t } = useTranslation();

  const value = defineModel<object>({ required: true });

  defineProps<{ isOwner?: boolean }>();

  return (
    <>
  <div className="text-center">
    {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
    <VMenu offset-y top nudge-top="6" close-on-content-click={false}>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-btn> */}
        <Button color="accent" {...(props)}>
          {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
          <MdiIcon name={icons.cog} />
          {t("general.settings")}
        </Button>
      </>
      <Card>
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="py-2">
          <div>
            {t("recipe.recipe-settings")}
          </div>
        </CardHeader>
        <Divider className="mx-2" />
        <CardContent className="mt-n5 pt-6 pb-2">
          <RecipeSettingsSwitches value={value} onChange={/* WF4-REVIEW: setter */ setValue} is-owner={isOwner} />
        </CardContent>
      </Card>
    </VMenu>
  </div>
    </>
  );
}
