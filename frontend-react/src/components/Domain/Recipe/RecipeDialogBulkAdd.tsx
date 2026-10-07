import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Button, CardContent, Divider, List, ListItem, ListItemText, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";

interface Props {
  inputTextProp?: string;
}

export default function RecipeDialogBulkAdd({ inputTextProp = "" }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const emit = defineEmits<{
    "bulk-data": [data: string[]];
  }>();

  const [dialog, setDialog] = useState(false);
  const [inputText, setInputText] = useState(inputTextProp);

  function splitText() {
    return inputText.split("\n").filter(line => line.trim().length > 0);
  }

  const canSave = useMemo(() => splitText().length > 0, []); // WF4-REVIEW: dependency array

  function removeFirstCharacter() {
    setInputText(splitText()
      .map(line => line.substring(1))
      .join("\n"));
  }

  const numberedLineRegex = /\d+[.):] /gm;

  function splitByNumberedLine() {
    // Split inputText by numberedLineRegex
    const matches = inputText.match(numberedLineRegex);

    matches?.forEach((match, idx) => {
      const replaceText = idx === 0 ? "" : "\n";
      setInputText(inputText.replace(match, replaceText));
    });
  }

  function trimAllLines() {
    const splitLines = splitText();

    splitLines.forEach((element: string, index: number) => {
      splitLines[index] = element.trim();
    });

    setInputText(splitLines.join("\n"));
  }

  function save() {
    if (!canSave) {
      return;
    }

    emit("bulk-data", splitText());
    setDialog(false);
  }

  function open() {
    setDialog(true);
  }
  function close() {
    setDialog(false);
  }

  const { i18n } = useTranslation();

  const utilities = useMemo(() => [
    {
      id: "trim-whitespace",
      description: i18n.t("new-recipe.trim-whitespace-description"),
      action: trimAllLines,
    },
    {
      id: "trim-prefix",
      description: i18n.t("new-recipe.trim-prefix-description"),
      action: removeFirstCharacter,
    },
    {
      id: "split-by-numbered-line",
      description: i18n.t("new-recipe.split-by-numbered-line-description"),
      action: splitByNumberedLine,
    },
  ], []); // WF4-REVIEW: dependency array

  // Expose functions to parent components
  defineExpose({
    open,
    close,
  });

  return (
    <>
  <div className="text-center">
    <BaseButton onClick={() => setDialog(true)}>
      {t("new-recipe.bulk-add")}
    </BaseButton>
    <BaseDialog value={dialog} onChange={setDialog} width="800" title={t('new-recipe.bulk-add')} icon={icons.createAlt} submit-text={t('general.add')} submit-disabled={!canSave} disable-submit-on-enter={true} can-submit onSubmit={save}>
      <CardContent>
        <TextField multiline value={inputText} onChange={setInputText} variant="outlined" rows="12" hide-details autofocus placeholder={t('new-recipe.paste-in-your-recipe-data-each-line-will-be-treated-as-an-item-in-a-list')} />
        <Divider />
        <List lines="two">
          {utilities.map((util) => (
            <>
              {/* WF4-REVIEW: @click → ListItemButton */}
              <ListItem className="px-0">
                {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
                <>
                  <Avatar>
                    <Button icon variant="tonal" base-color="info" title={t('general.run')} onClick={util.action}>
                      {/* WF4-REVIEW: icon name resolves via lib/icons */}
                      <MdiIcon name={icons.play} />
                    </Button>
                  </Avatar>
                </>
                {/* WF4-REVIEW: content → primary prop */}
                <ListItemText className="text-pre-wrap">
                  {util.description}
                </ListItemText>
              </ListItem>
            </>
          ))}
        </List>
      </CardContent>
    </BaseDialog>
  </div>
    </>
  );
}
