import { Box, Button, Grid } from "@mui/material";
import { icons } from "@/lib/icons";
import MdiIcon from "@/components/MdiIcon";

export default function AppFooter() {
  return (
    <>
  <Box component="footer" color="primary" padless app>
    <Grid container justify="center" align="center" density="comfortable" no-gutters>
      {/* WF4-REVIEW: cols/sm/md/lg → size={{ xs, sm, md }} */}
      <Grid className="py-2 text-center white--text" cols="12">
        <Button color="white" icon href="https://github.com/mealie-recipes/mealie" target="_blank">
          {/* WF4-REVIEW: icon name resolves via lib/icons */}
          <MdiIcon name={icons.github} />
        </Button>
        {new Date().getFullYear()}
        —
        <strong>
          Mealie
        </strong>
      </Grid>
    </Grid>
  </Box>
    </>
  );
}
