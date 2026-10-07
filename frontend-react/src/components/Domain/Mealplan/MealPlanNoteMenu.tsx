import { useTranslation } from "react-i18next";
import { Button, List, ListItem, ListItemText } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";

export default function MealPlanNoteMenu() {
  const { t } = useTranslation();

  defineEmits<{
    "mealplan-remove": [];
    "mealplan-edit": [];
  }>();

  return (
    <>
  {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
  <VMenu active-class="pa-0" offset-y top>
    <template>
      <Button icon color="secondary" {...(hoverProps)} className="ml-auto">
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={$globals.icons.dotsHorizontal} />
      </Button>
    </template>
    <List density="compact">
      {[
          {
            text: t('meal-plan.remove-from-plan'),
            icon: $globals.icons.calendarRemove,
            event: 'mealplan-remove',
          },
          {
            text: t('meal-plan.edit-meal-plan'),
            icon: $globals.icons.calendarEdit,
            event: 'mealplan-edit',
          },
        ].map((child, idx) => (
        <template key={idx}>
          {/* WF4-REVIEW: @click → ListItemButton */}
          <ListItem density="compact" prepend-icon={child.icon} onClick={$emit(child.event as any)}>
            {/* WF4-REVIEW: content → primary prop */}
            <ListItemText>
              {child.text}
            </ListItemText>
          </ListItem>
        </template>
      ))}
    </List>
  </VMenu>
    </>
  );
}
