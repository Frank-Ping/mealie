import { Divider } from "@mui/material";

interface Props {
  width?: string;
  thickness?: string;
  color?: string;
}

export default function BaseDivider({ width = "100px", thickness = "2px", color = "accent" }: Props) {
  /* props via generated interface + destructured signature */

  return (
    <>
  <Divider width={width} className={color} style={`border-width: ${thickness} !important`} />
    </>
  );
}
