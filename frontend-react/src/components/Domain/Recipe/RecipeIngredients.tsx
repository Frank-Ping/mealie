import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Divider, FormControlLabel, ListItem, ListItemText } from "@mui/material";
import RecipeIngredientListItem from "./RecipeIngredientListItem";
import { useSessionStorage } from "@vueuse/core";
import { useIngredientTextParser } from "@/composables/recipes";
import type { RecipeIngredient } from "@/lib/api/types/recipe";

interface Props {
  value?: RecipeIngredient[];
  scale?: number;
  isCookMode?: boolean;
  storageKey?: string;
}

export default function RecipeIngredients({ value = [], scale = 1, isCookMode = false, storageKey = undefined }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const { parseIngredientText } = useIngredientTextParser();

  function validateTitle(title?: string | null) {
    return !(title === undefined || title === "" || title === null);
  }

  const [transientChecked, setTransientChecked] = useState({});
  const sessionChecked = storageKey
    ? useSessionStorage<Record<string, boolean>>(storageKey, {})
    : null;
  const showTitleEditor = useMemo(() => map(x => validateTitle(x.title)), []); // WF4-REVIEW: dependency array

  const ingredientCopyText = useMemo(() => {
    const components: string[] = [];
    forEach((ingredient) => {
      if (ingredient.title) {
        if (components.length) {
          components.push("");
        }

        components.push(`[${ingredient.title}]`);
      }

      components.push(parseIngredientText(ingredient, scale, false));
    });

    return components.join("\n");
  }, []); // WF4-REVIEW: dependency array

  function toggleChecked(index: number) {
    setChecked(index, !isChecked(index));
  }

  function checkedState() {
    return sessionChecked? ?? transientChecked;
  }

  function checkedKey(index: number) {
    const referenceId = value[index]?.referenceId;
    return referenceId ? `ref:${referenceId}` : `idx:${index}`;
  }

  function isChecked(index: number) {
    return !!checkedState()[checkedKey(index)];
  }

  function setChecked(index: number, value: boolean) {
    const state = checkedState();
    state[checkedKey(index)] = value;

    if (sessionChecked) {
      sessionChecked = { ...state };
    }
    else {
      setTransientChecked({ ...state });
    }
  }

  return (
    <>
  {(value && value.length > 0) ? (
    <div>
      {(!isCookMode) ? (
        <div className="d-flex justify-start">
          <h2 className="mt-1 text-h5 font-weight-medium opacity-80">
            {t("recipe.ingredients")}
          </h2>
          <AppButtonCopy btn-class="ml-auto" copy-text={ingredientCopyText} />
        </div>
      ) : null}
      <div>
        {value.map((ingredient, index) => (
          <div key={'ingredient' + index}>
            {(showTitleEditor[index]) ? (
              <h3 className="mt-4 mb-0">
                {ingredient.title}
              </h3>
            ) : null}
            {(showTitleEditor[index]) ? (
              <Divider className="my-2" />
            ) : null}
            {/* WF4-REVIEW: @click → ListItemButton */}
            <ListItem density="compact" className="px-0 py-1 ingredient-list-item" onClick={(e) => { e.stopPropagation(); toggleChecked(index); }}>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
                <FormControlLabel model-value={isChecked(index)} hide-details className="pt-0 mt-0" color="secondary" density="comfortable" onClick={(e) => { e.stopPropagation(); ; }} onUpdateModelValue={setChecked(index, !!$event)} />
              </>
              {/* WF4-REVIEW: content → primary prop */}
              <ListItemText>
                <RecipeIngredientListItem ingredient={ingredient} scale={scale} show-substitutions />
              </ListItemText>
            </ListItem>
          </div>
        ))}
      </div>
    </div>
  ) : null}
    </>
  );
}
