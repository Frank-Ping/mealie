import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, CardHeader, Tooltip } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import SafeHtml from "@/components/SafeHtml";
import { useScaledAmount } from "@/composables/recipes/use-scaled-amount";

interface Props {
  recipeServings?: number;
  editScale?: boolean;
}

export default function RecipeScaleEditButton({ recipeServings = 0, editScale = false }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const scale = defineModel<number>({ required: true });

  const i18n = useI18n();
  const [menu, setMenu] = useState(false);
  const canEditScale = useMemo(() => editScale && recipeServings > 0, []); // WF4-REVIEW: dependency array

  function recalculateScale(newYield: number) {
    if (isNaN(newYield) || newYield <= 0) {
      return;
    }

    if (recipeServings <= 0) {
      scale = 1;
    }
    else {
      scale = newYield / recipeServings;
    }
  }

  const recipeYieldAmount = useMemo(() =>  {
    return useScaledAmount(recipeServings, scale, []); // WF4-REVIEW: dependency array
  });
  const yieldQuantity = recipeYieldAmount.scaledAmount; // was computed — plain read stays reactive
  const yieldDisplay = useMemo(() =>  {
    return yieldQuantity
      ? i18n.t(
        "recipe.serves-amount", { amount: recipeYieldAmount.scaledAmountDisplay },
      , []); // WF4-REVIEW: dependency array as string
      : "";
  });

  const disableDecrement = computed(() => {
    return yieldQuantity <= 1;
  });

  return (
    <>
  {(yieldDisplay) ? (
    <div>
      <div className="text-center d-flex align-center">
        <div>
          {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
          <VMenu value={menu} onChange={setMenu} disabled={!canEditScale} offset-y top nudge-top="6" close-on-content-click={false}>
            <template>
              {(canEditScale) ? (
                /* WF4-REVIEW: activator slot variants [J] */
                <Tooltip size="small" location="top" color="secondary-darken-1">
                  <template>
                    {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-card> */}
                    <Card className="pa-1 px-2" color="secondary-darken-1" size="small" {...({ ...activatorProps, ...tooltipProps })} style={{ cursor: canEditScale ? '' : 'default' }}>
                      {(canEditScale) ? (
                        /* WF4-REVIEW: icon name resolves via lib/icons */
                        <MdiIcon name={$globals.icons.edit} size="small" className="mr-2" />
                      ) : null}
                      <SafeHtml html={yieldDisplay} />
                    </Card>
                  </template>
                  <span>
                    {t("recipe.edit-scale")}
                  </span>
                </Tooltip>
              ) : (
                /* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-card> */
                <Card className="pa-1 px-2" color="secondary-darken-1" size="small" {...(activatorProps)} style={{ cursor: canEditScale ? '' : 'default' }}>
                  {(canEditScale) ? (
                    /* WF4-REVIEW: icon name resolves via lib/icons */
                    <MdiIcon name={$globals.icons.edit} size="small" className="mr-2" />
                  ) : null}
                  <SafeHtml html={yieldDisplay} />
                </Card>
              )}
            </template>
            <Card min-width="300px">
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader className="mb-0">
                {t("recipe.servings")}
              </CardHeader>
              <CardContent className="mt-n5">
                <div className="mt-4 d-flex align-center">
                  {/* WF4-REVIEW: unmapped <v-number-input> — judgement component, convert manually [J] */}
                  <VNumberInput model-value={yieldQuantity} precision={null} min={0} variant="underlined" control-variant="hidden" onUpdateModelValue={recalculateScale($event || 0)} />
                  {/* WF4-REVIEW: activator slot variants [J] */}
                  <Tooltip location="end" color="secondary-darken-1">
                    <template>
                      <Button {...(resetTooltipProps)} icon flat className="mx-1" size="small" onClick={scale = 1}>
                        {/* WF4-REVIEW: icon name resolves via lib/icons */}
                        <MdiIcon name={$globals.icons.undo} />
                      </Button>
                    </template>
                    <span>
                      {t("recipe.reset-servings-count")}
                    </span>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </VMenu>
        </div>
        {(canEditScale) ? (
          <BaseButtonGroup className="pl-2" large={false} buttons={[
          {
            icon: $globals.icons.minus,
            text: t('recipe.decrease-scale-label'),
            event: 'decrement',
            disabled: disableDecrement,
          },
          {
            icon: $globals.icons.createAlt,
            text: t('recipe.increase-scale-label'),
            event: 'increment',
          },
        ]} onDecrement={recalculateScale(yieldQuantity - 1)} onIncrement={recalculateScale(yieldQuantity + 1)} />
        ) : null}
      </div>
    </div>
  ) : null}
    </>
  );
}
