// Shared expression transforms. `ctx` carries identifiers discovered in the script:
//   stateIds: Map(refName -> setterName)   refs rewritten to useState
//   derivedIds: Set(computedName)          computed rewritten to useMemo
//   emits: Map('item-selected' -> 'onItemSelected')
//   destructureProps: bool                 props.x -> x

export function camelize(s) {
  return s.replace(/[-_:]([a-zA-Z])/g, (_, c) => c.toUpperCase());
}

export function emitToProp(name) {
  // 'update:modelValue' → onChange; 'update:dialog' → onDialogChange; 'item-selected' → onItemSelected
  const upd = name.match(/^update:(.+)$/);
  if (upd) {
    const c = camelize(upd[1]);
    return c === "modelValue" ? "onChange" : `on${c.charAt(0).toUpperCase() + c.slice(1)}Change`;
  }
  const c = camelize(name);
  return "on" + c.charAt(0).toUpperCase() + c.slice(1);
}

export function setterFor(name) {
  return "set" + name.charAt(0).toUpperCase() + name.slice(1);
}

// Reserved words can't be destructured as variables (`if (delete)` is invalid).
const RESERVED = new Set(["delete", "default", "function", "class", "var", "let", "const", "new", "return", "if", "else", "switch", "case", "for", "while", "do", "import", "export", "extends", "super", "this", "typeof", "void", "with", "yield", "static", "enum", "implements", "interface", "package", "private", "protected", "public", "arguments", "eval", "instanceof", "in", "of", "try", "catch", "finally", "throw", "debugger", "break", "continue"]);

export function safeIdent(name) {
  return RESERVED.has(name) ? `${name}_` : name;
}

// Rename destructured reserved-word props in code bodies/expressions.
// Lookbehind skips property accesses and string contents (t('general.delete'));
// lookahead skips object keys and interface lines (`delete:` / `delete?:`).
export function applyPropsRename(code, ctx) {
  let out = code;
  for (const [from, to] of Object.entries(ctx.propsRename ?? {})) {
    out = out.replace(new RegExp(`(?<![\\w$.'"\`])${from}(?![\\w$?:])`, "g"), to);
  }
  return out;
}

// Strip `.value` reads for identifiers the codemod itself converted (stateIds:
// refs/models, derivedIds: computeds) — everything else keeps its `.value` as a
// VISIBLE residual. A blanket strip is the plausible-but-wrong failure mode:
// domain objects legitimately have `.value` properties (QueryFilterBuilder).
export function stripValueReads(code, ctx) {
  let out = code;
  for (const name of ctx?.stateIds?.keys?.() ?? []) {
    out = out.replace(new RegExp(`\\b${name}\\.value\\b`, "g"), name);
  }
  for (const name of ctx?.derivedIds ?? []) {
    out = out.replace(new RegExp(`\\b${name}\\.value\\b`, "g"), name);
  }
  // `?.value` loses `.value` → `??.` artifact
  out = out.replace(/\?\?\./g, "?.");
  return out;
}

export function transformExpr(code, ctx = {}) {
  let out = code;
  if (out.includes("$globals.icons")) { ctx.needsIcons = true; out = out.replace(/\$globals\.icons/g, "icons"); }
  if (/\$[dn]\(/.test(out)) { ctx.needsFormatters = true; out = out.replace(/\$d\(/g, "d(").replace(/\$n\(/g, "n("); }
  if (out.includes("$t(")) ctx.needsTranslation = true;
  out = out.replace(/\$t\(/g, "t(");
  // $emit('x', a) → onX?.(a): emit props are optional, and Vue's $emit is a no-op
  // without listeners — the optional call preserves that safety.
  out = out.replace(/\$emit\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*)?/g, (_, ev) => `${emitToProp(ev)}?.(`);
  // bare emit('x', a) from `const emit = defineEmits(...)`
  for (const [ev, prop] of ctx.emits ?? new Map()) {
    out = out.replace(new RegExp(`\\bemit\\(\\s*['"\`]${ev}['"\`]\\s*(?:,\\s*)?`, "g"), `${prop}?.(`);
  }
  out = stripValueReads(out, ctx);
  if (ctx.destructureProps) {
    out = out.replace(/\bprops\./g, "");
  }
  out = applyPropsRename(out, ctx);
  return out.trim();
}
