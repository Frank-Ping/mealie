import { Link } from "react-router-dom";
import { Box, Button, Card, CardActions, CardContent, CardHeader, Divider } from "@mui/material";

interface Props {
  link: Record<string, unknown>;
  image?: string;
}

interface LinkProp {
  text: string;
  url?: string;
  to: string;
}

export default function UserProfileLinkCard({ link, image = "" }: Props) {
  /* props via generated interface + destructured signature */

  return (
    <>
  <Card variant="outlined" style="border-color: lightgrey;" to={link.to} height="100%" className="d-flex flex-column mt-4 pa-2">
    {($vuetify.display.smAndDown) ? (
      <div className="pa-2 mx-auto">
        {/* WF4-REVIEW: cover → objectFit */}
        <Box component="img" width="150px" height="125" src={image} />
      </div>
    ) : null}
    <div className="d-flex justify-space-between">
      <div>
        {/* WF4-REVIEW: title text moves to the title prop */}
        <CardHeader className="text-subtitle-1 pb-0">
          <slot name="title" />
        </CardHeader>
        <div className="d-flex justify-center align-center">
          <CardContent className="d-flex flex-row mb-auto">
            <slot name="default" />
          </CardContent>
        </div>
      </div>
      {($vuetify.display.mdAndUp) ? (
        <div className="py-2 px-10 my-auto">
          {/* WF4-REVIEW: cover → objectFit */}
          <Box component="img" width="150px" height="125" src={image} />
        </div>
      ) : null}
    </div>
    <Box sx={ flexGrow: 1 } />
    <Divider />
    <CardActions>
      <Button variant="text" color="info" component={Link} to={link.to}>
        {link.text}
      </Button>
    </CardActions>
  </Card>
    </>
  );
}
