import { Button, Card, CardContent } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";

interface Props {
  small?: boolean;
  right?: boolean;
}

export default function HelpIcon({ small = false, right = false }: Props) {
  /* props via generated interface + destructured signature */

  return (
    <>
  <div className="text-center">
    {/* WF4-REVIEW: unmapped <v-menu> — judgement component, convert manually [J] */}
    <VMenu top offset-y right={right} left={!right} open-on-hover>
      <template>
        <Button size={small ? 'small' : undefined} icon {...(props)} variant="flat" onClick={(e) => { e.stopPropagation(); ; }}>
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={$globals.icons.help} small={small} />
        </Button>
      </template>
      <Card max-width="300px">
        <CardContent>
          <slot />
        </CardContent>
      </Card>
    </VMenu>
  </div>
    </>
  );
}
