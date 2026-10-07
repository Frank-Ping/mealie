import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CardContent, Container, Grid, TextField } from "@mui/material";
import { icons } from "@/lib/icons";
import { whenever } from "@vueuse/core";
import { validators } from "@/composables/use-validators";
import type { IngredientFood, IngredientUnit } from "@/lib/api/types/recipe";

interface Props {
  data: IngredientFood | IngredientUnit;
}

export interface GenericAlias {
  name: string;
}

export default function RecipeDataAliasManagerDialog({ data }: Props) {
  const { t } = useTranslation();

  /* props via destructured signature */

  const emit = defineEmits<{
    submit: [aliases: GenericAlias[]];
    cancel: [];
  }>();

  // V-Model Support
  const dialog = defineModel<boolean>({ default: false });

  function createAlias() {
    aliases.push({
      name: "",
    });
  }

  function deleteAlias(index: number) {
    aliases.splice(index, 1);
  }

  const [aliases, setAliases] = useState([]);
  function initAliases() {
    setAliases((data.aliases || []).map(alias => ({ ...alias })));
    if (!aliases.length) {
      createAlias();
    }
  }

  initAliases();
  whenever(
    () => dialog,
    () => {
      initAliases();
    },
  );

  function saveAliases() {
    const seenAliasNames: string[] = [];
    const keepAliases: GenericAlias[] = [];
    aliases.forEach((alias) => {
      const abbreviation = "abbreviation" in data ? data.abbreviation : undefined;
      const pluralAbbreviation = "pluralAbbreviation" in data ? data.pluralAbbreviation : undefined;
      if (
        !alias.name
        || alias.name === data.name
        || alias.name === data.pluralName
        || alias.name === abbreviation
        || alias.name === pluralAbbreviation
        || seenAliasNames.includes(alias.name)
      ) {
        return;
      }

      keepAliases.push(alias);
      seenAliasNames.push(alias.name);
    });

    setAliases(keepAliases);
    emit("submit", keepAliases);
  }

  return (
    <>
  <div>
    <BaseDialog value={dialog} onChange={/* WF4-REVIEW: setter */ setDialog} title={t('data-pages.manage-aliases')} icon={icons.edit} submit-icon={icons.check} submit-text={t('general.confirm')} can-submit onSubmit={saveAliases} onCancel={onCancel?.()}>
      <CardContent>
        <Container>
          {/* WF4-REVIEW: unparseable v-for "alias, i in aliases" */}
            <Grid container key={i}>
              {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
              <Grid cols="10">
                {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "alias.name" [J] */}
                <TextField label={t('general.name')} rules={[validators.required]} />
              </Grid>
              {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
              <Grid cols="2">
                <BaseButtonGroup buttons={[
                  {
                    icon: icons.delete,
                    text: t('general.delete'),
                    event: 'delete',
                  },
                ]} onDelete={deleteAlias(i)} />
              </Grid>
            </Grid>
        </Container>
      </CardContent>
      {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
      <>
        <BaseButton edit onClick={createAlias}>
          {t('data-pages.create-alias')}
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {icons.create}
          </>
        </BaseButton>
      </>
    </BaseDialog>
  </div>
    </>
  );
}
