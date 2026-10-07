import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CardContent, CardHeader, Container, Divider, Grid } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import SafeHtml from "@/components/SafeHtml";
import DOMPurify from "dompurify";
import RecipeTimeCard from "@/components/Domain/Recipe/RecipeTimeCard";
import { useStaticRoutes } from "@/composables/api";
import type { Recipe, RecipeIngredient, RecipeStep } from "@/lib/api/types/recipe";
import type { NoUndefinedField } from "@/lib/api/types/non-generated";
import { ImagePosition, useUserPrintPreferences } from "@/composables/use-users/preferences";
import { ingredientSubstitutionSummary, useFoodPlurality, useIngredientTextParser, useNutritionLabels } from "@/composables/recipes";
import { usePageState } from "@/composables/recipe-page/shared-state";
import { useScaledAmount } from "@/composables/recipes/use-scaled-amount";

interface Props {
  recipe: NoUndefinedField<Recipe>;
  scale?: number;
  dense?: boolean;
}

type IngredientSection = {
  sectionName: string;
  ingredients: RecipeIngredient[];
};

type InstructionSection = {
  sectionName: string;
  stepOffset: number;
  instructions: RecipeStep[];
};

export default function RecipePrintView({ scale = 1, dense = false }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const { i18n } = useTranslation();
  const preferences = useUserPrintPreferences();
  const { recipeImage } = useStaticRoutes();
  const { imageKey } = usePageState(recipe.slug);
  const { labels } = useNutritionLabels();

  function sanitizeHTML(rawHtml: string) {
    return DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: ["strong", "sup"],
    });
  }
  const servingsDisplay = useMemo(() => {
    const { scaledAmountDisplay } = useScaledAmount(recipe.recipeYieldQuantity, scale);
    return scaledAmountDisplay || recipe.recipeYield
      ? i18n.t("recipe.yields-amount-with-text", {
        amount: scaledAmountDisplay,
        text: recipe.recipeYield,
      }) as string
      : "";
  }, []); // WF4-REVIEW: dependency array

  const yieldDisplay = useMemo(() => {
    const { scaledAmountDisplay } = useScaledAmount(recipe.recipeServings, scale);
    return scaledAmountDisplay ? i18n.t("recipe.serves-amount", { amount: scaledAmountDisplay }) as string : "";
  }, []); // WF4-REVIEW: dependency array

  const recipeYield = useMemo(() => {
    if (servingsDisplay && yieldDisplay) {
      return sanitizeHTML(`${yieldDisplay}; ${servingsDisplay}`);
    }
    else {
      return sanitizeHTML(yieldDisplay || servingsDisplay);
    }
  }, []); // WF4-REVIEW: dependency array

  const recipeImageUrl = useMemo(() => {
    return recipeImage(recipe.id, recipe.image, imageKey);
  }, []); // WF4-REVIEW: dependency array

  // Group ingredients by section so we can style them independently
  const ingredientSections = useMemo(() => {
    if (!recipe.recipeIngredient) {
      return [];
    }
    const addIngredientsToSections = (ingredients: RecipeIngredient[], sections: IngredientSection[], title: string | null) => {
    // If title is set, ensure the section exists before adding ingredients
      let section: IngredientSection | undefined;
      if (title) {
        section = sections.find(sec => sec.sectionName === title);
        if (!section) {
          section = { sectionName: title, ingredients: [] };
          sections.push(section);
        }
      }

      ingredients.forEach((ingredient) => {
        if (preferences.expandChildRecipes && ingredient.referencedRecipe?.recipeIngredient?.length) {
          // Recursively add to the section for this referenced recipe
          addIngredientsToSections(
            ingredient.referencedRecipe.recipeIngredient,
            sections,
            "",
          );
        }
        else {
          const sectionName = title || ingredient.title || "";
          if (sectionName) {
            let sec = sections.find(sec => sec.sectionName === sectionName);
            if (!sec) {
              sec = { sectionName, ingredients: [] };
              sections.push(sec);
            }
            ingredient.title = sectionName;
            sec.ingredients.push(ingredient);
          }
          else {
            if (sections.length === 0) {
              sections.push({
                sectionName: "",
                ingredients: [ingredient],
              });
            }
            else {
              sections[sections.length - 1].ingredients.push(ingredient);
            }
          }
        }
      });
    };

    const sections: IngredientSection[] = [];
    addIngredientsToSections(recipe.recipeIngredient, sections, null);
    return sections;
  }, []); // WF4-REVIEW: dependency array

  // Group instructions by section so we can style them independently
  const instructionSections = useMemo(() => {
    if (!recipe.recipeInstructions) {
      return [];
    }

    return recipe.recipeInstructions.reduce((sections, step) => {
      const offset = (() => {
        if (sections.length === 0) {
          return 0;
        }

        const lastOffset = sections[sections.length - 1].stepOffset;
        const lastNumSteps = sections[sections.length - 1].instructions.length;
        return lastOffset + lastNumSteps;
      })();

      // if title append new section to the end of the array
      if (step.title) {
        sections.push({
          sectionName: step.title,
          stepOffset: offset,
          instructions: [step],
        });

        return sections;
      }

      // append if first element
      if (sections.length === 0) {
        sections.push({
          sectionName: "",
          stepOffset: offset,
          instructions: [step],
        });

        return sections;
      }

      // otherwise add step to last section in the array
      sections[sections.length - 1].instructions.push(step);
      return sections;
    }, [] as InstructionSection[]);
  }, []); // WF4-REVIEW: dependency array

  const hasNotes = useMemo(() => {
    return recipe.notes && recipe.notes.length > 0;
  }, []); // WF4-REVIEW: dependency array

  // Precompute each step's linked ingredients so the template doesn't re-filter recipeIngredient on every render
  const stepLinkedIngredients = useMemo(() => {
    const map = new Map<string, RecipeIngredient[]>();

    instructionSections.forEach((section, sectionIndex) => {
      section.instructions.forEach((step, stepIndex) => {
        if (!step.ingredientReferences?.length) {
          return;
        }

        const referenceIds = new Set(step.ingredientReferences.map(ref => ref.referenceId));
        map.set(
          `${sectionIndex}-${stepIndex}`,
          recipe.recipeIngredient.filter(ing => ing.referenceId && referenceIds.has(ing.referenceId)),
        );
      });
    });

    return map;
  }, []); // WF4-REVIEW: dependency array

  const { parseIngredientText } = useIngredientTextParser();

  function parseText(ingredient: RecipeIngredient) {
    return parseIngredientText(ingredient, scale);
  }

  const { shouldPluralizeFood } = useFoodPlurality();

  // the substitutes inflect with the line they stand in for, the same as on screen
  function substitutionSummary(ingredient: RecipeIngredient) {
    return ingredientSubstitutionSummary(ingredient, shouldPluralizeFood(ingredient, scale));
  }

  return (
    <>
  <div className={dense ? 'wrapper' : 'wrapper pa-3'}>
    <section>
      <Container className="ma-0 pa-0">
        <Grid container>
          {(recipe.image && preferences.imagePosition && preferences.imagePosition != ImagePosition.hidden) ? (
            /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
            <Grid order={preferences.imagePosition == ImagePosition.left ? -1 : 1} cols="4" align-self="center">
              <img key={imageKey} src={recipeImageUrl} style="min-height: 50; max-width: 100%;" />
            </Grid>
          ) : null}
          {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
          <Grid order="0">
            {/* WF4-REVIEW: title text moves to the title prop */}
            <CardHeader className="headline pl-0">
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={icons.primary} color="primary" />
              {recipe.name}
            </CardHeader>
            {(recipeYield) ? (
              <div className="d-flex justify-space-between align-center pb-6">
                <div>
                  {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
                  <MdiIcon name={icons.potSteam} />
                  <SafeHtml html={recipeYield} />
                </div>
              </div>
            ) : null}
            <Grid container className="d-flex justify-start">
              <RecipeTimeCard prep-time={recipe.prepTime} total-time={recipe.totalTime} perform-time={recipe.performTime} prep-time-seconds={recipe.prepTimeSeconds} total-time-seconds={recipe.totalTimeSeconds} perform-time-seconds={recipe.performTimeSeconds} small color="white" className="ml-4" />
            </Grid>
            {(preferences.showDescription) ? (
              <CardContent className="px-0">
                <SafeMarkdown source={recipe.description} />
              </CardContent>
            ) : null}
          </Grid>
        </Grid>
      </Container>
    </section>
    <section>
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader className="headline pl-0">
        {t("recipe.ingredients")}
      </CardHeader>
      {ingredientSections.map((ingredientSection, sectionIndex) => (
        <div key={`ingredient-section-${sectionIndex}`} className="print-section">
          {(ingredientSection.ingredients[0].title) ? (
            <h4 className="ingredient-title mt-2">
              {ingredientSection.ingredients[0].title}
            </h4>
          ) : null}
          <div className="ingredient-grid" style={{ gridTemplateRows: `repeat(${Math.ceil(ingredientSection.ingredients.length / 2)}, min-content)` }}>
            {ingredientSection.ingredients.map((ingredient, ingredientIndex) => (
              <div key={`ingredient-${ingredientIndex}`} className="ingredient-cell">
                <SafeHtml html={parseText(ingredient)} />
                {(preferences.showSubstitutions && substitutionSummary(ingredient)) ? (
                  <SafeMarkdown className="substitution-body" source={t('recipe.substitutions-with-value', { substitutions: substitutionSummary(ingredient) })} />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
    <section>
      {instructionSections.map((instructionSection, sectionIndex) => (
        <div key={`instruction-section-${sectionIndex}`} className={{ 'print-section': instructionSection.sectionName }}>
          {(!sectionIndex) ? (
            /* WF4-REVIEW: title text moves to the title prop */
            <CardHeader className="headline pl-0">
              {t("recipe.instructions")}
            </CardHeader>
          ) : null}
          {instructionSection.instructions.map((step, stepIndex) => (
            <div key={`instruction-${stepIndex}`}>
              <div className="print-section">
                {(step.title) ? (
                  <h4 key={`instruction-title-${stepIndex}`} className="instruction-title mb-2">
                    {step.title}
                  </h4>
                ) : null}
                <h5>
                  {step.summary ? step.summary : t("recipe.step-index", {
                step: stepIndex
                  + instructionSection.stepOffset
                  + 1,
              })}
                </h5>
                <SafeMarkdown source={step.text} className="recipe-step-body" />
                {(preferences.showLinkedIngredients && step.ingredientReferences && step.ingredientReferences.length > 0) ? (
                  <div className="print-section">
                    <h6 className="ingredient-title mt-2 mb-0">
                      {t("recipe.ingredients")}
                    </h6>
                    <div className="step-ingredient-grid" style={{ gridTemplateRows: `repeat(${Math.ceil(step.ingredientReferences.length / 2)}, min-content)` }}>
                      {stepLinkedIngredients.get(`${sectionIndex}-${stepIndex}`) ?? [].map((ingredient, ingredientIndex) => (
                        <>
                          <SafeHtml html={parseText(ingredient)} />
                        </>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
    {(preferences.showNotes) ? (
      <div>
        {(hasNotes) ? (
          <Divider className="grey my-4" />
        ) : null}
        <section>
          {recipe.notes.map((note, index) => (
            <div key={index + 'note'}>
              <div className="print-section">
                <h4>
                  {note.title}
                </h4>
                <SafeMarkdown source={note.text} className="note-body" />
              </div>
            </div>
          ))}
        </section>
      </div>
    ) : null}
    {(preferences.showNutrition) ? (
      <div>
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="headline pl-0">
          {t("recipe.nutrition")}
        </CardHeader>
        <section>
          <div className="print-section">
            <table className="nutrition-table">
              <tbody>
                {recipe.nutrition.map((value, key) => (
                  <tr key={key}>
                    {(value) ? (
                      <>
                        <td>
                          {labels[key].label}
                        </td>
                        <td>
                          {value ? (labels[key].suffix ? `${value} ${labels[key].suffix}` : value) : '-'}
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    ) : null}
  </div>
    </>
  );
}
