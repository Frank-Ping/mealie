import { Link } from "react-router-dom";
import { Avatar, Card, CardHeader, Typography } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";

interface Props {
  icon?: string;
  minWidth?: string;
  to?: string;
}

export default function StatsCards({ icon = null, minWidth = "", to = null }: Props) {
  const props = /* props via generated interface + destructured signature */

  // icons imported directly (was $globals)

  const activeIcon = computed(() => {
    return icon ?? icons.primary;
  });

  return (
    <>
  <Card min-width={minWidth} to={to} hover={to ? true : false}>
    <div className="d-flex flex-no-wrap">
      <Avatar className="ml-3 mr-0 mt-3" color="primary" size="36">
        {/* WF4-REVIEW: icon name resolves via lib/icons */}
        <MdiIcon name={activeIcon} color="white" className="pa-1" size="x-large" />
      </Avatar>
      <div>
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="text-subtitle-1 pt-2 pb-2">
          <slot name="title" />
        </CardHeader>
        {/* WF4-REVIEW: or CardHeader subheader */}
        <Typography variant="body2" color="text.secondary" className="pb-2">
          <slot name="value" />
        </Typography>
      </div>
    </div>
  </Card>
    </>
  );
}
