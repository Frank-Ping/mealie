// Vue template AST -> JSX. Uses @vue/compiler-dom baseParse (raw directive nodes).
import { baseParse, NodeTypes } from "@vue/compiler-dom";
import { mapComponent, globalDropProps } from "./vuetify-map.mjs";
import { transformExpr } from "./expr.mjs";

const EVENT_MAP = { click: "onClick", submit: "onSubmit", input: "onInput", change: "onChange", keydown: "onKeyDown", keyup: "onKeyUp", focus: "onFocus", blur: "onBlur", close: "onClose", "update:modelValue": "onChange" };

function pascal(tag) {
  return tag.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

function hasDir(el, name) {
  return el.props?.some((p) => p.type === NodeTypes.DIRECTIVE && p.name === name);
}
function getDir(el, name) {
  return el.props?.find((p) => p.type === NodeTypes.DIRECTIVE && p.name === name);
}
function isWs(node) {
  return node.type === NodeTypes.TEXT && /^\s*$/.test(node.content);
}

function parseFor(expContent) {
  const m = expContent.match(/^\s*(\([^)]*\)|\S+)\s+(?:in|of)\s+(.+)$/s);
  if (!m) return null;
  return { params: m[1].trim(), source: m[2].trim() };
}

function renderProps(el, ctx, notes) {
  const out = [];
  const tag = el.tag;
  const map = tag.startsWith("v-") ? mapComponent(tag) : null;

  if (map?.staticProps) {
    for (const [k, v] of Object.entries(map.staticProps)) {
      if (v === true) out.push(k);
      else if (typeof v === "string" && v.startsWith("{{")) out.push(`${k}={${v.slice(2, -2)}}`);
      else out.push(`${k}="${v}"`);
    }
  }

  for (const p of el.props) {
    if (p.type === NodeTypes.ATTRIBUTE) {
      let name = p.name === "class" ? "className" : p.name;
      if (tag.startsWith("v-") && (map?.dropProps?.includes(p.name) || globalDropProps.includes(p.name))) {
        notes.push(`dropped Vuetify-only prop "${p.name}" on <${tag}>`);
        continue;
      }
      if (p.value == null) out.push(name); // boolean attr
      else out.push(`${name}="${p.value.content}"`);
      continue;
    }
    if (p.type !== NodeTypes.DIRECTIVE) continue;
    const exp = p.exp ? transformExpr(p.exp.content, ctx) : null;

    if (p.name === "bind") {
      if (!p.arg) { out.push(`{...(${exp})}`); continue; }
      let arg = p.arg.content;
      if (arg === "key") { out.push(`key={${exp}}`); continue; }
      if (arg === "class") { out.push(`className={${exp}}`); continue; }
      if (arg === "to" && tag === "v-btn") { out.push(`component={Link}`, `to={${exp}}`); ctx.needsLink = true; continue; }
      if (arg === "to" || arg === "href") { out.push(`to={${exp}}`); ctx.needsLink = true; continue; }
      out.push(`${arg}={${exp}}`);
      continue;
    }
    if (p.name === "on") {
      const ev = p.arg?.content ?? "click";
      const handler = EVENT_MAP[ev] ?? `on${ev.charAt(0).toUpperCase() + camelEvent(ev.slice(1))}`;
      const mods = (p.modifiers ?? []).map((m) => (typeof m === "string" ? m : m.content));
      if (mods.includes("prevent") || mods.includes("stop")) {
        let body = exp ?? "";
        const arrow = body.match(/^\(\s*\)\s*=>\s*(.+)$/s);
        if (arrow) body = arrow[1];
        const guards = [mods.includes("prevent") ? "e.preventDefault();" : null, mods.includes("stop") ? "e.stopPropagation();" : null].filter(Boolean).join(" ");
        out.push(`${handler}={(e) => { ${guards} ${body}; }}`);
      }
      else {
        out.push(`${handler}={${exp ?? "/* WF4-REVIEW: missing handler */ undefined"}}`);
      }
      continue;
    }
    if (p.name === "model") {
      const target = map?.model ?? { prop: "value", handler: "onChange" };
      if (exp && /^[a-zA-Z_$][\w$]*$/.test(exp)) {
        const setter = ctx.stateIds?.get(exp) ?? `/* WF4-REVIEW: setter */ set${exp.charAt(0).toUpperCase() + exp.slice(1)}`;
        out.push(`${target.prop}={${exp}}`, `${target.handler}={${setter}}`);
      }
      else {
        notes.push(`v-model on complex expression "${exp}" [J]`);
        out.push(`{/* WF4-REVIEW: v-model ${exp} */}`);
      }
      continue;
    }
    if (p.name === "show") { out.push(`sx={{ display: (${exp}) ? undefined : "none" }}`); continue; }
    // if/else/for/slot/html handled structurally elsewhere
  }
  return out.join(" ");
}

function camelEvent(s) {
  return s.replace(/[:.-]([a-z])/g, (_, c) => c.toUpperCase());
}

