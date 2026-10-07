// Vuetify -> MUI mapping table, extended for the Phase C full run.
// Covers every [M]/[S] component from the rules catalog §6. [J] components are
// deliberately ABSENT so they become marked placeholders (the burndown queue),
// never fake-converted.
//
// Entry fields:
//   name        JSX component name (required)
//   from        import source (default "@mui/material"; null = local helper, no import)
//   staticProps props always added (true = boolean, "str" = string attr, "{{expr}}" = JSX expr)
//   dropProps   Vuetify-only props removed (noted)
//   propMap     renamed props (value is the literal replacement prop text)
//   model       v-model target: { prop, handler } (default { value, onChange })
//   note        review hint emitted as a WF4-REVIEW marker next to the element

export const componentMap = {
  // --- buttons & actions ---
  "v-btn": { name: "Button" },
  "v-btn-toggle": { name: "ToggleButtonGroup", note: "value/selection API" },
  "v-fab": { name: "Fab" },
  "v-icon": { name: "MdiIcon", from: null, dropProps: ["start", "end"], note: "icon name resolves via lib/icons" },

  // --- cards & layout primitives ---
  "v-card": { name: "Card" },
  "v-card-text": { name: "CardContent" },
  "v-card-title": { name: "CardHeader", note: "title text moves to the title prop" },
  "v-card-subtitle": { name: "Typography", staticProps: { variant: "body2", color: "text.secondary" }, note: "or CardHeader subheader" },
  "v-card-actions": { name: "CardActions" },
  "v-sheet": { name: "Paper" },
  "v-divider": { name: "Divider" },
  "v-container": { name: "Container", propMap: { fluid: "maxWidth={false}" } },
  "v-row": { name: "Grid", staticProps: { container: true } },
  "v-col": { name: "Grid", note: "cols/sm/md/lg → size={{ xs, sm, md }}" },
  "v-spacer": { name: "Box", staticProps: { sx: "{{ flexGrow: 1 }}" } },
  "v-responsive": { name: "Box", note: "aspect-ratio → sx aspectRatio" },

  // --- app shell ---
  "v-app": { name: "Box", dropProps: ["dark"], note: "app shell — see rules §2" },
  "v-main": { name: "Box", staticProps: { component: "main" } },
  "v-footer": { name: "Box", staticProps: { component: "footer" } },
  "v-app-bar": { name: "AppBar" },
  "v-navigation-drawer": { name: "Drawer", note: "persistent/temporary variants" },
  "v-toolbar": { name: "Toolbar" },
  "v-toolbar-title": { name: "Typography", staticProps: { variant: "h6" } },
  "v-bottom-sheet": { name: "Drawer", staticProps: { anchor: "bottom" }, note: "swipeable?" },

  // --- form inputs ---
  "v-text-field": { name: "TextField", note: "rules/error-messages → error+helperText" },
  "v-textarea": { name: "TextField", staticProps: { multiline: true } },
  "v-select": { name: "TextField", staticProps: { select: true }, note: "items/item-title/item-value → MenuItem children" },
  "v-autocomplete": { name: "Autocomplete", note: "items → options/getOptionLabel; value wiring [S]" },
  "v-checkbox": { name: "FormControlLabel", note: "control={<Checkbox/>} + label prop" },
  "v-checkbox-btn": { name: "Checkbox" },
  "v-switch": { name: "FormControlLabel", note: "control={<Switch/>} + label prop" },
  "v-radio-group": { name: "RadioGroup" },
  "v-radio": { name: "FormControlLabel", note: "control={<Radio/>}" },
  "v-slider": { name: "Slider" },
  "v-rating": { name: "Rating" },
  "v-form": { name: "form", note: "validation semantics [J]" },
  "v-date-picker": { name: "DatePicker", from: "@mui/x-date-pickers", note: "value format + LocalizationProvider" },

  // --- data display ---
  "v-list": { name: "List" },
  "v-list-item": { name: "ListItem", note: "@click → ListItemButton" },
  "v-list-item-title": { name: "ListItemText", note: "content → primary prop" },
  "v-list-item-subtitle": { name: "ListItemText", note: "content → secondary prop" },
  "v-list-item-action": { name: "ListItemSecondaryAction" },
  "v-list-item-icon": { name: "ListItemIcon" },
  "v-chip": { name: "Chip", dropProps: ["dark"] },
  "v-badge": { name: "Badge", note: "content → badgeContent" },
  "v-avatar": { name: "Avatar" },
  "v-tooltip": { name: "Tooltip", note: "activator slot variants [J]" },
  "v-alert": { name: "Alert", propMap: { type: "severity" } },
  "v-banner": { name: "Alert", note: "full-width styling" },
  "v-skeleton-loader": { name: "Skeleton" },
  "v-img": { name: "Box", staticProps: { component: "img" }, note: "cover → objectFit" },
  "v-timeline": { name: "Timeline", from: "@mui/lab", note: "lab component" },
  "v-timeline-item": { name: "TimelineItem", from: "@mui/lab" },

  // --- feedback ---
  "v-dialog": { name: "Dialog", model: { prop: "open", handler: "onClose" }, note: "max-width/scrollable" },
  "v-snackbar": { name: "Snackbar", model: { prop: "open", handler: "onClose" } },
  "v-progress-linear": { name: "LinearProgress" },
  "v-progress-circular": { name: "CircularProgress" },
  "v-overlay": { name: "Backdrop", model: { prop: "open", handler: "onClose" } },

  // --- disclosure & navigation ---
  "v-expansion-panels": { name: "Box", note: "wrapper — accordion group semantics" },
  "v-expansion-panel": { name: "Accordion" },
  "v-expansion-panel-title": { name: "AccordionSummary" },
  "v-expansion-panel-text": { name: "AccordionDetails" },
  "v-tabs": { name: "Tabs" },
  "v-tab": { name: "Tab" },
  "v-breadcrumbs": { name: "Breadcrumbs" },
  "v-pagination": { name: "Pagination", model: { prop: "page", handler: "onChange" } },

  // --- transitions (MUI needs explicit `in`) ---
  "v-expand-transition": { name: "Collapse", staticProps: { in: "{true}" }, note: "transition semantics" },
  "v-fade-transition": { name: "Fade", staticProps: { in: "{true}" }, note: "transition semantics" },
  "v-slide-x-transition": { name: "Slide", staticProps: { in: "{true}" }, note: "transition semantics" },
  "v-scroll-x-transition": { name: "Slide", staticProps: { in: "{true}" }, note: "transition direction/appear semantics — MUI Slide needs explicit in" },

  // --- menus stay placeholder [J] on purpose: v-menu, v-data-table, v-stepper family,
  // --- v-virtual-scroll, v-hover, v-lazy, v-list-group, v-list-item-group, v-item-group,
  // --- v-treeview, v-window, v-number-input, v-file-input, v-empty-state, v-color-picker,
  // --- v-combobox (needs freeSolo decision per site)
};

// Vuetify props that never map 1:1 and get dropped with a review marker.
export const globalDropProps = ["dark"];

export function mapComponent(tag) {
  return componentMap[tag] ?? null;
}
