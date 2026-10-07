import { createTheme } from "@mui/material/styles";

// Port of frontend/app/plugins/theme.ts defaults. The runtime fetch of
// /api/app/about/theme arrives with the app-info provider (Phase D [J]).
// MUI has no "accent" palette slot by default — augment so converted files
// using color="accent" typecheck (Vuetify accent ≈ #007A99).

declare module "@mui/material/styles" {
  interface Palette {
    accent: Palette["primary"];
  }
  interface PaletteOptions {
    accent?: PaletteOptions["primary"];
  }
}
declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides {
    accent: true;
  }
}
declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    accent: true;
  }
}

export const theme = createTheme({
  palette: {
    primary: { main: "#E58325" },
    accent: { main: "#007A99" },
    secondary: { main: "#973542" },
    success: { main: "#43A047" },
    info: { main: "#1976d2" },
    warning: { main: "#FF6D00" },
    error: { main: "#EF5350" },
  },
});
