import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Card, CardActions, CardContent, List, ListItem } from "@mui/material";
import type { MenuItem } from "@/components/global/BaseOverflowButton";
import type { Parser } from "@/lib/api/user/recipes/recipe";

export default function ParseDialogChangeParser() {
  const { t } = useTranslation();

  defineProps<{ availableParsers: MenuItem[]; showNlpLanguageHint: boolean }>();
  const emit = defineEmits<{ parse: [] }>();
  const currentParser = defineModel<Parser>({ default: "nlp" });

  const { t } = useI18n();

  const currentParserText = useMemo(() =>  {
    switch (currentParser, []); // WF4-REVIEW: dependency array {
      case "brute": return t("recipe.parser.brute-parser");
      case "openai": return t("recipe.parser.openai-parser");
    }
    return t("recipe.parser.natural-language-processor");
  });
  const [open, setOpen] = useState(false);
  /* WF4-REVIEW [J] */ watch(currentParser, () => emit("parse"));

  return (
    <>
  <Card variant="outlined" color="info" className="d-flex justify-space-between align-center" onClick={onParse?.()}>
    <CardContent>
      {t('recipe.parser.try-again-with-parser', { parser: currentParserText })}
    </CardContent>
    <CardActions>
      <BaseButton edit minor onClick={(e) => { e.stopPropagation(); open = true; }}>
        {t('recipe.parser.select-parser')}
      </BaseButton>
    </CardActions>
  </Card>
  {(showNlpLanguageHint) ? (
    <Alert type="info" variant="tonal" density="compact" className="mt-3 text-body-2">
      {t("recipe.parser.natural-language-processor-english-only")}
    </Alert>
  ) : null}
  <BaseDialog value={open} onChange={setOpen} bottom-sheet title={t('recipe.parser.select-parser')} icon={$globals.icons.fileSign}>
    <List>
      {availableParsers.filter(({ hide }) => !hide).map((parser) => (
        /* WF4-REVIEW: @click → ListItemButton */
        <ListItem key={parser} link append-icon={$globals.icons.chevronRight} onClick={currentParser = parser as Parser;
          onParse?.()}>
          {parser.text}
        </ListItem>
      ))}
    </List>
  </BaseDialog>
    </>
  );
}
