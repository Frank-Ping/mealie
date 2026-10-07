import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CardContent, CardHeader } from "@mui/material";
import { VueDraggable } from "vue-draggable-plus";
import type { MenuItem } from "@/components/global/BaseOverflowButton";
import type { ParsedIngredient } from "@/lib/api/types/recipe";
import type { Parser } from "@/lib/api/user/recipes/recipe";

export default function ParseDialogReview() {
  const { t } = useTranslation();

  defineEmits<{
    parse: [];
    changeParser: [Parser];
  }>();
  const props = defineProps<{
    availableParsers: MenuItem[];
    parser: Parser;
    showNlpLanguageHint: boolean;
  }>();
  const parsedIngs = defineModel<ParsedIngredient[]>({ required: true });

  const state = /* WF4-REVIEW [J] */ reactive({
    parser: props.parser,
  });

  const [drag, setDrag] = useState(false);

  function insertNewIngredient(index: number) {
    const ing = {
      input: "",
      confidence: {},
      ingredient: {
        quantity: 0,
        referenceId: uuid4(),
      },
    } as ParsedIngredient;

    parsedIngs.splice(index, 0, ing);
  }

  return (
    <>
  <div className="d-flex flex-column ga-4">
    {/* WF4-REVIEW: v-model on complex expression "state.parser" [J] */}
    <ParseDialogChangeParser {/* WF4-REVIEW: v-model state.parser */} available-parsers={availableParsers} show-nlp-language-hint={showNlpLanguageHint} onUpdateModelValue={onChangeParser?.($event)} onParse={onParse?.()} />
    <div>
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader className="text-center pt-0 pb-8">
        {t("recipe.parser.review-parsed-ingredients")}
      </CardHeader>
      <CardContent>
        <VueDraggable value={parsedIngs} onChange={/* WF4-REVIEW: setter */ setParsedIngs} handle=".handle" delay={250} delay-on-touch-only={true} {...({
            animation: 200,
            group: 'recipe-ingredients',
            disabled: false,
            ghostClass: 'ghost',
          })} onStart={drag = true} onEnd={drag = false}>
          <TransitionGroup type="transition">
            {parsedIngs.map((ingredient, index) => (
              /* WF4-REVIEW: unmapped <v-lazy> — judgement component, convert manually [J] */
              <VLazy key={index}>
                {/* WF4-REVIEW: v-model on complex expression "ingredient.ingredient" [J] */}
                <RecipeIngredientEditor {/* WF4-REVIEW: v-model ingredient.ingredient */} enable-drag-handle enable-context-menu delete-disabled={parsedIngs.length <= 1} className="mb-5" onDelete={parsedIngs.splice(index, 1)} onInsertAbove={insertNewIngredient(index)} onInsertBelow={insertNewIngredient(index + 1)}>
                  <template>
                    {(ingredient.input) ? (
                      <p className="py-0 my-0 text-caption">
                        {t("recipe.original-text-with-value", { originalText: ingredient.input })}
                      </p>
                    ) : null}
                  </template>
                </RecipeIngredientEditor>
              </VLazy>
            ))}
          </TransitionGroup>
        </VueDraggable>
      </CardContent>
    </div>
  </div>
    </>
  );
}
