import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, CardContent, List, ListItem, ListItemText, TextField, form } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import { useI18n, useNuxtApp } from "#imports";
import type { RecipeTimelineEventOut } from "@/lib/api/types/recipe";

export interface TimelineContextMenuIncludes {
  edit: boolean;
  delete: boolean;
}

export interface ContextMenuItem {
  title: string;
  icon: string;
  color: string | undefined;
  event: string;
}

export default function RecipeTimelineContextMenu({ onDelete, onUpdate }: Props) {
  const { t } = useTranslation();

  const props = defineProps<{
    useItems?: TimelineContextMenuIncludes;
    appendItems?: ContextMenuItem[];
    leadingItems?: ContextMenuItem[];
    menuTop?: boolean;
    fab?: boolean;
    elevation?: number | null;
    color?: string;
    event: RecipeTimelineEventOut;
    menuIcon?: string | null;
  }>();

  const emit = /* emits → props: onDelete, onUpdate */

  const [domEditEventForm, setDomEditEventForm] = useState(undefined);
  const [recipeEventEditDialog, setRecipeEventEditDialog] = useState(false);
  const [recipeEventDeleteDialog, setRecipeEventDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const i18n = useI18n();
  // icons imported directly (was $globals)

  const defaultItems: { [key: string]: ContextMenuItem } = {
    edit: {
      title: i18n.t("general.edit"),
      icon: icons.edit,
      color: undefined,
      event: "edit",
    },
    delete: {
      title: i18n.t("general.delete"),
      icon: icons.delete,
      color: "error",
      event: "delete",
    },
  };

  const menuItems = computed(() => {
    const items: ContextMenuItem[] = [];
    const useItems = props.useItems ?? { edit: true, delete: true };
    for (const [key, value] of Object.entries(useItems)) {
      if (value) {
        const item = defaultItems[key];
        if (item) items.push(item);
      }
    }
    return [
      ...items,
      ...(props.leadingItems ?? []),
      ...(props.appendItems ?? []),
    ];
  });

  const icon = useMemo(() => props.menuIcon || icons.dotsVertical, []); // WF4-REVIEW: dependency array

  const [localEvent, setLocalEvent] = useState({ ...props.event });
  /* WF4-REVIEW [J] */ watch(() => props.event, (val) => {
    setLocalEvent({ ...val });
  });

  function openEditDialog() {
    setLocalEvent({ ...props.event });
    setRecipeEventEditDialog(true);
  }
  function openDeleteDialog() {
    setRecipeEventDeleteDialog(true);
  }
  function contextMenuEventHandler(eventKey: string) {
    if (eventKey === "edit") {
      openEditDialog();
      setLoading(false);
      return;
    }
    if (eventKey === "delete") {
      openDeleteDialog();
      setLoading(false);
      return;
    }
    emit(eventKey as "delete" | "update");
    setLoading(false);
  }
  function submitEdit() {
    emit("update", { ...localEvent });
    setRecipeEventEditDialog(false);
  }

  return (
    <>
  <div className="text-center">
    <BaseDialog value={recipeEventEditDialog} onChange={setRecipeEventEditDialog} title={t('recipe.edit-timeline-event')} icon={$globals.icons.edit} can-submit disable-submit-on-enter submit-text={t('general.save')} onSubmit={submitEdit}>
      <CardContent>
        {/* WF4-REVIEW: validation semantics [J] */}
        <form ref="domEditEventForm" onSubmit={(e) => { e.preventDefault(); ; }}>
          {/* WF4-REVIEW: rules/error-messages → error+helperText; v-model on complex expression "localEvent.subject" [J] */}
          <TextField {/* WF4-REVIEW: v-model localEvent.subject */} label={t('general.subject')} />
          {/* WF4-REVIEW: v-model on complex expression "localEvent.eventMessage" [J] */}
          <TextField multiline {/* WF4-REVIEW: v-model localEvent.eventMessage */} label={t('general.message')} rows="4" />
        </form>
      </CardContent>
    </BaseDialog>
    <BaseDialog value={recipeEventDeleteDialog} onChange={setRecipeEventDeleteDialog} bottom-sheet title={t('events.delete-event')} color="error" icon={$globals.icons.alertCircle} can-confirm onConfirm={onDelete?.()}>
      <CardContent>
        {t('events.event-delete-confirmation')}
      </CardContent>
    </BaseDialog>
    {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
    <VMenu offset-y start bottom={!props.menuTop} nudge-bottom={!props.menuTop ? '5' : '0'} top={props.menuTop} nudge-top={props.menuTop ? '5' : '0'} allow-overflow close-delay="125" content-class="d-print-none">
      <template>
        <Button className={{ 'rounded-circle': props.fab }} x-small={props.fab} elevation={props.elevation ?? undefined} color={props.color} icon={!props.fab} {...(btnProps)} onClick={(e) => { e.preventDefault(); ; }}>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={icon} />
        </Button>
      </template>
      <List density="compact">
        {menuItems.map((item, index) => (
          /* WF4-REVIEW: @click → ListItemButton */
          <ListItem key={index} onClick={contextMenuEventHandler(item.event)}>
            <template>
              {/* WF4-REVIEW: icon name resolves via lib/icons */}
              <MdiIcon name={item.icon} color={item.color} />
            </template>
            {/* WF4-REVIEW: content → primary prop */}
            <ListItemText>
              {item.title}
            </ListItemText>
          </ListItem>
        ))}
      </List>
    </VMenu>
  </div>
    </>
  );
}
