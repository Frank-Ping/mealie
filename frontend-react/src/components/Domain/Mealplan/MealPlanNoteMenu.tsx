import { useTranslation } from "react-i18next";
import { Button, List, ListItem, ListItemText } from "@mui/material";
import { icons } from "@/lib/icons";
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
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      <Button icon color="secondary" {...(hoverProps)} className="ml-auto">
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={icons.dotsHorizontal} />
      </Button>
    </>
    <List density="compact">
      {[
          {
            text: t('meal-plan.remove-from-plan'),
            icon: icons.calendarRemove,
            event: 'mealplan-remove',
          },
          {
            text: t('meal-plan.edit-meal-plan'),
            icon: icons.calendarEdit,
            event: 'mealplan-edit',
          },
        ].map((child, idx) => (
        <>
          {/* WF4-REVIEW: @click → ListItemButton */}
          <ListItem density="compact" prepend-icon={child.icon} onClick={$emit(child.event as any)}>
            {/* WF4-REVIEW: content → primary prop */}
            <ListItemText>
              {child.text}
            </ListItemText>
          </ListItem>
        </>
      ))}
    </List>
  </VMenu>
    </>
  );
}
