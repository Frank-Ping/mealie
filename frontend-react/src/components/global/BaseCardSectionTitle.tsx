import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";

interface Props {
  title: string;
  size?: string;
  icon?: string;
  section?: boolean;
}

type Size = "large" | "medium" | "small";

export default function BaseCardSectionTitle({ title, size = "large", icon = "", section = false }: Props) {
  /* props via generated interface + destructured signature */

  return (
    <>
  <Card color="background" flat className="pb-2" className={{
      'mt-8': section,
    }}>
    {/* WF4-REVIEW: title text moves to the title prop */}
    <CardHeader className={`text-title-${size} pl-0 py-0 d-flex align-center`} style="font-weight: normal;">
      <slot name="prepend-title" />
      {(icon) ? (
        /* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */
        <MdiIcon name={icon} size="small" />
      ) : null}
      {title}
      <slot name="append-title" />
    </CardHeader>
    {($slots.default) ? (
      <CardContent className="pt-2 pl-0">
        <p className="pb-0 mb-0">
          <slot />
        </p>
      </CardContent>
    ) : null}
    <Divider className="mt-1 mb-3" />
  </Card>
    </>
  );
}