function renderElement(el, ctx, depth, exprContext = false) {
  const pad = "  ".repeat(depth);
  const notes = [];

  // v-html → SafeHtml wrapper (decision D14)
  const htmlDir = getDir(el, "html");
  if (htmlDir) {
    ctx.needsSafeHtml = true;
    return comment(notes, pad, exprContext) + `${pad}<SafeHtml html={${transformExpr(htmlDir.exp.content, ctx)}} />`;
  }

  let tagJsx;
  if (el.tag === "NuxtPage" || el.tag === "NuxtLayout") {
    tagJsx = "Outlet";
    ctx.needsOutlet = true;
  }
  else if (el.tag.startsWith("v-")) {
    const map = mapComponent(el.tag);
    if (map) {
      tagJsx = map.name;
      const source = map.from === undefined ? "@mui/material" : map.from;
      if (source !== null) {
        if (!ctx.muiImportsBySource) ctx.muiImportsBySource = new Map();
        if (!ctx.muiImportsBySource.has(source)) ctx.muiImportsBySource.set(source, new Set());
        ctx.muiImportsBySource.get(source).add(map.name);
      }
      if (map.note) notes.push(map.note);
      if (map.name === "MdiIcon") { ctx.needsMdiIcon = true; }
    }
    else {
      tagJsx = pascal(el.tag);
      notes.push(`unmapped <${el.tag}> — judgement component, convert manually [J]`);
      ctx.unmapped?.add(el.tag);
    }
  }
  else if (el.tagType === 1 || /^[A-Z]/.test(el.tag)) {
    tagJsx = el.tag; // project component; import handled by script pass
  }
  else {
    tagJsx = el.tag;
  }

  const props = renderProps(el, ctx, notes);

  // v-icon: text content is the icon name → MdiIcon name prop
  let childrenJsx = "";
  if (el.tag === "v-icon") {
    const interp = el.children.find((c) => c.type === NodeTypes.INTERPOLATION);
    const name = interp ? transformExpr(interp.content.content, ctx) : null;
    return comment(notes, pad, exprContext) + `${pad}<MdiIcon${name ? ` name={${name}}` : ""}${props ? " " + props : ""} />`;
  }

  const kids = el.children.filter((c) => !isWs(c));
  if (kids.length === 0) {
    return comment(notes, pad, exprContext) + `${pad}<${tagJsx}${props ? " " + props : ""} />`;
  }
  childrenJsx = renderChildren(el.children, ctx, depth + 1);
  return comment(notes, pad, exprContext) + `${pad}<${tagJsx}${props ? " " + props : ""}>\n${childrenJsx}\n${pad}</${tagJsx}>`;
}

function comment(notes, pad, exprContext) {
  if (!notes.length) return "";
  const text = `WF4-REVIEW: ${notes.join("; ")}`;
  // {/* */} is only valid inside JSX children; in expression positions
  // (ternary branches, .map() callbacks) a plain block comment is required.
  return exprContext ? `${pad}/* ${text} */\n` : `${pad}{/* ${text} */}\n`;
}

function renderChildren(children, ctx, depth) {
  const pad = "  ".repeat(depth);
  const out = [];
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (isWs(node)) continue;

    if (node.type === NodeTypes.TEXT) {
      out.push(pad + node.content.replace(/\s+/g, " ").trim());
      continue;
    }
    if (node.type === NodeTypes.INTERPOLATION) {
      out.push(pad + `{${transformExpr(node.content.content, ctx)}}`);
      continue;
    }
    if (node.type === NodeTypes.COMMENT) continue;
    if (node.type !== NodeTypes.ELEMENT) continue;

    // v-for
    const forDir = getDir(node, "for");
    if (forDir) {
      const parsed = parseFor(forDir.exp.content);
      const elJsx = renderElement(stripDir(node, "for"), ctx, depth + 1, true);
      if (parsed) {
        out.push(`${pad}{${transformExpr(parsed.source, ctx)}.map(${parsed.params} => (\n${elJsx}\n${pad}))}`);
      }
      else {
        out.push(`${pad}{/* WF4-REVIEW: unparseable v-for "${forDir.exp.content}" */}\n${elJsx}`);
      }
      continue;
    }

    // v-if / v-else-if / v-else chain
    const ifDir = getDir(node, "if");
    if (ifDir) {
      const branches = [{ cond: transformExpr(ifDir.exp.content, ctx), node }];
      let j = i + 1;
      while (j < children.length) {
        const sib = children[j];
        if (isWs(sib)) { j++; continue; }
        if (sib.type === NodeTypes.ELEMENT && hasDir(sib, "else-if")) {
          branches.push({ cond: transformExpr(getDir(sib, "else-if").exp.content, ctx), node: sib });
          j++; continue;
        }
        if (sib.type === NodeTypes.ELEMENT && hasDir(sib, "else")) {
          branches.push({ cond: null, node: sib });
          j++;
        }
        break;
      }
      i = j - 1;
      const parts = branches.map((b, k) => {
        const elJsx = renderElement(stripDir(b.node, b.cond === null ? "else" : k === 0 ? "if" : "else-if"), ctx, depth + 1, true);
        if (b.cond === null) return `(\n${elJsx}\n${pad})`;
        return `(${b.cond}) ? (\n${elJsx}\n${pad})`;
      });
      let chain = parts[0];
      for (let k = 1; k < parts.length; k++) chain += ` : ${parts[k]}`;
      if (branches[branches.length - 1].cond !== null) chain += " : null";
      out.push(pad + "{" + chain + "}");
      continue;
    }

    out.push(renderElement(node, ctx, depth));
  }
  return out.join("\n");
}

function stripDir(el, name) {
  return { ...el, props: el.props.filter((p) => !(p.type === NodeTypes.DIRECTIVE && p.name === name)) };
}

export function compileTemplate(template, ctx = {}) {
  const ast = baseParse(template);
  const body = renderChildren(ast.children, ctx, 1);
  return body;
}
