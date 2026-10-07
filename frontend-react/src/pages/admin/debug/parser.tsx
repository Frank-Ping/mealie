import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, CardHeader, Chip, Container, FormControlLabel, TextField, ToggleButtonGroup } from "@mui/material";
import { icons } from "@/lib/icons";
import { alert } from "@/composables/use-toast";
import { useUserApi } from "@/composables/api";
import type { IngredientConfidence } from "@/lib/api/types/recipe";
import type { Parser } from "@/lib/api/user/recipes/recipe";

export const handle = {
  layout: "admin",
}; // WF4-REVIEW: merged into the route table (was definePageMeta)

type ConfidenceAttribute = "average" | "comment" | "name" | "unit" | "quantity" | "food";

export default function Parser() {
  const { t } = useTranslation();

  const api = useUserApi();

  const state = /* WF4-REVIEW [J] */ reactive({
    loading: false,
    ingredient: "",
    results: false,
    parser: "nlp" as Parser,
  });

  const { i18n } = useTranslation();

  // Set page title
  useSeoMeta({
    title: i18n.t("admin.parser"),
  });

  const [confidence, setConfidence] = useState({});

  function getColor(attribute: ConfidenceAttribute) {
    const percentage = getConfidence(attribute);
    if (percentage === undefined) return;

    const p_as_num = parseFloat(percentage.replace("%", ""));

    // Set color based off range
    if (p_as_num > 75) {
      return "success";
    }
    else if (p_as_num > 60) {
      return "warning";
    }
    else {
      return "error";
    }
  }

  function getConfidence(attribute: ConfidenceAttribute) {
    if (!confidence) {
      return;
    }

    const property = confidence[attribute];
    if (property !== undefined && property !== null) {
      return `${(+property * 100).toFixed(0)}%`;
    }
    return undefined;
  }

  const tryText = [
    "2 tbsp minced cilantro, leaves and stems",
    "1 large yellow onion, coarsely chopped",
    "1 1/2 tsp garam masala",
    "1 inch piece fresh ginger, (peeled and minced)",
    "2 cups mango chunks, (2 large mangoes) (fresh or frozen)",
  ];

  function processTryText(str: string) {
    state.ingredient = str;
    processIngredient();
  }

  async function processIngredient() {
    if (state.ingredient === "") {
      return;
    }

    state.loading = true;

    const { data } = await api.recipes.parseIngredient(state.parser, state.ingredient);

    if (data) {
      state.results = true;

      if (data.confidence) setConfidence(data.confidence);

      // TODO: Remove ts-ignore
      // ts-ignore because data will likely change significantly once I figure out how to return results
      // for the parser. For now we'll leave it like this
      properties.comment = data.ingredient.note || "";
      properties.quantity = data.ingredient.quantity || "";
      properties.unit = data.ingredient?.unit?.name || "";
      properties.food = data.ingredient?.food?.name || "";

      (["comment", "quantity", "unit", "food"] as ConfidenceAttribute[]).forEach((property) => {
        const color = getColor(property);
        const confidence = getConfidence(property);
        if (color) {
          properties[property].color = color;
        }
        if (confidence) {
          properties[property].confidence = confidence;
        }
      });
    }
    else {
      alert.error(i18n.t("events.something-went-wrong") as string);
      state.results = false;
    }
    state.loading = false;
  }

  const properties = /* WF4-REVIEW [J] */ reactive({
    quantity: {
      subtitle: i18n.t("recipe.quantity"),
      value: "" as string | number,
      color: null,
      confidence: null,
    },
    unit: {
      subtitle: i18n.t("recipe.unit"),
      value: "",
      color: null,
      confidence: null,
    },
    food: {
      subtitle: i18n.t("shopping-list.food"),
      value: "",
      color: null,
      confidence: null,
    },
    comment: {
      subtitle: i18n.t("recipe.comment"),
      value: "",
      color: null,
      confidence: null,
    },
  });

  const [showConfidence, setShowConfidence] = useState(false);

  return (
    <>
  <Container className="pa-0">
    <Container>
      <BaseCardSectionTitle title={t('admin.ingredients-natural-language-processor')}>
        {t('admin.ingredients-natural-language-processor-explanation')}
        <p className="pt-3">
          {t('admin.ingredients-natural-language-processor-explanation-2')}
        </p>
      </BaseCardSectionTitle>
      <div className="d-flex align-center justify-center justify-md-start flex-wrap">
        {/* WF4-REVIEW: value/selection API; v-model on complex expression "state.parser" [J] */}
        <ToggleButtonGroup density="compact" mandatory="force" onChange={processIngredient}>
          <Button value="nlp">
            {t('admin.nlp')}
          </Button>
          <Button value="brute">
            {t('admin.brute')}
          </Button>
          <Button value="openai">
            {t('admin.openai')}
          </Button>
        </ToggleButtonGroup>
        <Box sx={{ flexGrow: 1 }} />
        {/* WF4-REVIEW: control={<Checkbox/>} + label prop */}
        <FormControlLabel value={showConfidence} onChange={setShowConfidence} className="ml-5" label={t('admin.show-individual-confidence')} hide-details />
      </div>
      <Card flat>
        <CardContent>
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "state.ingredient" [J] */}
          <TextField label={t('admin.ingredient-text')} />
        </CardContent>
        <CardActions>
          <BaseButton className="ml-auto" onClick={processIngredient}>
            {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
            <>
              {icons.check}
            </>
            {t("general.submit")}
          </BaseButton>
        </CardActions>
      </Card>
    </Container>
    {(state.results) ? (
      <Container>
        {(state.parser !== 'brute' && getConfidence('average')) ? (
          <div className="d-flex">
            {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-chip> */}
            <Chip color={getColor('average')} className="mx-auto mb-2">
              {t('admin.average-confident', [getConfidence("average")])}
            </Chip>
          </div>
        ) : null}
        <div className="d-flex justify-center flex-wrap" style="gap: 1.5rem">
          {properties.map((prop, index) => (
            <>
              {(prop) ? (
                <div key={index} className="flex-grow-1">
                  <Card min-width="200px">
                    {/* WF4-REVIEW: title text moves to the title prop */}
                    <CardHeader>
                      {prop}
                    </CardHeader>
                    <CardContent>
                      {prop.subtitle}
                    </CardContent>
                  </Card>
                  {(prop.confidence && showConfidence) ? (
                    /* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-chip> */
                    <Chip color={prop.color!} className="mt-2">
                      {t('admin.average-confident', [prop.confidence])}
                    </Chip>
                  ) : null}
                </div>
              ) : null}
            </>
          ))}
        </div>
      </Container>
    ) : null}
    <Container className="narrow-container">
      {/* WF4-REVIEW: title text moves to the title prop */}
      <CardHeader>
        {t('admin.try-an-example')}
      </CardHeader>
      {tryText.map((text, idx) => (
        <Card key={idx} className="my-2" hover onClick={processTryText(text)}>
          <CardContent>
            {text}
          </CardContent>
        </Card>
      ))}
    </Container>
  </Container>
    </>
  );
}
