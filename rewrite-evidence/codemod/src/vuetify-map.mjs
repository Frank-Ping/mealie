// Vuetify -> MUI mapping table (subset implemented per rules catalog §6).
// Each entry: name = JSX component, from = MUI import source (null = local helper),
// dropProps = Vuetify-only props removed with a WF4-REVIEW marker,
// propMap = renamed props, note = review hint attached to output.

export const componentMap = {
  "v-btn": { name: "Button", dropProps: [], propMap: {}, note: null },
  "v-chip": { name: "Chip", dropProps: ["dark"], propMap: {}, note: null },
  "v-icon": { name: "MdiIcon", from: "@/components/MdiIcon", dropProps: ["start", "end"], propMap: {}, note: "icon name resolves via lib/icons" },
  "v-app": { name: "Box", dropProps: ["dark"], propMap: {}, note: "app shell — see rules §2" },
  "v-main": { name: "Box", staticProps: { component: "main" }, dropProps: [], propMap: {}, note: null },
  "v-scroll-x-transition": { name: "Slide", staticProps: { in: "{{true}}" }, dropProps: [], propMap: {}, note: "transition direction/appear semantics — MUI Slide needs explicit in" },
  "v-card": { name: "Card", dropProps: [], propMap: {}, note: null },
  "v-card-text": { name: "CardContent", dropProps: [], propMap: {}, note: null },
  "v-card-title": { name: "CardHeader", dropProps: [], propMap: {}, note: "title moves to prop" },
  "v-card-actions": { name: "CardActions", dropProps: [], propMap: {}, note: null },
  "v-divider": { name: "Divider", dropProps: [], propMap: {}, note: null },
  "v-container": { name: "Container", dropProps: [], propMap: { fluid: "maxWidth={false}" }, note: null },
  "v-row": { name: "Grid", staticProps: { container: true }, dropProps: [], propMap: {}, note: null },
  "v-col": { name: "Grid", dropProps: [], propMap: {}, note: "cols/md → size={{}}" },
  "v-spacer": { name: "Box", staticProps: { sx: "{{ flexGrow: 1 }}" }, dropProps: [], propMap: {}, note: null },
  "v-text-field": { name: "TextField", dropProps: [], propMap: {}, note: "rules/error-messages" },
  "v-select": { name: "TextField", staticProps: { select: true }, dropProps: [], propMap: {}, note: "items API" },
  "v-checkbox": { name: "FormControlLabel", dropProps: [], propMap: {}, note: "wraps Checkbox" },
  "v-switch": { name: "FormControlLabel", dropProps: [], propMap: {}, note: "wraps Switch" },
  "v-textarea": { name: "TextField", staticProps: { multiline: true }, dropProps: [], propMap: {}, note: null },
  "v-list": { name: "List", dropProps: [], propMap: {}, note: null },
  "v-list-item": { name: "ListItem", dropProps: [], propMap: {}, note: null },
  "v-list-item-title": { name: "ListItemText", dropProps: [], propMap: {}, note: "primary" },
  "v-list-item-subtitle": { name: "ListItemText", dropProps: [], propMap: {}, note: "secondary" },
  "v-menu": { name: "Menu", dropProps: [], propMap: {}, note: "activator pattern [J]" },
  "v-tooltip": { name: "Tooltip", dropProps: [], propMap: {}, note: null },
  "v-alert": { name: "Alert", dropProps: [], propMap: { type: "severity" }, note: null },
  "v-dialog": { name: "Dialog", dropProps: [], propMap: {}, note: "v-model → open/onClose" },
  "v-snackbar": { name: "Snackbar", dropProps: [], propMap: {}, note: null },
  "v-img": { name: "Box", staticProps: { component: "img" }, dropProps: [], propMap: {}, note: "cover → objectFit" },
  "v-avatar": { name: "Avatar", dropProps: [], propMap: {}, note: null },
  "v-badge": { name: "Badge", dropProps: [], propMap: {}, note: null },
  "v-toolbar": { name: "Toolbar", dropProps: [], propMap: {}, note: null },
  "v-toolbar-title": { name: "Typography", staticProps: { variant: "h6" }, dropProps: [], propMap: {}, note: null },
  "v-sheet": { name: "Paper", dropProps: [], propMap: {}, note: null },
  "v-progress-linear": { name: "LinearProgress", dropProps: [], propMap: {}, note: null },
  "v-progress-circular": { name: "CircularProgress", dropProps: [], propMap: {}, note: null },
  "v-form": { name: "form", dropProps: [], propMap: {}, note: "validation semantics [J]" },
};

// Vuetify props that never map 1:1 and get dropped with a review marker.
export const globalDropProps = ["dark"];

export function mapComponent(tag) {
  return componentMap[tag] ?? null;
}
