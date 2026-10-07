import { useState } from "react";
import { Button } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";
import type { ShoppingListMultiPurposeLabelOut } from "@/lib/api/types/household";

export default function MultiPurposeLabelSection() {
  const props = defineProps<{
    useColor?: boolean;
  }>();
  const modelValue = defineModel<ShoppingListMultiPurposeLabelOut>({ required: true });

  const [labelColor, setLabelColor] = useState(props.useColor ? modelValue.label.color : undefined);

  return (
    <>
  <div className="d-flex justify-space-between align-center mx-2">
    <div className="handle">
      <span className="mr-2">
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={icons.tags} color={labelColor} />
      </span>
      {modelValue.label.name}
    </div>
    <div style="min-width: 72px" className="ml-auto text-right">
      {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
      <VMenu offset-x start min-width="125px">
        {/* WF4-REVIEW: <template> slot — convert to render props/children manually [J] */}
        <>
          <Button size="small" variant="text" className="ml-2 handle" icon {...(hoverProps)}>
            {/* WF4-REVIEW: icon name resolves via lib/icons */}
            <MdiIcon name={icons.arrowUpDown} />
          </Button>
        </>
      </VMenu>
    </div>
  </div>
    </>
  );
}
