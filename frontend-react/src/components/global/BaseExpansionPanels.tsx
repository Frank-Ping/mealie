import { useState } from "react";
import { Box } from "@mui/material";

interface Props {
  startOpen?: boolean;
}

export default function BaseExpansionPanels({ startOpen = false }: Props) {
  /* props via destructured signature (was withDefaults(defineProps<Props>) */

  const [open, setOpen] = useState(startOpen ? [0] : []);

  return (
    <>
  {/* WF4-REVIEW: wrapper — accordion group semantics */}
  <Box value={open} onChange={setOpen} rounded>
    <slot />
  </Box>
    </>
  );
}
