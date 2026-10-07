import { useTranslation } from "react-i18next";
import { CardContent, FormControlLabel, TextField } from "@mui/material";
import { Organizer } from "@/lib/api/types/non-generated";
import QueryFilterBuilder from "@/components/Domain/QueryFilterBuilder";
import type { FieldDefinition } from "@/composables/use-query-filter-builder";
import type { ReadCookBook } from "@/lib/api/types/cookbook";

export default function CookbookEditor() {
  const { t } = useTranslation();

  const modelValue = defineModel<ReadCookBook>({ required: true });
  const { i18n } = useTranslation();
  const cookbook = toRef(modelValue);
  function handleInput(value: string | undefined) {
    cookbook.queryFilterString = value || "";
  }

  const fieldDefs: FieldDefinition[] = [
    {
      name: "recipe_category.id",
      label: i18n.t("category.categories"),
      type: Organizer.Category,
    },
    {
      name: "tags.id",
      label: i18n.t("tag.tags"),
      type: Organizer.Tag,
    },
    {
      name: "recipe_ingredient.food.id",
      label: i18n.t("recipe.ingredients"),
      type: Organizer.Food,
    },
    {
      name: "recipe_ingredient.food.label_id",
      label: i18n.t("data-pages.foods.food-label"),
      type: Organizer.Label,
    },
    {
      name: "tools.id",
      label: i18n.t("tool.tools"),
      type: Organizer.Tool,
    },
    {
      name: "household_id",
      label: i18n.t("household.households"),
      type: Organizer.Household,
    },
    {
      name: "user_id",
      label: i18n.t("user.users"),
      type: Organizer.User,
    },
    {
      name: "rating",
      label: i18n.t("general.rating"),
      type: "number",
    },
    {
      name: "total_time_seconds",
      label: i18n.t("recipe.total-time"),
      type: "duration",
    },
    {
      name: "created_at",
      label: i18n.t("general.date-created"),
      type: "date",
    },
    {
      name: "updated_at",
      label: i18n.t("general.date-updated"),
      type: "date",
    },
  ];

  return (
    <>
  <div>
    {(cookbook) ? (
      <CardContent className="px-1">
        {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "cookbook.name" [J] */}
        <TextField label={t('cookbook.cookbook-name')} variant="underlined" color="primary" />
        {/* WF4-REVIEW: v-model on complex expression "cookbook.description" [J] */}
        <TextField multiline auto-grow rows={2} label={t('recipe.description')} variant="underlined" color="primary" />
        <QueryFilterBuilder field-defs={fieldDefs} initial-query-filter={cookbook.queryFilter} onInput={handleInput} />
        {/* WF4-REVIEW: control={<Switch/>} + label prop; v-model on complex expression "cookbook.public" [J] */}
        <FormControlLabel hide-details single-line color="primary">
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {t('cookbook.public-cookbook')}
            <HelpIcon size="small" right className="ml-2">
              {t('cookbook.public-cookbook-description')}
            </HelpIcon>
          </>
        </FormControlLabel>
      </CardContent>
    ) : null}
  </div>
    </>
  );
}
