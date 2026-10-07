// Orchestrator: SFC -> TSX, plain .ts composable -> .ts
import { parse as parseSfc } from "@vue/compiler-sfc";
import { transformScript, freshCtx } from "./script.mjs";
import { compileTemplate } from "./template.mjs";

function pascal(s) {
  return s.split(/[-_\s]/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

export function componentNameFor(filename) {
  const parts = filename.replace(/\.[^.]+$/, "").split(/[\\/]/);
  let name = parts[parts.length - 1];
  if (name === "index") {
    const parent = parts[parts.length - 2] ?? "index";
    name = parent === "pages" ? "homePage" : `${parent}Page`;
  }
  // strip route brackets and other non-identifier characters: [slug] → Slug
  const clean = name.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  return pascal(clean);
}

function hoistTypesAndHandle(body) {
  const hoisted = [];
  // export const handle = {...}; // WF4-REVIEW ... (definePageMeta)
  body = body.replace(/^export const handle = \{[\s\S]*?\};.*$/m, (m) => { hoisted.push(m); return ""; });
  // interface / type declarations (must be module-scope for the signature)
  body = body.replace(/^(export\s+)?interface\s+\w+\s*\{[\s\S]*?^\}/gm, (m) => { hoisted.push(m); return ""; });
  body = body.replace(/^(export\s+)?type\s+\w+[\s\S]*?;$/gm, (m) => { hoisted.push(m); return ""; });
  return { hoisted, rest: body };
}

function appendEmitProps(ifaceText, ctx) {
  if (!ctx.emits.size) return ifaceText;
  const lines = [...ctx.emits.values()].map((p) => `  ${p}?: (...args: unknown[]) => void; // WF4-REVIEW: payload types`);
  return ifaceText.replace(/\}\s*$/, () => lines.join("\n") + "\n}");
}

function assembleImports(ctx, keptImports) {
  const out = [];
  if (ctx.hooks.size) out.push(`import { ${[...ctx.hooks].sort().join(", ")} } from "react";`);
  const rr = new Set(ctx.routerImports);
  if (ctx.needsLink) rr.add("Link");
  if (ctx.needsOutlet) rr.add("Outlet");
  if (rr.size) out.push(`import { ${[...rr].sort().join(", ")} } from "react-router-dom";`);
  if (ctx.needsTranslation) out.push(`import { useTranslation } from "react-i18next";`);
  if (ctx.muiImportsBySource?.size) {
    for (const [source, names] of [...ctx.muiImportsBySource.entries()].sort()) {
      const list = [...names].filter(Boolean).sort();
      if (list.length) out.push(`import { ${list.join(", ")} } from "${source}";`);
    }
  }
  if (ctx.needsApiClient) out.push(`import { apiClient } from "@/lib/api/client";`);
  if (ctx.needsIcons) out.push(`import { icons } from "@/lib/icons";`);
  if (ctx.needsMdiIcon) out.push(`import MdiIcon from "@/components/MdiIcon";`);
  if (ctx.needsSafeHtml) out.push(`import SafeHtml from "@/components/SafeHtml";`);
  out.push(...keptImports);
  return [...new Set(out)].join("\n");
}

export function convertVue(source, filename, composableIndex = null) {
  const { descriptor, errors } = parseSfc(source, { filename });
  if (errors.length) throw new Error(`SFC parse errors in ${filename}: ${errors.map((e) => e.message).join("; ")}`);
  const scriptContent = descriptor.scriptSetup?.content ?? descriptor.script?.content ?? "";
  const ctx = freshCtx(composableIndex);

  const { body, imports, propsDestructure, notes } = transformScript(scriptContent, ctx);

  let templateJsx = "";
  if (descriptor.template?.content?.trim()) {
    templateJsx = compileTemplate(descriptor.template.content, ctx);
  }

  const { hoisted, rest } = hoistTypesAndHandle(body.trim());

  // props interface: generated (runtime defineProps) or hoisted local one
  let propsIface = null;
  if (ctx.generatedPropsInterface) propsIface = ctx.generatedPropsInterface;
  const propsIdx = hoisted.findIndex((h) => /^(export\s+)?interface\s+Props\b/.test(h));
  if (propsIdx >= 0) propsIface = hoisted.splice(propsIdx, 1)[0];
  if (propsIface) propsIface = appendEmitProps(propsIface, ctx);

  const emitNames = [...ctx.emits.values()];
  const destructureAll = [propsDestructure, ...emitNames].filter(Boolean).join(", ");
  const name = componentNameFor(filename);

  const head = [];
  head.push(assembleImports(ctx, imports));
  if (propsIface) head.push(propsIface);
  head.push(...hoisted);

  const componentBody = [];
  if (ctx.needsTranslation) componentBody.push("  const { t } = useTranslation();");
  const cleaned = rest.replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned) componentBody.push(cleaned.split("\n").map((l) => (l.trim() ? "  " + l : l)).join("\n"));
  if (templateJsx) {
    componentBody.push("  return (\n    <>\n" + templateJsx + "\n    </>\n  );");
  }
  const signature = destructureAll ? `{ ${destructureAll} }: Props` : "";
  head.push(`export default function ${name}(${signature}) {\n${componentBody.join("\n\n")}\n}`);
  return { code: head.filter(Boolean).join("\n\n") + "\n", ctx, notes };
}

export function convertTs(source, filename, composableIndex = null) {
  const ctx = freshCtx(composableIndex);
  const { body, imports, notes } = transformScript(source, ctx);
  const head = [assembleImports(ctx, imports), body.trim()];
  return { code: head.filter(Boolean).join("\n\n") + "\n", ctx, notes };
}
