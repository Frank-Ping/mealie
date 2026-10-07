import { useTranslation } from "react-i18next";
import { Button, Card, CardContent, CardHeader, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { uuid4 } from "@/composables/use-utils";
import type { RecipeNote } from "@/lib/api/types/recipe";

interface Props {
  edit?: boolean;
}

export default function RecipeNotes({ edit = true }: Props) {
  const { t } = useTranslation();

  const model = defineModel<RecipeNote[]>({ default: () => [] });

  /* props via generated interface + destructured signature */

  function addNote() {
    model = [...model, { title: "", text: "", referenceId: uuid4() }];
  }

  function removeByIndex(index: number) {
    const newNotes = [...model];
    newNotes.splice(index, 1);
    model = newNotes;
  }

  return (
    <>
  {(model.length > 0 || edit) ? (
    <div className="mt-8">
      <h2 className="my-4 text-h5 font-weight-medium opacity-80">
        {t("recipe.note")}
      </h2>
      {model.map((note, index) => (
        <div id={'note' + index} key={'note' + index} className="mt-1">
          {(edit) ? (
            <Card>
              <CardContent>
                <div className="d-flex align-center">
                  {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "model[index]['title']" [J] */}
                  <TextField variant="underlined" label={t('recipe.title')} />
                  <Button icon className="mr-2" elevation="0" onClick={removeByIndex(index)}>
                    {/* WF4-REVIEW: icon name resolves via lib/icons */}
                    <MdiIcon name={icons.delete} />
                  </Button>
                </div>
                {/* WF4-REVIEW: v-model on complex expression "model[index]['text']" [J] */}
                <TextField multiline variant="underlined" auto-grow placeholder={t('recipe.note')} />
              </CardContent>
            </Card>
          ) : (
            <div>
              {/* WF4-REVIEW: title text moves to the title prop */}
              <CardHeader className="text-subtitle-1 font-weight-medium py-1">
                {note.title}
              </CardHeader>
              <CardContent>
                <SafeMarkdown source={note.text} />
              </CardContent>
            </div>
          )}
        </div>
      ))}
      {(edit) ? (
        <div className="d-flex justify-end">
          <BaseButton className="ml-auto my-2" onClick={addNote}>
            {t("general.add")}
          </BaseButton>
        </div>
      ) : null}
    </div>
  ) : null}
    </>
  );
}
