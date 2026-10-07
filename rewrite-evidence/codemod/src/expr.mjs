// Shared expression transforms. `ctx` carries identifiers discovered in the script:
//   stateIds: Map(refName -> setterName)   refs rewritten to useState
//   derivedIds: Set(computedName)          computed rewritten to useMemo
//   emits: Map('item-selected' -> 'onItemSelected')
//   destructureProps: bool                 props.x -> x

export function camelize(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function emitToProp(name) {
  const c = camelize(name);
  return "on" + c.charAt(0).toUpperCase() + c.slice(1);
}

export function setterFor(name) {
  return "set" + name.charAt(0).toUpperCase() + name.slice(1);
}

// Strip `.value` reads everywhere — refs do not exist in the React version.
// Assignments (`x.value = …`) must be rewritten by the caller BEFORE calling this.
export function stripValueReads(code, ctx) {
  let out = code;
  for (const name of ctx?.stateIds?.keys?.() ?? []) {
    out = out.replace(new RegExp(`\\b${name}\\.value\\b`, "g"), name);
  }
  // generic member chains like auth.user.value?.x (refs leaked from composables)
  out = out.replace(/\.value(?=\?|\.|,|\)|\]|}|\s|$|;)/g, "");
  return out;
}

export function transformExpr(code, ctx = {}) {
  let out = code;
  if (out.includes("$t(")) ctx.needsTranslation = true;
  out = out.replace(/\$t\(/g, "t(");
  // $emit('x', a) → onX?.(a): emit props are optional, and Vue's $emit is a no-op
  // without listeners — the optional call preserves that safety.
  out = out.replace(/\$emit\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*)?/g, (_, ev) => `${emitToProp(ev)}?.(`);
  out = stripValueReads(out, ctx);
  if (ctx.destructureProps) {
    out = out.replace(/\bprops\./g, "");
  }
  return out.trim();
}
