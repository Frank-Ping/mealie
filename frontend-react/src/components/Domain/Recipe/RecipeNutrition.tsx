import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, Divider, List, ListItem, ListItemText } from "@mui/material";
import { parseNutritionValue, useNutritionLabels } from "@/composables/recipes";
import type { Nutrition } from "@/lib/api/types/recipe";
import type { NutritionLabelType } from "@/composables/recipes/use-recipe-nutrition";

interface Props {
  edit?: boolean;
}

export default function RecipeNutrition({ edit = true }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const modelValue = defineModel<Nutrition>({ required: true });

  const { labels } = useNutritionLabels();
  const valueNotNull = useMemo(() => {
    let key: keyof Nutrition;
    for (key in modelValue) {
      if (modelValue.value[key] !== null) {
        return true;
      }
    }
    return false;
  }, []); // WF4-REVIEW: dependency array

  const showViewer = useMemo(() => !edit && valueNotNull, []); // WF4-REVIEW: dependency array

  function updateValue(key: number | string, value: number | null) {
    modelValue = { ...modelValue, [key]: value?.toString() ?? null };
  }

  // Build a new list that only contains nutritional information that has a value
  const renderedList = useMemo(() => {
    return Object.entries(labels).reduce((item: NutritionLabelType, [key, label]) => {
      if (modelValue.value[key]?.trim()) {
        item[key] = {
          ...label,
          value: modelValue.value[key],
        };
      }
      return item;
    }, {});
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  {(valueNotNull || edit) ? (
    <div>
      <Card className="mt-2">
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="pt-2 pb-0">
          {t("recipe.nutrition")}
        </CardHeader>
        <Divider className="mx-2 my-1" />
        {(edit) ? (
          <CardContent>
            {modelValue.map((item, key, index) => (
              <div key={index}>
                {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */}
                <VNumberInput model-value={parseNutritionValue(modelValue[key])} label={labels[key].label} suffix={labels[key].suffix} density="compact" autocomplete="off" variant="underlined" inset precision={null} min={0} onUpdateModelValue={updateValue(key, $event)} />
              </div>
            ))}
          </CardContent>
        ) : null}
        {(showViewer) ? (
          <List density="compact" className="mt-0 pt-0">
            {renderedList.map((item, key, index) => (
              /* WF4-REVIEW: @click → ListItemButton */
              <ListItem key={index} style="min-height: 25px">
                {/* WF4-REVIEW: content → primary prop */}
                <ListItemText className="pl-2 d-flex">
                  <div>
                    {item.label}
                  </div>
                  <div className="ml-auto mr-1">
                    {item}
                  </div>
                  <div>
                    {item.suffix}
                  </div>
                </ListItemText>
              </ListItem>
            ))}
          </List>
        ) : null}
      </Card>
    </div>
  ) : null}
    </>
  );
}
