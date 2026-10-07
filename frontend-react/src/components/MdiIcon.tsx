import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";
import { icons } from "@/lib/icons";

// MUI renders the same @mdi/js path data the Vue app's Vuetify icons used —
// icon names are stable across the rewrite (D10).
export default function MdiIcon({ name, ...props }: { name: string } & SvgIconProps) {
  const path = (icons as unknown as Record<string, string>)[name] ?? "";
  return (
    <SvgIcon {...props}>
      <path d={path} />
    </SvgIcon>
  );
}
