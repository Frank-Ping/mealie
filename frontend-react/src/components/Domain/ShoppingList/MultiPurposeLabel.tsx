import { Chip } from "@mui/material";
import type { MultiPurposeLabelSummary } from "@/lib/api/types/recipe";

export default function MultiPurposeLabel() {
  defineProps<{
    label: MultiPurposeLabelSummary;
  }>();

  return (
    <>
  <Chip {...($attrs)} label variant="flat" color={label.color || undefined}>
    <span style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">
      {label.name}
    </span>
  </Chip>
    </>
  );
}
