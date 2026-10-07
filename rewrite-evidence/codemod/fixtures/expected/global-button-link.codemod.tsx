import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import MdiIcon from "@/components/MdiIcon";

interface Props {
  to: string;
  text: string;
  icon?: string;
}

export default function ButtonLink({ to, text, icon = "" }: Props) {
  /* props via generated interface + destructured signature */

  return (
    <>
  <div>
    <Button variant="outlined" className="rounded-xl my-1 mx-1" component={Link} to={to}>
      {(icon != '') ? (
        /* WF4-REVIEW: icon name resolves via lib/icons; dropped Vuetify-only prop "start" on <v-icon> */
        <MdiIcon name={icon} />
      ) : null}
      {text}
    </Button>
  </div>
    </>
  );
}
