import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import { substitutionFoodName, useFoodPlurality, useIngredientSubstitutions } from "@/composables/recipes";
import type { IngredientFoodSubstitution, RecipeIngredient } from "@/lib/api/types/recipe";

interface Props {
  ingredient: RecipeIngredient;
  scale?: number;
}

interface SubstitutionSection {
  key: string;
  title: string;
  items: IngredientFoodSubstitution[];
  dimmed: boolean;
}

export default function RecipeIngredientSubstitutions({ scale = 1 }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const i18n = useI18n();
  const { recipeSubstitutions, foodSubstitutions, hasSubstitutions } = useIngredientSubstitutions(() => ingredient);

  // a substitute stands in for the food at this line's quantity and unit, so it takes the same
  // plural form the food itself does -- both sections alike, since they sit under the one line
  const { shouldPluralizeFood } = useFoodPlurality();
  const pluralFood = useMemo(() => shouldPluralizeFood(ingredient, scale, []); // WF4-REVIEW: dependency array);



  // what this recipe says comes first and at full strength; what the food suggests everywhere
  // sits behind it, and says so, which is what makes the first heading need no qualifier
  const sections = useMemo(() => [
    {
      key: "recipe",
      title: i18n.t("recipe.substitutions", []); // WF4-REVIEW: dependency array,
      items: recipeSubstitutions,
      dimmed: false,
    },
    {
      key: "food",
      title: i18n.t("recipe.commonly-substituted-with"),
      items: foodSubstitutions,
      dimmed: true,
    },
  ].filter(section => section.items.length));

  return (
    <>
  {(hasSubstitutions) ? (
    /* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */
    <VMenu location="bottom start" max-width="360">
      <template>
        <Button {...(menuProps)} icon variant="plain" aria-label={t('recipe.substitutions')} onClick={(e) => { e.stopPropagation(); ; }}>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={$globals.icons.swapHorizontal} />
        </Button>
      </template>
      <Card className="ingredient-substitutions">
        <CardContent className="py-2 px-3 text-body-2">
          {/* WF4-REVIEW: unparseable v-for "section, sectionIndex in sections" */}
            <div key={section.key} className={[section.dimmed ? 'food-substitutions' : '', sectionIndex ? 'mt-5' : '']}>
              <div className="text-caption font-weight-medium substitution-header">
                {section.title}
              </div>
              {/* WF4-REVIEW: unparseable v-for "substitution, i in section.items" */}
                <div key={i} className="substitution">
                  {(substitution.substituteFood) ? (
                    <template>
                      <span className="substitution-primary">
                        {substitutionFoodName(substitution, pluralFood)}
                      </span>
                      {(substitution.note) ? (
                        <SafeMarkdown className="substitution-note" source={substitution.note} />
                      ) : null}
                    </template>
                  ) : null}
                  <SafeMarkdown className="substitution-primary" source={substitution.note} />
                </div>
            </div>
        </CardContent>
      </Card>
    </VMenu>
  ) : null}
    </>
  );
}
