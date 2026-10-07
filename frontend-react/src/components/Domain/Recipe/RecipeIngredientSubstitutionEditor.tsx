import { useTranslation } from "react-i18next";
import { Autocomplete, Button, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { normalizeFilter } from "@/composables/use-utils";
import type { IngredientFood } from "@/lib/api/types/recipe";

interface Props {
  substitutions: EditableSubstitution[];
  foods: IngredientFood[];
  // left unset inside a dialog, so the menu stays in Vuetify's overlay stack rather than being
  // teleported to the body and risking a render behind the dialog
  menuAttachTarget?: string;
}

export interface EditableSubstitution {
  substituteFoodId?: string | null;
  note?: string | null;
}

export default function RecipeIngredientSubstitutionEditor({ substitutions, foods, menuAttachTarget }: Props) {
  const { t } = useTranslation();

  /**
   * The shape both tiers share. Callers hold richer rows of their own -- the food dialog tracks a
   * reverse-substitution choice alongside each one -- so rows are mutated in place here and added
   * or removed by the caller, which is the only side that knows what a new row should contain.
   */




  /* props via destructured signature */

  const emit = defineEmits<{
    "add": [];
    "delete": [index: number];
    "food-changed": [index: number];
  }>();

  return (
    <>
  <div>
    {/* WF4-REVIEW: unparseable v-for "substitution, i in substitutions" */}
      <div key={i} className="mb-2">
        <div className="d-flex ga-2 align-center flex-wrap">
          {/* WF4-REVIEW: items → options/getOptionLabel; value wiring [S]; v-model on complex expression "substitution.substituteFoodId" [J] */}
          <Autocomplete items={foods} custom-filter={normalizeFilter} item-value="id" item-title="name" placeholder={t('recipe.choose-substitute-food')} style={$vuetify.display.mdAndDown ? 'flex: 1 1 100%;' : 'flex: 6 0 50px;'} menu-props={{ attach: menuAttachTarget, maxHeight: '250px' }} density="compact" variant="filled" clearable hide-details onUpdateModelValue={emit('food-changed', i)} />
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "substitution.note" [J] */}
          <TextField placeholder={t('recipe.note')} style={$vuetify.display.mdAndDown ? 'flex: 1 1 0;' : 'flex: 4 0 50px;'} density="compact" variant="filled" hide-details />
          <Button icon variant="plain" title={t('general.delete')} onClick={emit('delete', i)}>
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={icons.delete} />
          </Button>
        </div>
        <slot name="after-row" substitution={substitution} index={i} />
      </div>
    <Button variant="text" color="primary" onClick={emit('add')}>
      {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
      <MdiIcon name={icons.create} />
      {t("general.add")}
    </Button>
  </div>
    </>
  );
}
