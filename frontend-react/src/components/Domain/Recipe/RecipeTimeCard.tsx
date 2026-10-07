import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Divider, Grid } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useRecipeTime } from "@/composables/recipes";

interface Props {
  prepTime?: string | null;
  totalTime?: string | null;
  performTime?: string | null;
  prepTimeSeconds?: number | null;
  totalTimeSeconds?: number | null;
  performTimeSeconds?: number | null;
  color?: string;
  small?: boolean;
}

export default function RecipeTimeCard({ prepTime = null, totalTime = null, performTime = null, prepTimeSeconds = null, totalTimeSeconds = null, performTimeSeconds = null, color = "accent custom-transparent", small = false }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const { i18n } = useTranslation();
  const { recipeTimeDisplay } = useRecipeTime();

  const totalTime = useMemo(() => recipeTimeDisplay(totalTimeSeconds, totalTime), []); // WF4-REVIEW: dependency array
  const prepTime = useMemo(() => recipeTimeDisplay(prepTimeSeconds, prepTime), []); // WF4-REVIEW: dependency array
  const performTime = useMemo(() => recipeTimeDisplay(performTimeSeconds, performTime), []); // WF4-REVIEW: dependency array

  const _showCards = useMemo(() => {
    return [prepTime, totalTime, performTime].some(x => !!x);
  }, []); // WF4-REVIEW: dependency array

  const validateTotalTime = useMemo(() => {
    return totalTime ? { name: i18n.t("recipe.total-time"), value: totalTime } : null;
  }, []); // WF4-REVIEW: dependency array

  const validatePrepTime = useMemo(() => {
    return prepTime ? { name: i18n.t("recipe.prep-time"), value: prepTime } : null;
  }, []); // WF4-REVIEW: dependency array

  const validatePerformTime = useMemo(() => {
    return performTime ? { name: i18n.t("recipe.perform-time"), value: performTime } : null;
  }, []); // WF4-REVIEW: dependency array

  const fontSize = useMemo(() => {
    return small ? { fontSize: "smaller" } : { fontSize: "larger" };
  }, []); // WF4-REVIEW: dependency array

  return (
    <>
  <div className="time-card-container text-center mx-auto">
    {(validateTotalTime) ? (
      <div className="time-card-flex">
        <Grid container no-gutters className="d-flex flex-no-wrap align-center" className={{
          'justify-center': !$vuetify.display.smAndDown,
          'time-card-item-stacked': $vuetify.display.smAndDown,
        }} style={fontSize}>
          {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
          <MdiIcon name={icons.clockOutline} x-large={!small} color="primary" />
          <p className="my-0 text-no-wrap">
            <span className="font-weight-bold opacity-80">
              {validateTotalTime.name}
            </span>
            <br />
            {validateTotalTime}
          </p>
        </Grid>
      </div>
    ) : null}
    {(validateTotalTime && (validatePrepTime || validatePerformTime)) ? (
      <Divider className="my-2" />
    ) : null}
    {(validatePrepTime || validatePerformTime) ? (
      <div className="time-card-flex">
        <Grid container no-gutters className="d-flex flex-nowrap justify-center align-center" className={{ 'flex-column': $vuetify.display.smAndDown }} style="width: 100%;" style={fontSize}>
          {(validatePrepTime) ? (
            <div className="d-flex flex-no-wrap my-1 align-center" className={{ 'time-card-item-stacked': $vuetify.display.smAndDown }}>
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={icons.knife} size={small ? 'small' : 'large'} color="primary" />
              <p className="my-0 text-no-wrap">
                <span className="font-weight-bold opacity-80">
                  {validatePrepTime.name}
                </span>
                <br />
                {validatePrepTime}
              </p>
            </div>
          ) : null}
          {(validatePrepTime && validatePerformTime && !$vuetify.display.smAndDown) ? (
            <Divider vertical className="mx-4" />
          ) : null}
          {(validatePerformTime) ? (
            <div className="d-flex flex-no-wrap my-1 align-center" className={{ 'time-card-item-stacked': $vuetify.display.smAndDown }}>
              {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
              <MdiIcon name={icons.potSteam} size={small ? 'small' : 'large'} color="primary" />
              <p className="my-0 text-no-wrap">
                <span className="font-weight-bold opacity-80">
                  {validatePerformTime.name}
                </span>
                <br />
                {validatePerformTime}
              </p>
            </div>
          ) : null}
        </Grid>
      </div>
    ) : null}
  </div>
    </>
  );
}
