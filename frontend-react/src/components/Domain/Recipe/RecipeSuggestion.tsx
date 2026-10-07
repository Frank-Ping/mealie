import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CardContent, Chip, Container, FormControlLabel, Grid } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import RecipeCardMobile from "./RecipeCardMobile";
import type {
  IngredientFood,
  IngredientFoodSummary,
  RecipeSuggestionSubstitutedFood,
  RecipeSummary,
  RecipeTool,
} from "@/lib/api/types/recipe";

interface Props {
  recipe: RecipeSummary;
  missingFoods?: IngredientFood[] | null;
  missingTools?: RecipeTool[] | null;
  substitutedFoods?: RecipeSuggestionSubstitutedFood[] | null;
  disableCheckbox?: boolean;
}

interface Organizer {
  type: "food" | "tool";
  item: IngredientFood | RecipeTool;
  selected: boolean;
}

export default function RecipeSuggestion({ missingFoods = null, missingTools = null, substitutedFoods = null, disableCheckbox = false }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  // same label rule the missing-food chips use
  function foodLabel(food: IngredientFood | IngredientFoodSummary) {
    return food.pluralName || food.name;
  }

  const emit = defineEmits<{
    "add-food": [food: IngredientFood];
    "remove-food": [food: IngredientFood];
    "add-tool": [tool: RecipeTool];
    "remove-tool": [tool: RecipeTool];
  }>();

  // icons imported directly (was $globals)
  const missingOrganizers = useMemo(() => [
    {
      type: "food",
      show: missingFoods?.length,
      icon: icons.foods,
      items: missingFoods
        ? missingFoods.map((food) => {
            return /* WF4-REVIEW [J] */ reactive({ type: "food", item: food, selected: false } as Organizer);
          })
        : [],
      getLabel: (item: IngredientFood) => item.pluralName || item.name,
    },
    {
      type: "tool",
      show: missingTools?.length,
      icon: icons.tools,
      items: missingTools
        ? missingTools.map((tool) => {
            return /* WF4-REVIEW [J] */ reactive({ type: "tool", item: tool, selected: false } as Organizer);
          })
        : [],
      getLabel: (item: RecipeTool) => item.name,
    },
  ], []); // WF4-REVIEW: dependency array

  function handleCheckbox(organizer: Organizer) {
    if (disableCheckbox) {
      return;
    }

    organizer.selected = !organizer.selected;
    if (organizer.selected) {
      if (organizer.type === "food") {
        emit("add-food", organizer.item as IngredientFood);
      }
      else {
        emit("add-tool", organizer.item as RecipeTool);
      }
    }
    else {
      if (organizer.type === "food") {
        emit("remove-food", organizer.item as IngredientFood);
      }
      else {
        emit("remove-tool", organizer.item as RecipeTool);
      }
    }
  }

  return (
    <>
  <Container className="elevation-3">
    <Grid container no-gutters>
      {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
      <Grid cols="12">
        <RecipeCardMobile name={recipe.name} description={recipe.description} slug={recipe.slug} rating={recipe.rating} image={recipe.image} recipe-id={recipe.id} />
      </Grid>
      {missingOrganizers.map((organizer, idx) => (
        <div key={idx}>
          {(organizer.show) ? (
            /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
            <Grid cols="12">
              <div className="d-flex flex-row flex-wrap align-center pt-2">
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon className="ma-0 pa-0" />
                <CardContent className="mr-0 my-0 pl-1 py-0 flex-grow-0" style="width: max-content">
                  {t("recipe-finder.missing")}
                  :
                </CardContent>
                {organizer.items.map(item => (
                  <Chip key={item.item.id} label color="secondary custom-transparent" className="mr-2 my-1 pl-1" variant="flat">
                    {/* WF4-REVIEW: control={<Checkbox/>} + label prop; dropped Vuetify-only prop "dark" on <v-checkbox> */}
                    <FormControlLabel ripple={false} hide-details onClick={handleCheckbox(item)}>
                      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                      <>
                        {organizer.getLabel(item.item)}
                      </>
                    </FormControlLabel>
                  </Chip>
                ))}
              </div>
            </Grid>
          ) : null}
        </div>
      ))}
      {(substitutedFoods?.length) ? (
        /* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */
        <Grid cols="12">
          <div className="d-flex flex-row flex-wrap align-center pt-2">
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon className="ma-0 pa-0" />
            <CardContent className="mr-0 my-0 pl-1 py-0 flex-grow-0" style="width: max-content">
              {t("recipe-finder.substituting")}
              :
            </CardContent>
            {substitutedFoods.map((substituted, idx) => (
              <Chip key={idx} label color="info custom-transparent" className="mr-2 my-1" variant="flat" prepend-icon={icons.swapHorizontal}>
                {t("recipe-finder.substitute-for-food", {
              substitute: foodLabel(substituted.substituteFood),
              food: foodLabel(substituted.food),
            })}
              </Chip>
            ))}
          </div>
        </Grid>
      ) : null}
    </Grid>
  </Container>
    </>
  );
}
