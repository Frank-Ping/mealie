import { useMemo } from "react";
import { List, Paper } from "@mui/material";
import SafeHtml from "@/components/SafeHtml";
import DOMPurify from "dompurify";
import RecipeCardLineItem from "./RecipeCardLineItem";
import { useFraction } from "@/composables/recipes/use-fraction";
import type { ShoppingListItemOut } from "@/lib/api/types/household";
import type { RecipeSummary } from "@/lib/api/types/recipe";

interface Props {
  recipes: RecipeSummary[];
  listItem?: ShoppingListItemOut;
  tile?: boolean;
  showDescription?: boolean;
  disabled?: boolean;
}

export default function RecipeList({ listItem = undefined, tile = false, showDescription = false, disabled = false }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const { frac } = useFraction();
  const display = useDisplay();

  // Determine if we should show tiles based on screen size and number of recipes
  const shouldShowTiles = useMemo(() => {
    return tile && display.smAndUp;
  }, []); // WF4-REVIEW: dependency array

  const attrs = useMemo(() => {
    const tileClasses = shouldShowTiles ? "d-flex flex-wrap" : "bg-transparent";
    const sheetClasses = shouldShowTiles
      ? "flex-grow-0 flex-shrink-0 mb-2 me-3"
      : tile ? "mb-2 mx-2" : "mb-1";
    const sheetStyle = shouldShowTiles
      ? { flexBasis: "calc(50% - 12px)", width: "calc(50% - 12px)" }
      : {};

    return {
      class: {
        list: tileClasses,
        sheet: sheetClasses,
        listItem: "px-4 py-2",
      },
      style: {
        sheet: sheetStyle,
      },
    };
  }, []); // WF4-REVIEW: dependency array

  function sanitizeHTML(rawHtml: string) {
    return DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: ["strong", "sup"],
    });
  }

  const listItemDescriptions = useMemo(() => {
    if (
      recipes.length === 1 // we don't need to specify details if there's only one recipe ref
      || !listItem?.recipeReferences
      || listItem.recipeReferences.length !== recipes.length
    ) {
      return recipes.map(_ => "");
    }

    const listItemDescriptions: string[] = [];
    for (let i = 0; i < recipes.length; i++) {
      const itemRef = listItem?.recipeReferences[i];
      const quantity = (itemRef.recipeQuantity || 1) * (itemRef.recipeScale || 1);

      let listItemDescription = "";
      if (listItem.unit?.fraction) {
        const fraction = frac(quantity, 10, true);
        if (fraction[0] !== undefined && fraction[0] > 0) {
          listItemDescription += fraction[0];
        }

        if (fraction[1] > 0) {
          listItemDescription += ` <sup>${fraction[1]}</sup>&frasl;<sub>${fraction[2]}</sub>`;
        }
        else {
          listItemDescription = (quantity).toString();
        }
      }
      else {
        listItemDescription = (Math.round(quantity * 100) / 100).toString();
      }

      if (listItem.unit) {
        const unitDisplay = listItem.unit.useAbbreviation && listItem.unit.abbreviation
          ? listItem.unit.abbreviation
          : listItem.unit.name;

        listItemDescription += ` ${unitDisplay}`;
      }
      if (listItem.food) {
        const foodName = listItem.food.name;
        listItemDescription += ` ${foodName}`;
      }

      if (itemRef.recipeNote) {
        listItemDescription += `, ${itemRef.recipeNote}`;
      }

      listItemDescriptions.push(sanitizeHTML(listItemDescription));
    }

    return listItemDescriptions;
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  <List className={attrs.class.list}>
    {/* WF4-REVIEW: unparseable v-for "recipe, index in recipes" */}
      <Paper key={recipe.id || recipe.slug} elevation={2} className={attrs.class.sheet} style={attrs.style.sheet}>
        <RecipeCardLineItem recipe={recipe} disable-link={disabled} className={attrs.class.listItem}>
          {(showDescription || (listItem && listItemDescriptions[index])) ? (
            /* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */
            <>
              {(showDescription) ? (
                <div>
                  {recipe.description}
                </div>
              ) : null}
              {(listItem && listItemDescriptions[index]) ? (
                <>
                  <SafeHtml html={listItemDescriptions[index]} />
                </>
              ) : null}
            </>
          ) : null}
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            <slot name={'actions-' + recipe.id} v-bind={{ item: recipe }} />
          </>
        </RecipeCardLineItem>
      </Paper>
  </List>
    </>
  );
}
