import { useMemo } from "react";
import { Button, Tooltip } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";
import type { ButtonOption } from "./BaseMenu";
import BaseMenu from "./BaseMenu";

interface Props {
  buttons: unknown[];
  large?: boolean;
  stretch?: boolean;
}

export default function BaseButtonGroup({ buttons, large = true, stretch = false }: Props) {
  const props = /* props via generated interface + destructured signature */

  const maxButtonWidth = useMemo(() => `${100 / buttons.length}%`, []); // WF4-REVIEW: dependency array

  return (
    <>
  {/* WF4-REVIEW: unmapped <v-item-group> — judgement component, convert manually [J] */}
  <VItemGroup>
    {buttons.map(btn => (
      <template>
        {(btn.children) ? (
          <BaseMenu key={'menu-' + btn.event} large={large} activator={btn} children={btn.children} onMenu={(childEvent) => $emit(childEvent)} />
        ) : (
          /* WF4-REVIEW: activator slot variants [J] */
          <Tooltip key={'btn-' + btn.event} open-delay="200" transition="slide-y-reverse-transition" density="compact" location="bottom" content-class="text-caption">
            <template>
              <Button tile icon color={btn.color} large={large} disabled={btn.disabled} style={stretch ? `width: ${maxButtonWidth};` : ''} variant="plain" {...(tooltipProps)} onClick={$emit(btn.event)}>
                {/* WF4-REVIEW: icon name resolves via lib/icons */}
                <MdiIcon name={btn.icon} />
              </Button>
            </template>
            <span>
              {btn.text}
            </span>
          </Tooltip>
        )}
      </template>
    ))}
  </VItemGroup>
    </>
  );
}
