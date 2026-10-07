import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, List, ListItem, ListItemText, Tooltip } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { canConvertIngredient, useUnitSystem } from "@/composables/recipes";
import type { UnitSystem } from "@/composables/recipes/unit-systems";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import type { Recipe } from "@/lib/api/types/recipe";

export default function RecipeUnitSystemButton() {
  const { t } = useTranslation();

  const props = defineProps<{ recipe: NoUndefinedField<Recipe> }>();

  const { i18n } = useTranslation();
  const { unitSystem } = useUnitSystem();

  /**
   * Readers call US customary "imperial", so that's what the labels say. The stored value stays
   * `us`, which is what the units actually are, and leaves `imperial` free should a genuine
   * imperial ladder ever be added.
   */
  const options = useMemo(() => [
    { key: "as-written", value: null, text: i18n.t("recipe.unit-system.as-written") },
    { key: "metric", value: "metric", text: i18n.t("recipe.unit-system.metric-with-hint") },
    { key: "us", value: "us", text: i18n.t("recipe.unit-system.imperial-with-hint") },
  ], []); // WF4-REVIEW: dependency array

  const activeLabel = useMemo(() => {
    switch (unitSystem) {
      case "metric":
        return i18n.t("recipe.unit-system.metric");
      case "us":
        return i18n.t("recipe.unit-system.imperial");
      default:
        return i18n.t("recipe.unit-system.as-written");
    }
  }, []); // WF4-REVIEW: dependency array

  // Disabled when nothing on the recipe carries the standardization data conversion needs, so the
  // control stays in place — the reader can see units are a thing here — but never does nothing
  // when used.
  const hasConvertibleIngredients = useMemo(() => props.recipe.recipeIngredient.some(canConvertIngredient),, []); // WF4-REVIEW: dependency array

  return (
    <>
  {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
  <VMenu disabled={!hasConvertibleIngredients} offset-y top nudge-top="6">
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      {/* WF4-REVIEW: activator slot variants [J] */}
      <Tooltip size="small" location="top" color="secondary-darken-1">
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-card> */}
          <Card className="pa-1 px-2" color="secondary-darken-1" size="small" disabled={!hasConvertibleIngredients} {...({ ...activatorProps, ...tooltipProps })}>
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={icons.units} size="small" className="mr-2" />
            <span>
              {activeLabel}
            </span>
          </Card>
        </>
        <span>
          {t("general.units")}
        </span>
      </Tooltip>
    </>
    <List density="compact">
      {options.map(option => (
        /* WF4-REVIEW: @click → ListItemButton; assignment handler "unitSystem = option" — target not a tracked ref [J] */
        <ListItem key={option.key} active={option === unitSystem} onClick={unitSystem = option}>
          {/* WF4-REVIEW: content → primary prop */}
          <ListItemText>
            {option.text}
          </ListItemText>
        </ListItem>
      ))}
    </List>
  </VMenu>
    </>
  );
}
