import { useTranslation } from "react-i18next";
import { Grid } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import SafeHtml from "@/components/SafeHtml";
import DOMPurify from "dompurify";
import { useScaledAmount } from "@/composables/recipes/use-scaled-amount";

interface Props {
  yieldQuantity?: number;
  yieldText?: string;
  scale?: number;
  color?: string;
}

export default function RecipeYield({ yieldQuantity = 0, yieldText = "", scale = 1, color = "accent custom-transparent" }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  function sanitizeHTML(rawHtml: string) {
    return DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: ["strong", "sup"],
    });
  }

  const yieldDisplay = computed<string>(() => {
    const components: string[] = [];

    const { scaledAmountDisplay } = useScaledAmount(yieldQuantity, scale);
    if (scaledAmountDisplay) {
      components.push(scaledAmountDisplay);
    }

    const text = yieldText;
    if (text) {
      components.push(text);
    }

    return sanitizeHTML(components.join(" "));
  });

  return (
    <>
  {(yieldDisplay) ? (
    <div className="d-flex align-center">
      <Grid container no-gutters className="d-flex flex-wrap align-center" style="font-size: larger;">
        {/* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */}
        <MdiIcon name={$globals.icons.bread} size="large" color="primary" />
        <p className="my-0 opacity-80">
          <span className="font-weight-bold">
            {t("recipe.yield")}
          </span>
          <br />
          <SafeHtml html={yieldDisplay} />
        </p>
      </Grid>
    </div>
  ) : null}
    </>
  );
}
