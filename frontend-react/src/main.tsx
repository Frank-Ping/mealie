import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router";
import { CssBaseline, ThemeProvider } from "@mui/material";
import RecipeChips from "./generated/RecipeChips";
import { sampleTheme } from "./infra/ui";
import "./infra/utilities.css";

function Samples() {
  return <main><h1>WF5 sample harness</h1><p>This checks generated components, not a migrated Mealie application.</p>
    <RecipeChips items={[{ name: "Recipes", id: "sample-category", slug: "recipes" }]} />
    <Link to="/checks">Checks</Link></main>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><ThemeProvider theme={sampleTheme}><CssBaseline />
  <BrowserRouter><Routes><Route path="/" element={<Samples />} /><Route path="/checks" element={<p>See saved Gate 2 results.</p>} /></Routes></BrowserRouter>
</ThemeProvider></StrictMode>);
