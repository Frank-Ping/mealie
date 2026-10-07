// Vue template AST -> JSX. Uses @vue/compiler-dom parse (HTML mode — baseParse is
// XML-strict and rejects void tags like <br> that legal Vue templates use).
import { parse as domParse, NodeTypes } from "@vue/compiler-dom";
import { mapComponent, globalDropProps } from "./vuetify-map.mjs";
import { transformExpr, camelize } from "./expr.mjs";

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
  // `(item, i) in xs` | `item in xs` | `item, i in xs` (unparenthesized multi-param)
  const m = expContent.match(/^\s*(\([^)]*\)|[\w$]+(?:\s*,\s*[\w$]+)*)\s+(?:in|of)\s+(.+)$/s);
  if (!m) return null;
  const params = m[1].startsWith("(") ? m[1] : `(${m[1]})`;
  return { params, source: m[2].trim() };
}

function renderProps(el, ctx, notes) {
  const out = [];
  const tag = el.tag;
  const map = tag.startsWith("v-") ? mapComponent(tag) : null;

  if (map?.staticProps) {
    for (const [k, v] of Object.entries(map.staticProps)) {
      if (v === true) out.push(k);
      else if (typeof v === "string" && v.startsWith("{")) out.push(`${k}=${v}`); // braces included in the map value
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
      if (p.value == null) { out.push(name); continue; } // boolean attr
      // style="k: v; k: v" strings → React style objects (kebab keys camelCased)
      if (name === "style") {
        const entries = p.value.content.split(";").map((s) => s.trim()).filter(Boolean).map((kv) => {
          const idx = kv.indexOf(":");
          if (idx < 0) return null;
          const key = kv.slice(0, idx).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          return `${JSON.stringify(key)}: ${JSON.stringify(kv.slice(idx + 1).trim())}`;
        }).filter(Boolean);
        out.push(`style={{ ${entries.join(", ")} }}`);
        continue;
      }
      out.push(`${name}="${p.value.content}"`);
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
      // kebab prop names camelCase on components (model-value → modelValue); data-/aria- stay
      if (arg.includes("-") && !arg.startsWith("data-") && !arg.startsWith("aria-")) arg = camelize(arg);
      out.push(`${arg}={${exp}}`);
      continue;
    }
    if (p.name === "on") {
      const ev = p.arg?.content ?? "click";
      const handler = EVENT_MAP[ev] ?? `on${ev.charAt(0).toUpperCase() + camelEvent(ev.slice(1))}`;
      const mods = (p.modifiers ?? []).map((m) => (typeof m === "string" ? m : m.content));
      let body = exp ?? "";
      // multi-statement handlers: wrap in a block, converting ref assignments per statement
      const toStatements = (code) => code.split(";").map((s) => s.trim()).filter(Boolean).map((stmt) => {
        const asg = stmt.match(/^([a-zA-Z_$][\w$]*)\s*=(?!=)\s*([\s\S]+)$/);
        if (asg && ctx.stateIds?.has(asg[1])) return `${ctx.stateIds.get(asg[1])}(${asg[2].trim()});`;
        if (asg) notes.push(`assignment handler "${stmt}" — target not a tracked ref [J]`);
        return `${stmt};`;
      });
      if (body.includes(";")) {
        body = `() => { ${toStatements(body).join(" ")} }`;
      }
      else {
        // single assignment handler: `x = expr` on a tracked ref → () => setX(expr)
        const asg = body.match(/^([a-zA-Z_$][\w$]*)\s*=(?!=)\s*([\s\S]+)$/);
        if (asg && ctx.stateIds?.has(asg[1])) {
          body = `() => ${ctx.stateIds.get(asg[1])}(${asg[2].trim()})`;
        }
        else if (asg) {
          notes.push(`assignment handler "${body}" — target not a tracked ref [J]`);
        }
      }
      if (mods.includes("prevent") || mods.includes("stop")) {
        const arrow = body.match(/^\(\s*\)\s*=>\s*(.+)$/s);
        if (arrow) body = arrow[1];
        const guards = [mods.includes("prevent") ? "e.preventDefault();" : null, mods.includes("stop") ? "e.stopPropagation();" : null].filter(Boolean).join(" ");
        out.push(`${handler}={(e) => { ${guards} ${body}; }}`);
      }
      else {
        out.push(`${handler}={${body || "/* WF4-REVIEW: missing handler */ undefined"}}`);
      }
      continue;
    }
    if (p.name === "model") {
      const argName = p.arg?.content; // v-model:dialog="x"
      const target = argName
        ? { prop: argName, handler: `on${camelize(argName).charAt(0).toUpperCase() + camelize(argName).slice(1)}Change` }
        : (map?.model ?? { prop: "value", handler: "onChange" });
      if (exp && /^[a-zA-Z_$][\w$]*$/.test(exp)) {
        const setter = ctx.stateIds?.get(exp) ?? `/* WF4-REVIEW: setter */ set${exp.charAt(0).toUpperCase() + exp.slice(1)}`;
        out.push(`${target.prop}={${exp}}`, `${target.handler}={${setter}}`);
      }
      else {
        // complex v-model (member path) → judgement note only; emitting a comment
        // inside the props list is invalid JSX (Phase C TS1005 family)
        notes.push(`v-model${argName ? `:${argName}` : ""} on complex expression "${exp}" [J]`);
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

  // <template> grouping wrapper (Vue-only): render children as a fragment.
  // Slot usage is judgement; v-if/v-for on <template> is already handled
  // structurally by the caller.
  if (el.tag === "template") {
    if (hasDir(el, "slot")) notes.push(`<template> slot — convert to render props/children manually [J]`);
    const kids = renderChildren(el.children, ctx, depth + 1);
    return comment(notes, pad, exprContext) + `${pad}<>\n${kids}\n${pad}</>`;
  }

  // Vue dynamic <component :is="X"> → inline createElement-style expression
  if (el.tag === "component") {
    const isDir = el.props.find((p) => p.type === NodeTypes.DIRECTIVE && p.name === "bind" && p.arg?.content === "is");
    const isExp = isDir ? transformExpr(isDir.exp.content, ctx) : "/* WF4-REVIEW: missing :is */ Fragment";
    if (el.props.length > (isDir ? 1 : 0)) notes.push(`<component :is> with extra props — spread manually [S]`);
    return comment(notes, pad, exprContext) + `${pad}{(() => { const Cmp = ${isExp}; return <Cmp />; })()}`;
  }

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
    tagJsx = el.tag; // project component; import resolved from the component index
    ctx.componentTags?.add(el.tag);
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
      // the parser decodes entities (&lt; → <), so re-escape for JSX text:
      // a raw < or { in output would be parsed as a tag/expression
      const text = node.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\{/g, "&#123;")
        .replace(/\}/g, "&#125;")
        .replace(/\s+/g, " ")
        .trim();
      if (text) out.push(pad + text);
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
  const ast = domParse(template, {
    onError: (e) => { ctx.parseErrors?.push(`${e.code ?? ""} ${e.message}`.trim()); },
  });
  const body = renderChildren(ast.children, ctx, 1);
  return body;
}
