import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardContent, FormControlLabel, TextField, form } from "@mui/material";
import { icons } from "@/lib/icons";
import { useUserApi } from "@/composables/api";
import { useCategoryStore, useTagStore, useToolStore } from "@/composables/store";
import { type RecipeOrganizer, Organizer } from "@/lib/api/types/non-generated";

interface Props {
  color?: string | null;
  tagDialog?: boolean;
  itemType?: RecipeOrganizer;
}

export default function RecipeOrganizerDialog({ color = null, tagDialog = true, itemType = "category" as RecipeOrganizer }: Props) {
  const { t } = useTranslation();

  // icons imported directly (was $globals)

  const CREATED_ITEM_EVENT = "created-item";


  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const emit = defineEmits<{
    "created-item": [item: any];
  }>();

  const dialog = defineModel<boolean>({ default: false });

  const i18n = useI18n();

  const [name, setName] = useState("");
  const [onHand, setOnHand] = useState(false);

  /* WF4-REVIEW [J] */ watch(
    dialog,
    (val: boolean) => {
      if (!val) setName("");
    },
  );

  const userApi = useUserApi();

  const store = (() => {
    switch (itemType) {
      case Organizer.Tag:
        return useTagStore();
      case Organizer.Tool:
        return useToolStore();
      default:
        return useCategoryStore();
    }
  })();

  const properties = useMemo(() =>  {
    switch (itemType, []); // WF4-REVIEW: dependency array {
      case Organizer.Tag:
        return {
          title: i18n.t("tag.create-a-tag"),
          label: i18n.t("tag.tag-name"),
          icon: icons.tags,
          api: userApi.tags,
        };
      case Organizer.Tool:
        return {
          title: i18n.t("tool.create-a-tool"),
          label: i18n.t("tool.tool-name"),
          icon: icons.potSteam,
          api: userApi.tools,
        };
      default:
        return {
          title: i18n.t("category.create-a-category"),
          label: i18n.t("category.category-name"),
          icon: icons.categories,
          api: userApi.categories,
        };
    }
  });

  const rules = {
    required: (val: string) => !!val || (i18n.t("general.a-name-is-required") as string),
  };

  async function select() {
    if (store) {
      // @ts-expect-error the same state is used for different organizer types, which have different requirements
      const newItem = await store.actions.createOne({ name: name, onHand: onHand });
      emit(CREATED_ITEM_EVENT, newItem);
    }
    dialog = false;
  }

  return (
    <>
  <div>
    <BaseDialog value={dialog} onChange={/* WF4-REVIEW: setter */ setDialog} width="500" title={properties.title} icon={properties.icon} can-submit submit-disabled={!name} onSubmit={select}>
      {/* WF4-REVIEW: validation semantics [J] */}
      <form>
        <CardContent>
          {/* WF4-REVIEW: rules/error-messages → error+helperText */}
          <TextField value={name} onChange={setName} label={properties.label} rules={[rules.required]} autofocus />
          {(itemType === Organizer.Tool) ? (
            /* WF4-REVIEW: control={<Checkbox/>} + label prop */
            <FormControlLabel value={onHand} onChange={setOnHand} label={t('tool.on-hand')} />
          ) : null}
        </CardContent>
      </form>
    </BaseDialog>
  </div>
    </>
  );
}
