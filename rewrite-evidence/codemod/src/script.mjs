// <script setup> / composable .ts -> React TS transforms (line/regex based v1).
import { stripValueReads, transformExpr, setterFor, emitToProp, camelize, safeIdent } from "./expr.mjs";
import { extractCall, splitArgs, extractAngles, extractStatement } from "./balanced.mjs";

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

// Destructure entry with reserved-word aliasing: `delete` → `delete: delete_`.
function destructureEntry(ctx, key, defVal) {
  const safe = safeIdent(key);
  if (safe !== key) ctx.propsRename[key] = safe;
  const lhs = safe !== key ? `${key}: ${safe}` : key;
  return defVal !== undefined ? `${lhs} = ${defVal}` : lhs;
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
      propsDestructure = defaults.map((d) => destructureEntry(ctx, d.key, d.value)).join(", ");
      ctx.destructureProps = true;
      out += body.slice(last, m.index) + `/* props via destructured signature (was withDefaults(defineProps<${typeName ?? "?"}>) */`;
      last = end;
      re.lastIndex = end;
    }
    return out + body.slice(last);
  })();

  // ---- plain defineProps<Props>() (incl. destructured form) ----
  if (!propsDestructure) {
    const decl = body.match(/const\s*(\{[\s\S]*?\}|\w+)\s*=\s*defineProps<(\w+)>\(\)\s*;?/);
    if (decl) {
      if (decl[1].startsWith("{")) {
        // destructured defineProps: entries already carry defaults — use as-is
        propsDestructure = decl[1].slice(1, -1).trim();
      }
      else {
        const iface = body.match(new RegExp(`interface\\s+${decl[2]}\\s*\\{([\\s\\S]*?)\\}`));
        if (iface) {
          const keys = [...iface[1].matchAll(/^\s*(\w+)\??:/gm)].map((mm) => mm[1]);
          propsDestructure = keys.map((k) => destructureEntry(ctx, k)).join(", ");
        }
      }
      ctx.destructureProps = true;
      body = body.replace(decl[0], "/* props via destructured signature */");
    }
  }

  // ---- runtime defineProps({...}) → interface + destructure (balanced scan —
  // the regex truncated multi-line props objects at the first inner `}`) ----
  body = (() => {
    const re = /(const\s+props\s*=\s*)?defineProps\b/g;
    let out = "", last = 0, m;
    while ((m = re.exec(body))) {
      const call = extractCall(body, m.index + (m[1] ? m[1].length : 0));
      if (!call) continue;
      const argTrim = call.args.trim();
      if (!argTrim.startsWith("{")) continue; // generic form — other rules own it
      let end = call.end;
      if (body[end] === ";") end++;
      const entries = splitArgs(argTrim.slice(1, -1)).map((p) => {
        const braced = p.match(/^(\w+)\s*:\s*\{([\s\S]*)\}$/);
        if (braced) return { key: braced[1], attrsBody: braced[2] };
        const shorthand = p.match(/^(\w+)\s*:\s*(\w+)$/); // `showAll: Boolean`
        if (shorthand && TYPE_MAP[shorthand[2]]) return { key: shorthand[1], attrsBody: `type: ${shorthand[2]}` };
        return null;
      }).filter(Boolean);
      const ifaceLines = [];
      const destructure = [];
      for (const { key, attrsBody } of entries) {
        // split the attr body depth-aware: defaults may be `() => ({ ... })` with commas
        const pairs = splitArgs(attrsBody).map((p) => p.match(/^(\w+)\s*:\s*([\s\S]+)$/)).filter(Boolean);
        const attr = Object.fromEntries(pairs.map(([, k, v]) => [k, v.trim()]));
        const tsType = TYPE_MAP[(attr.type ?? "").match(/^\w+/)?.[0]] ?? "unknown";
        const required = /^true$/.test(attr.required ?? "");
        ifaceLines.push(`  ${key}${required ? "" : "?"}: ${tsType};`);
        destructure.push(destructureEntry(ctx, key, attr.default));
      }
      propsDestructure = destructure.join(", ");
      ctx.destructureProps = true;
      ctx.generatedPropsInterface = `interface Props {\n${ifaceLines.join("\n")}\n}`;
      out += body.slice(last, m.index) + `/* props via generated interface + destructured signature */`;
      last = end;
      re.lastIndex = end;
    }
    return out + body.slice(last);
  })();

  // ---- defineModel → prop value + onChange pair ----
  body = (() => {
    const re = /const\s+(\w+)\s*=\s*defineModel\b/g;
    let out = "", last = 0, m;
    while ((m = re.exec(body))) {
      const localVar = m[1];
      const callIdx = m.index + m[0].length - "defineModel".length;
      const call = extractCall(body, callIdx);
      if (!call) continue;
      let end = call.end;
      if (body[end] === ";") end++;
      const generic = (() => {
        const rest = body.slice(callIdx + "defineModel".length);
        const lt = rest.indexOf("<");
        if (lt > 2) return "unknown";
        const angle = extractAngles(rest, lt);
        return angle?.args ?? "unknown";
      })();
      const parts = splitArgs(call.args);
      const nameArg = parts[0]?.match(/^['"`]([^'"`]+)['"`]$/)?.[1];
      const optsArg = nameArg ? parts[1] : parts[0];
      const modelName = nameArg ?? "modelValue";
      const camelModel = camelize(modelName);
      const cap = camelModel.charAt(0).toUpperCase() + camelModel.slice(1);
      const propName = modelName === "modelValue" ? "value" : camelModel;
      const handlerName = modelName === "modelValue" ? "onChange" : `on${cap}Change`;
      const required = optsArg ? /required:\s*true/.test(optsArg) : true;
      ctx.modelProps.push({ localVar, propName, handlerName, tsType: generic, required });
      // reads: localVar (already stripped); writes: localVar.value = x → handler(x)
      ctx.stateIds.set(localVar, handlerName);
      ctx.destructureProps = true;
      out += body.slice(last, m.index) + `/* v-model pair: ${propName} + ${handlerName} (was defineModel) */`;
      last = end;
      re.lastIndex = end;
    }
    return out + body.slice(last);
  })();

  // ---- defineEmits([...]) ----
  body = body.replace(/(const\s+emit\s*=\s*)?defineEmits\(\s*\[([\s\S]*?)\]\s*\);?/g, (_, _prefix, list) => {
    const names = [...list.matchAll(/['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);
    for (const n of names) ctx.emits.set(n, emitToProp(n));
    return `/* emits → props: ${names.map((n) => emitToProp(n)).join(", ")} */`;
  });

  // ---- type-generic defineEmits<{ (e: 'name', arg: T) => void }> — payload types! ----
  body = (() => {
    const re = /(const\s+emit\s*=\s*)?defineEmits\s*</g;
    let out = "", last = 0, m;
    while ((m = re.exec(body))) {
      const angle = extractAngles(body, m.index + m[0].length - 1);
      if (!angle) continue;
      const sigText = angle.args;
      const after = body.slice(angle.end).match(/^\s*\(\s*\)\s*;?/);
      if (!after) continue;
      let end = angle.end + after[0].length;
      const sigRe = /\(\s*(?:e|event):\s*['"`]([^'"`]+)['"`]\s*(?:,\s*([\s\S]*?))?\)\s*(?::|=>)/g;
      let sm;
      while ((sm = sigRe.exec(sigText))) {
        const prop = emitToProp(sm[1]);
        ctx.emits.set(sm[1], prop);
        ctx.typedEmits.set(prop, (sm[2] ?? "").trim());
      }
      out += body.slice(last, m.index) + `/* emits → typed props: ${[...ctx.emits.values()].join(", ")} */`;
      last = end;
      re.lastIndex = end;
    }
    return out + body.slice(last);
  })();

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
          const expr = (arrow ? arrow[1] : arg).trim().replace(/;\s*$/, "").replace(/,\s*$/, "");
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

  // ---- .value assignments for tracked refs (statement-extraction: the RHS may
  // span lines and contain ';'-free arrow bodies — regex overran block ends) ----
  for (const [name, setter] of ctx.stateIds) {
    body = (() => {
      const re = new RegExp(`\\b${name}\\.value\\s*=(?![=>])\\s*`, "g");
      let out = "", last = 0, m;
      while ((m = re.exec(body))) {
        // only convert at statement position — an assignment inside an expression
        // (arrow body, call argument) must stay a visible residual
        const lineStart = body.lastIndexOf("\n", m.index) + 1;
        if (body.slice(lineStart, m.index).trim() !== "") continue;
        const stmt = extractStatement(body, m.index + m[0].length);
        if (!stmt) continue;
        out += body.slice(last, m.index) + `${setter}(${stmt.args});`;
        last = stmt.end;
        re.lastIndex = stmt.end;
      }
      return out + body.slice(last);
    })();
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
    typedEmits: new Map(),
    modelProps: [],
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
    needsFormatters: false,
    propsRename: {},
    componentTags: new Set(),
  };
}
