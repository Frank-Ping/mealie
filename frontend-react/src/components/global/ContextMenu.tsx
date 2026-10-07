import { Button, List, ListItem, ListItemText } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import type { ContextMenuItem } from "@/composables/use-context-presents";

interface Props {
  items: unknown[];
  menuTop?: boolean;
}

export default function ContextMenu({ items, menuTop = true }: Props) {
  /* props via generated interface + destructured signature */

  return (
    <>
  {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
  <VMenu offset-y start bottom={!menuTop} nudge-bottom={!menuTop ? '5' : '0'} top={menuTop} nudge-top={menuTop ? '5' : '0'} allow-overflow close-delay="125" content-class="d-print-none">
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      {/* WF4-REVIEW: dropped Vuetify-only prop "dark" on <v-btn> */}
      <Button size="small" icon={icons.dotsVertical} variant="text" {...(props)} onClick={(e) => { e.preventDefault(); ; }} />
    </>
    <List density="compact">
      {items.map((item, index) => (
        /* WF4-REVIEW: @click → ListItemButton */
        <ListItem key={index} onClick={$emit(item.event)}>
          {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
          <>
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={item.icon} color={item.color ? item.color : undefined} />
          </>
          {/* WF4-REVIEW: content → primary prop */}
          <ListItemText>
            {item.title}
          </ListItemText>
        </ListItem>
      ))}
    </List>
  </VMenu>
    </>
  );
}
