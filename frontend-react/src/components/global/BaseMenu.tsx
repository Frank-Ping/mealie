import { Button, Divider, List, ListItem, ListItemText } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";

export interface ButtonOption {
  icon?: string;
  color?: string;
  text: string;
  event: string;
  children?: ButtonOption[];
  disabled?: boolean;
  divider?: boolean;
  loading?: boolean;
}

export default function BaseMenu({ large = true, stretch = false }: Props) {
  defineEmits<{
    menu: [string];
  }>();

  /* props via destructured signature (was withDefaults(defineProps<?>) */

  return (
    <>
  {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
  <VMenu key={'menu-' + activator.event} active-class="pa-0" start max-height="80vh" style={stretch ? 'width: 100%;' : ''}>
    {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
    <>
      <slot name="activator" {...({ props: hoverProps })}>
        <Button tile large={large} icon color={activator.color} variant="plain" {...(hoverProps)} loading={activator.loading || children.some(({ loading }) => loading)}>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={activator.icon} />
        </Button>
      </slot>
    </>
    <List density="compact">
      {children.map((child, idx) => (
        <>
          {(child.children) ? (
            <BaseMenu activator={child} children={child.children} open-on-hover open-on-focus open-on-click submenu onMenu={(childEvent) => onMenu?.(childEvent)}>
              {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
              <>
                {/* WF4-REVIEW: @click → ListItemButton */}
                <ListItem density="compact" prepend-icon={child.icon} disabled={child.disabled} {...(hoverProps)}>
                  {/* WF4-REVIEW: content → primary prop */}
                  <ListItemText>
                    {child.text}
                  </ListItemText>
                </ListItem>
              </>
            </BaseMenu>
          ) : (
            /* WF4-REVIEW: @click → ListItemButton */
            <ListItem density="compact" prepend-icon={child.icon} disabled={child.disabled} onClick={onMenu?.(child.event)}>
              {/* WF4-REVIEW: content → primary prop */}
              <ListItemText>
                {child.text}
              </ListItemText>
            </ListItem>
          )}
          {(child.divider) ? (
            <Divider key={`divider-${idx}`} className="my-1" />
          ) : null}
        </>
      ))}
    </List>
  </VMenu>
    </>
  );
}
