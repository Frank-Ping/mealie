// <script setup> / composable .ts -> React TS transforms (line/regex based v1).
import { stripValueReads, transformExpr, setterFor, emitToProp } from "./expr.mjs";
import { extractCall, splitArgs } from "./balanced.mjs";

const TYPE_MAP = { String: "string", Number: "number", Boolean: "boolean", Array: "unknown[]", Object: "Record<string, unknown>", Function: "(...args: unknown[]) => unknown" };

function splitTopLevel(s) {
  const parts = [];
  let depth = 0, cur = "", inStr = null;
  for (const ch of s) {
    if (inStr) { cur += ch; if (ch === inStr) inStr = null; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; cur += ch; continue; }
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseDefaults(objBody) {
  // "truncate: false, items: () => [], urlPrefix: \"categories\"" → [{key, value}]
  return splitTopLevel(objBody).map((pair) => {
    const m = pair.match(/^(\w+)\s*:\s*([\s\S]+)$/);
    if (!m) return null;
    let [, key, val] = m;
    const factory = val.match(/^\(\)\s*=>\s*([\s\S]+)$/);
    if (factory) val = factory[1];
    return { key, value: val.trim() };
  }).filter(Boolean);
}

export function transformScript(script, ctx) {
  const notes = [];
  let body = script;

  // ---- imports: collect, rewrite, drop vue ----
  const imports = [];
  body = body.replace(/import\s+(type\s+)?[\s\S]*?\s+from\s+["']([^"']+)["'];?/g, (whole, isType, src) => {
    if (src === "vue") { notes.push("dropped vue import (auto-imported APIs are explicit in React)"); return ""; }
    let out = src.replace(/^~\//, "@/").replace(/\.vue$/, "");
    imports.push(whole.replace(src, out));
    return "";
  });

  // ---- definePageMeta → route handle ----
  body = body.replace(/definePageMeta\(\s*(\{[\s\S]*?\})\s*\);?/g, (_, obj) => {
    ctx.hasPageMeta = true;
    return `export const handle = ${obj}; // WF4-REVIEW: merged into the route table (was definePageMeta)`;
  });

  // ---- withDefaults(defineProps<Props>(), {...}) via balanced scan ----
  let propsDestructure = null;
  body = (() => {
    const re = /(const\s+props\s*=\s*)?withDefaults\b/g;
    let out = "", last = 0, m;
    while ((m = re.exec(body))) {
      const callIdx = m.index + m[0].length - "withDefaults".length;
      const call = extractCall(body, callIdx);
      if (!call) continue;
      let end = call.end;
      if (body[end] === ";") end++;
      const [propsPart, defaultsPart] = splitArgs(call.args);
      const typeName = (propsPart ?? "").match(/defineProps<(\w+)>/)?.[1];
      const defBody = (defaultsPart ?? "").trim().replace(/^\{/, "").replace(/\}$/, "");
      const defaults = parseDefaults(defBody);
      propsDestructure = defaults.map((d) => `${d.key} = ${d.value}`).join(", ");
      ctx.destructureProps = true;
      out += body.slice(last, m.index) + `/* props via destructured signature (was withDefaults(defineProps<${typeName ?? "?"}>) */`;
      last = end;
      re.lastIndex = end;
    }
    return out + body.slice(last);
  })();

  // ---- plain defineProps<Props>() ----
  if (!propsDestructure) {
    const generic = body.match(/defineProps<(\w+)>\(\)/);
    if (generic) {
      const iface = body.match(new RegExp(`interface\\s+${generic[1]}\\s*\\{([\\s\\S]*?)\\}`));
      if (iface) {
        const keys = [...iface[1].matchAll(/^\s*(\w+)\??:/gm)].map((m) => m[1]);
        propsDestructure = keys.join(", ");
        ctx.destructureProps = true;
      }
      body = body.replace(/(const\s+\w+\s*=\s*)?defineProps<\w+>\(\);?/g, "/* props via destructured signature */");
    }
  }

  // ---- runtime defineProps({...}) → interface + destructure ----
  body = body.replace(/defineProps\(\s*\{([\s\S]*?)\}\s*\);?/g, (_, objBody) => {
    const entries = splitTopLevel(objBody).map((p) => p.match(/^(\w+)\s*:\s*\{([\s\S]*)\}$/)).filter(Boolean);
    const ifaceLines = [];
    const destructure = [];
    for (const [, key, attrs] of entries) {
      const typeM = attrs.match(/type:\s*(\w+)/);
      const tsType = TYPE_MAP[typeM?.[1]] ?? "unknown";
      const required = /required:\s*true/.test(attrs);
      const defM = attrs.match(/default:\s*([^,}]+)/);
      ifaceLines.push(`  ${key}${required ? "" : "?"}: ${tsType};`);
      destructure.push(defM ? `${key} = ${defM[1].trim()}` : key);
    }
    propsDestructure = destructure.join(", ");
    ctx.destructureProps = true;
    ctx.generatedPropsInterface = `interface Props {\n${ifaceLines.join("\n")}\n}`;
    return `/* props via generated interface + destructured signature */`;
  });

  // ---- defineEmits([...]) ----
  body = body.replace(/defineEmits\(\s*\[([\s\S]*?)\]\s*\);?/g, (_, list) => {
    const names = [...list.matchAll(/['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);
    for (const n of names) ctx.emits.set(n, emitToProp(n));
    return `/* emits → props: ${names.map((n) => emitToProp(n)).join(", ")} */`;
  });

  // ---- refs & computed via balanced-call scanning (regex truncation was the
  // root cause of the Phase C TS1xxx family) ----
  body = (() => {
    const declRe = /const\s+(\w+)\s*=\s*(ref|computed)\b/g;
    let out = "", last = 0, m;
    while ((m = declRe.exec(body))) {
      const kind = m[2];
      const callIdx = m.index + m[0].length - kind.length;
      const call = extractCall(body, callIdx);
      if (!call) continue;
      let end = call.end;
      if (body[end] === ";") end++;
      const name = m[1];
      let replacement = null;
      if (kind === "ref") {
        const setter = setterFor(name);
        ctx.stateIds.set(name, setter);
        ctx.hooks.add("useState");
        replacement = `const [${name}, ${setter}] = useState(${call.args.trim() || "undefined"});`;
      }
      else {
        const arg = call.args.trim();
        if (arg.startsWith("{")) {
          notes.push("writable computed → manual conversion [J]");
          replacement = `/* WF4-REVIEW [J]: writable computed — split into state + handlers */ const ${name} = computed(${arg});`;
        }
        else {
          const arrow = arg.match(/^\(\s*\)\s*=>\s*([\s\S]+)$/);
          const expr = (arrow ? arrow[1] : arg).trim().replace(/;$/, "");
          ctx.derivedIds.add(name);
          const simpleRead = /^[\w$?.[\]'"\s]+$/.test(expr) && !expr.includes("(") && !expr.includes("\n");
          if (simpleRead) {
            replacement = `const ${name} = ${expr}; // was computed — plain read stays reactive`;
          }
          else {
            ctx.hooks.add("useMemo");
            replacement = `const ${name} = useMemo(() => ${expr}, []); // WF4-REVIEW: dependency array`;
          }
        }
      }
      out += body.slice(last, m.index) + replacement;
      last = end;
      declRe.lastIndex = end;
    }
    return out + body.slice(last);
  })();
  // annotated writable computeds the scanner can't own: still mark them
  if (/computed(?:<[^>]*>)?\(\s*\{/.test(body)) {
    notes.push("writable computed → manual conversion [J]");
    body = body.replace(/(const\s+\w+[^=]*=\s*computed(?:<[^>]*>)?\(\s*\{)/g, "/* WF4-REVIEW [J]: writable computed — split into state + handlers */ $1");
  }

  // ---- vue ref type annotations ----
  body = body.replace(/:\s*(WritableComputedRef|ComputedRef|Ref)<([^>]+)>/g, ": $2 /* WF4-REVIEW: was $1 */");

  // ---- router ----
  body = body.replace(/const\s+(\w+)\s*=\s*useRouter\(\);?/g, (_, name) => {
    ctx.routerIds.add(name);
    ctx.routerImports.add("useNavigate");
    return `const navigate = useNavigate();`;
  });
  for (const id of ctx.routerIds) {
    body = body.replace(new RegExp(`\\b${id}\\.push\\(`, "g"), "navigate(");
    body = body.replace(new RegExp(`\\b${id}\\.replace\\(`, "g"), "navigate(/* WF4-REVIEW: replace+query */ ");
  }
  body = body.replace(/const\s+(\w+)\s*=\s*useRoute\(\);?/g, (_, name) => {
    ctx.routeIds.add(name);
    ctx.routerImports.add("useLocation");
    return `const ${name} = useLocation(); // WF4-REVIEW: .query → useSearchParams [J]`;
  });

  // ---- useNuxtApp → apiClient / context ----
  body = body.replace(/const\s*\{\s*\$axios\s*\}\s*=\s*useNuxtApp\(\);?/g, () => {
    ctx.needsApiClient = true;
    return `// axios instance imported as module singleton (was useNuxtApp $axios)`;
  });
  body = body.replace(/\$axios\./g, "apiClient.");
  body = body.replace(/const\s*\{\s*\$globals\s*\}\s*=\s*useNuxtApp\(\);?/g, () => {
    ctx.needsIcons = true;
    return `// icons imported directly (was $globals)`;
  });
  body = body.replace(/\$globals\.icons/g, "icons");

  // ---- useAsyncData → useEffect (skeleton with cancellation + error handling),
  // balanced-scan version: the callback body routinely contains `})` pairs ----
  body = (() => {
    const re = /useAsyncData\b/g;
    let out = "", last = 0, m;
    while ((m = re.exec(body))) {
      const call = extractCall(body, m.index);
      if (!call) continue;
      let end = call.end;
      if (body[end] === ";") end++;
      const parts = splitArgs(call.args);
      const fn = parts[1] ?? "";
      const blockMatch = fn.match(/=>\s*\{/);
      let inner = "";
      if (blockMatch) {
        const braceStart = fn.indexOf("{", blockMatch.index);
        const block = extractCall(fn, braceStart);
        inner = block ? block.args : fn;
      }
      else {
        inner = fn;
        notes.push("useAsyncData with non-block callback [S]");
      }
      ctx.hooks.add("useEffect");
      const lines = inner.trim().split("\n");
      const guarded = [];
      for (const l of lines) {
        const indented = l.trim() ? "      " + l : l;
        guarded.push(indented);
        // After every completed await, a superseded effect run must stop before it
        // can act on stale data (gate #2 round-3 finding: navigates were unguarded).
        if (/await/.test(l) && l.trimEnd().endsWith(";")) {
          guarded.push(indented.match(/^\s*/)[0] + "if (cancelled) return;");
        }
      }
      out += body.slice(last, m.index) + `useEffect(() => {
  let cancelled = false;
  void (async () => {
    try {
${guarded.join("\n")}
    }
    catch (err) {
      if (!cancelled) console.error(err); // WF4-REVIEW: surface load errors (was useAsyncData)
    }
  })();
  return () => { cancelled = true; };
}, []); // WF4-REVIEW: deps + re-run trigger — confirm against auth-ready init flow`;
      last = end;
      re.lastIndex = end;
    }
    return out + body.slice(last);
  })();

  // ---- .value assignments for tracked refs ----
  for (const [name, setter] of ctx.stateIds) {
    body = body.replace(new RegExp(`\\b${name}\\.value\\s*=\\s*([^;]+);?`, "g"), (_, v) => `${setter}(${v});`);
  }
  body = stripValueReads(body, ctx);

  // ---- judgement markers (left for the burndown queue) ----
  for (const api of ["watch", "watchEffect", "reactive", "nextTick", "onMounted", "onUnmounted", "provide", "inject"]) {
    if (new RegExp(`\\b${api}\\(`).test(body)) {
      notes.push(`${api} → manual conversion [J]`);
      body = body.replace(new RegExp(`(\\b${api}\\()`, "g"), `/* WF4-REVIEW [J] */ $1`);
    }
  }

  // ---- i18n in script ----
  // vue-i18n's useI18n → react-i18next's useTranslation (returns { t, i18n })
  body = body.replace(/const\s+i18n\s*=\s*useI18n\(\);?/g, () => {
    ctx.needsTranslation = true;
    return "const { i18n } = useTranslation();";
  });
  body = body.replace(/const\s*\{([^}]*)\}\s*=\s*useI18n\(\);?/g, (_, names) => {
    ctx.needsTranslation = true;
    return `const {${names}} = useTranslation(); // WF4-REVIEW: d/n/locale mapping [S]`;
  });
  if (/\$t\(/.test(body)) {
    body = body.replace(/\$t\(/g, "t(");
    ctx.needsTranslation = true;
  }

  // ---- composable auto-imports (from prebuilt index) ----
  const KNOWN_EXTERNAL = new Set(["useState", "useEffect", "useMemo", "useCallback", "useRef", "useReducer", "useContext", "useNavigate", "useLocation", "useSearchParams", "useParams", "useTranslation"]);
  const used = new Set([...body.matchAll(/\b(use[A-Z]\w+)\s*\(/g)].map((m) => m[1]));
  for (const name of used) {
    if (KNOWN_EXTERNAL.has(name)) continue;
    if (imports.some((i) => i.includes(name)) || body.includes(`function ${name}`)) continue;
    const file = ctx.composableIndex?.get(name);
    if (file) imports.push(`import { ${name} } from "@/composables/${file}";`);
    else notes.push(`unresolved auto-import: ${name}`);
  }

  // ---- emits in body ----
  for (const [, prop] of ctx.emits) {
    body = body.replace(new RegExp(`\\b${prop}\\(`, "g"), `${prop}(`);
  }

  const finalBody = transformExpr(body, ctx);
  return { body: finalBody, imports, propsDestructure, notes };
}

export function freshCtx(composableIndex = null) {
  return {
    stateIds: new Map(),
    derivedIds: new Set(),
    emits: new Map(),
    routerIds: new Set(),
    routeIds: new Set(),
    hooks: new Set(),
    routerImports: new Set(),
    muiImports: new Set(),
    muiImportsBySource: new Map(),
    composableIndex,
    destructureProps: false,
    needsTranslation: false,
    needsApiClient: false,
    needsIcons: false,
    needsLink: false,
    needsOutlet: false,
    needsSafeHtml: false,
    needsMdiIcon: false,
    hasPageMeta: false,
    unmapped: new Set(),
    parseErrors: [],
  };
}
