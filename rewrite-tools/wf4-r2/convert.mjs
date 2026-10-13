import { createRequire } from 'node:module';
const require = createRequire(new URL('../../frontend-react/package.json', import.meta.url));
const ts = require('typescript');
const { parse: parseSFC } = require('@vue/compiler-sfc');
const { baseParse, NodeTypes } = require('@vue/compiler-dom');
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const print = (node, file) => printer.printNode(ts.EmitHint.Unspecified, node, file);
const quote = JSON.stringify;

export class Blocked extends Error {
  constructor(rule, message, offset = 0) { super(message); this.rule = rule; this.offset = offset; }
}
function expression(source) {
  const file = ts.createSourceFile('expression.ts', `const value = (${source});`, ts.ScriptTarget.Latest, true);
  if (file.parseDiagnostics.length) throw new Blocked('R01', 'Invalid TypeScript expression');
  return { file, node: file.statements[0].declarationList.declarations[0].initializer.expression };
}
function callName(node) { return ts.isCallExpression(node) && ts.isIdentifier(node.expression) ? node.expression.text : null; }
function propName(node) { return ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : null; }
function callbackName(event) { return 'on' + event.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(''); }
function splitFor(text) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, text);
  let depth = 0;
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if ([ts.SyntaxKind.OpenParenToken, ts.SyntaxKind.OpenBracketToken, ts.SyntaxKind.OpenBraceToken].includes(token)) depth++;
    if ([ts.SyntaxKind.CloseParenToken, ts.SyntaxKind.CloseBracketToken, ts.SyntaxKind.CloseBraceToken].includes(token)) depth--;
    if (depth === 0 && [ts.SyntaxKind.InKeyword, ts.SyntaxKind.OfKeyword].includes(token)) {
      const left = text.slice(0, scanner.getTokenPos()).trim();
      const right = text.slice(scanner.getTextPos()).trim();
      if (!ts.isIdentifier(expression(left).node)) throw new Blocked('R05', 'Only single-identifier list aliases supported');
      return { alias: left, iterable: right };
    }
  }
  throw new Blocked('R05', 'Unrecognized list expression');
}

export function convert(source, { component = 'ConvertedComponent', path = 'input.vue', availableComponents = [] } = {}) {
  const diagnostics = [];
  const applied = new Set();
  const imports = [];
  const importInventory = [];
  const templates = new Set();
  const propTypes = new Map();
  const defaults = new Map();
  const events = new Map();
  const scriptBody = [];
  const declarations = [];
  const locals = new Set();
  let file;
  let sourceBase = 0;
  function blocked(rule, message, offset = 0) { throw new Blocked(rule, message, offset); }
  function use(rule) { applied.add(rule); }
  function expr(text, loops = new Map(), event = false) {
    const parsed = expression(text);
    const transformed = ts.transform(parsed.node, [context => root => {
      const visit = node => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === '$emit') {
          const [name, ...args] = node.arguments;
          if (!name || !ts.isStringLiteral(name) || !events.has(name.text)) blocked('R03', 'Unknown/dynamic event');
          const types = args.map(arg => {
            if (!ts.isIdentifier(arg)) blocked('R03', 'Only declared prop/list payloads supported');
            if (loops.has(arg.text)) return loops.get(arg.text);
            if (propTypes.has(arg.text)) return `NonNullable<Props[${quote(arg.text)}]>`;
            blocked('R03', `Unresolved payload ${arg.text}`);
          });
          const prior = events.get(name.text);
          if (prior !== null && JSON.stringify(prior) !== JSON.stringify(types)) blocked('R03', 'Conflicting event payloads');
          events.set(name.text, types);
          use('R03');
          return context.factory.createCallChain(
            context.factory.createPropertyAccessExpression(context.factory.createIdentifier('__input'), callbackName(name.text)),
            context.factory.createToken(ts.SyntaxKind.QuestionDotToken), undefined, args.map(a => ts.visitNode(a, visit)));
        }
        if (ts.isIdentifier(node) && propTypes.has(node.text)) {
          const isName = (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node)
            || (ts.isPropertyAssignment(node.parent) && node.parent.name === node);
          if (!isName) return context.factory.createPropertyAccessExpression(context.factory.createIdentifier('props'), node.text);
        }
        if (ts.isIdentifier(node) && node.text === '$attrs') return context.factory.createIdentifier('attrs');
        return ts.visitEachChild(node, visit, context);
      };
      return ts.visitNode(root, visit);
    }]);
    let result = print(transformed.transformed[0], parsed.file);
    transformed.dispose();
    if (event && ts.isArrowFunction(parsed.node)) result = `(${result})()`;
    return result;
  }
  function children(nodes, loops) { return nodes.map(n => template(n, loops)).join(''); }
  function template(node, loops = new Map(), omit = new Set(), root = false) {
    if (node.type === NodeTypes.TEXT) return node.content.trim() ? `{${quote(node.content)}}` : '';
    if (node.type === NodeTypes.COMMENT) return `{/* ${node.content.replaceAll('*/', '* /')} */}`;
    if (node.type === NodeTypes.INTERPOLATION) return `{String(${expr(node.content.content, loops)})}`;
    if (node.type !== NodeTypes.ELEMENT) blocked('R01', `Unsupported template node ${node.type}`, node.loc?.start.offset);
    const directives = node.props.filter(p => p.type === NodeTypes.DIRECTIVE);
    const loop = directives.find(p => p.name === 'for');
    const conditional = directives.find(p => p.name === 'if');
    if (loop && !omit.has('for')) {
      const { alias, iterable } = splitFor(loop.exp?.content || '');
      const parsed = expression(iterable).node;
      const root = ts.isCallExpression(parsed) && ts.isPropertyAccessExpression(parsed.expression) ? parsed.expression.expression : parsed;
      if (!ts.isIdentifier(root) || !propTypes.has(root.text)) blocked('R05', 'Unresolved list item type', loop.loc.start.offset);
      const key = directives.find(p => p.name === 'bind' && p.arg?.content === 'key');
      if (!key) blocked('R05', 'List without source key', node.loc.start.offset);
      const scoped = new Map(loops).set(alias, `NonNullable<Props[${quote(root.text)}]>[number]`);
      use('R05');
      return `{(${expr(iterable, loops)}).map((${alias}) => (${template(node, scoped, new Set([...omit, 'for']))}))}`;
    }
    if (conditional && !omit.has('if')) {
      use('R04');
      return `{Boolean(${expr(conditional.exp.content, loops)}) ? (${template(node, loops, new Set([...omit, 'if']), root)}) : null}`;
    }
    if (node.tag === 'slot') {
      if (directives.length) blocked('R11', 'Scoped/dynamic slots require reviewed contract', node.loc.start.offset);
      const name = node.props.find(p => p.type === NodeTypes.ATTRIBUTE && p.name === 'name')?.value?.content || 'default';
      const key = name === 'default' ? 'children' : name + 'Slot';
      templates.add(key);
      use('R11');
      return `{__input.${key} ?? <>${children(node.children, loops)}</>}`;
    }
    const tagMap = { 'v-chip': 'LegacyChip', 'v-btn': 'LegacyButton', 'v-icon': 'LegacyIcon' };
    const tag = tagMap[node.tag] || node.tag;
    const native = ['div','span','h1','h2','h3','p','section','a','button'];
    if (!tagMap[node.tag] && !native.includes(node.tag) && !availableComponents.includes(node.tag)) {
      blocked('R22', `Unconverted component dependency: ${node.tag}`, node.loc.start.offset);
    }
    if (tagMap[node.tag]) use(node.tag === 'v-btn' ? 'R08' : 'R07');
    let attributes = root && native.includes(node.tag) ? ' {...attrs}' : '';
    for (const prop of node.props) {
      if (prop.type === NodeTypes.ATTRIBUTE) {
        const name = prop.name === 'class' ? 'className' : prop.name;
        const allowed = node.tag === 'v-chip' ? ['label','dark','color','variant','className']
          : node.tag === 'v-icon' ? ['start','end','className'] : null;
        if (allowed && !allowed.includes(name)) blocked('R07', `Unmapped static prop ${name}`, prop.loc.start.offset);
        attributes += prop.value ? ` ${name}=${quote(prop.value.content)}` : ` ${name}`;
      } else {
        if (['if','for'].includes(prop.name)) continue;
        if (prop.name === 'bind' && !prop.arg) {
          if (prop.exp?.content !== '$attrs') blocked('R08', 'Unknown spread attributes', prop.loc.start.offset);
          attributes += ' {...attrs}'; use('R08'); continue;
        }
        if (prop.name === 'bind') {
          if (!prop.arg || prop.arg.isStatic === false || prop.modifiers.length) blocked('R01', 'Dynamic binding/modifier unsupported', prop.loc.start.offset);
          const inputName = prop.arg.content;
          const name = { 'x-small': 'xSmall', 'class': 'className' }[inputName] || inputName;
          if (!['key','color','size','xSmall','loading','disabled','variant','to','className','id','href'].includes(name)) blocked('R07', `Unmapped bound prop ${name}`, prop.loc.start.offset);
          if (name === 'to' || name === 'href') use('R09');
          attributes += ` ${name}={${expr(prop.exp.content, loops)}}`;
        } else if (prop.name === 'on') {
          if (prop.arg?.content !== 'click') blocked('R06', 'Only click events implemented', prop.loc.start.offset);
          const modifiers = prop.modifiers.map(m => typeof m === 'string' ? m : m.content);
          if (modifiers.some(m => !['prevent','stop','self'].includes(m))) blocked('R06', 'Unsupported event modifier', prop.loc.start.offset);
          const actions = modifiers.map(m => ({ prevent:'event.preventDefault();', stop:'event.stopPropagation();', self:'if (event.target !== event.currentTarget) return;' })[m]).join(' ');
          const fallthroughClick = node.tag === 'v-btn' ? ' if (typeof attrs.onClick === "function") attrs.onClick(event);' : '';
          attributes += ` onClick={(event) => { ${actions} void (${expr(prop.exp.content, loops, true)});${fallthroughClick} }}`;
          use('R06');
        } else blocked('R01', `Unsupported directive v-${prop.name}`, prop.loc.start.offset);
      }
    }
    return `<${tag}${attributes}>${children(node.children, loops)}</${tag}>`;
  }
  try {
    if (!path.endsWith('.vue')) blocked('R25', 'Module singleton/store factory requires reviewed lifetime and tenant contract');
    const parsed = parseSFC(source, { filename: path });
    if (parsed.errors.length) blocked('R01', 'Invalid Vue SFC');
    const descriptor = parsed.descriptor;
    sourceBase = descriptor.scriptSetup?.loc.start.offset || 0;
    if (!descriptor.scriptSetup || descriptor.script) blocked('R01', 'Only TypeScript script setup implemented');
    if (descriptor.styles.some(s => s.content.trim())) blocked('R33', 'Nonempty CSS requires explicit selector/scoping mapping');
    file = ts.createSourceFile(path+'.ts', descriptor.scriptSetup.content, ts.ScriptTarget.Latest, true);
    if (file.parseDiagnostics.length) blocked('R01', 'Invalid TypeScript script');
    for (const statement of file.statements) {
      if (ts.isInterfaceDeclaration(statement) && statement.name.text === 'Props') {
        for (const member of statement.members) {
          if (!ts.isPropertySignature(member) || !propName(member.name) || !member.type) blocked('R02', 'Unsupported prop member');
          propTypes.set(propName(member.name), print(member.type, file));
        }
      }
    }
    for (const statement of file.statements) {
      if (ts.isImportDeclaration(statement)) {
        const module = statement.moduleSpecifier.text;
        importInventory.push({ module, typeOnly: !!statement.importClause?.isTypeOnly });
        if (module.endsWith('.vue')) blocked('R22', `Unconverted module dependency: ${module}`, statement.pos);
        if (module === '~/composables/api') {
          const bindings = statement.importClause?.namedBindings;
          if (!bindings || !ts.isNamedImports(bindings) || bindings.elements.some(e => e.name.text !== 'useUserApi')) blocked('R29','Unsupported API injection');
          imports.push('import { useUserApi } from "../infra/services";');
        } else if (/^(?:~|@)\/composables/.test(module) || ['vue','vue-i18n'].includes(module)) blocked('R35', `Unconverted framework dependency: ${module}`, statement.pos);
        else {
          const mapped=module.startsWith('~/lib/')?'../reused/lib/'+module.slice('~/lib/'.length):module;
          imports.push(print(ts.factory.updateImportDeclaration(statement,statement.modifiers,statement.importClause,ts.factory.createStringLiteral(mapped),statement.attributes),file));
        }
        continue;
      }
      if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) { declarations.push(print(statement,file)); continue; }
      if (ts.isExpressionStatement(statement) && callName(statement.expression) === 'defineEmits') {
        const names = statement.expression.arguments[0];
        if (!names || !ts.isArrayLiteralExpression(names) || names.elements.some(e => !ts.isStringLiteral(e))) blocked('R03','Only literal event name arrays implemented');
        names.elements.forEach(e => events.set(e.text,null)); continue;
      }
      if (ts.isExpressionStatement(statement) && callName(statement.expression) === 'definePageMeta') blocked('R21','Page metadata/auth/async redirect contract unresolved', statement.pos);
      if (ts.isVariableStatement(statement)) {
        if (statement.declarationList.declarations.length !== 1) blocked('R01','Multi-variable statement unsupported',statement.pos);
        const variable=statement.declarationList.declarations[0];
        const initializer=variable.initializer;
        if (!initializer) blocked('R01','Variable without initializer',variable.pos);
        let macro=initializer;
        if (callName(macro)==='withDefaults') { const [propsCall,values]=macro.arguments; if (!values || !ts.isObjectLiteralExpression(values)) blocked('R02','Unsupported defaults'); values.properties.forEach(p=> { if (!ts.isPropertyAssignment(p)||!propName(p.name)) blocked('R02','Unsupported default property'); let value=p.initializer; if (ts.isArrowFunction(value)) { if (!ts.isArrayLiteralExpression(value.body)&&!ts.isObjectLiteralExpression(value.body)) blocked('R02','Unsupported default factory'); value=value.body; } defaults.set(propName(p.name),print(value,file)); }); macro=propsCall; }
        if (callName(macro)==='defineProps') {
          if (!ts.isIdentifier(variable.name) || variable.name.text!=='props') blocked('R02','Props binding must be explicit');
          const runtime=macro.arguments[0];
          if (runtime) {
            if (!ts.isObjectLiteralExpression(runtime)) blocked('R02','Unsupported runtime props');
            const members=[];
            for (const p of runtime.properties) {
              if (!ts.isPropertyAssignment(p)||!propName(p.name)||!ts.isObjectLiteralExpression(p.initializer)) blocked('R02','Unsupported runtime prop');
              const spec=Object.fromEntries(p.initializer.properties.map(x=> { if (!ts.isPropertyAssignment(x)||!propName(x.name)) blocked('R02','Unsupported runtime validator'); return [propName(x.name),x.initializer]; }));
              if (Object.keys(spec).some(k=> !['type','default'].includes(k))) blocked('R02','Runtime validator requires contract');
              const type=spec.type && ts.isIdentifier(spec.type) ? {Boolean:'boolean',String:'string'}[spec.type.text] : null;
              if (!type) blocked('R02','Unsupported runtime constructor');
              const resolvedType=type+(spec.default?.kind===ts.SyntaxKind.NullKeyword?' | null':'');
              const key=propName(p.name);
              propTypes.set(key,resolvedType); members.push(`${quote(key)}?: ${resolvedType};`);
              if (spec.default) defaults.set(key,print(spec.default,file));
            }
            declarations.push(`interface Props { ${members.join('\n')} }`);
          } else if (!macro.typeArguments?.length || print(macro.typeArguments[0],file)!=='Props') blocked('R02','Only declared Props interface supported');
          use('R02'); continue;
        }
        const name=callName(initializer);
        if (name==='computed') {
          if (!ts.isIdentifier(variable.name)||initializer.arguments.length!==1||!ts.isArrowFunction(initializer.arguments[0])) blocked('R18','Unsupported computed');
          scriptBody.push(`const ${variable.name.text} = (${print(initializer.arguments[0],file)})();`); locals.add(variable.name.text); use('R18'); continue;
        }
        if (name==='useI18n') { scriptBody.push(`const ${print(variable.name,file)} = useLegacyI18n();`); use('R30'); continue; }
        if (name==='useNuxtApp') {
          if (print(variable.name,file).replaceAll(' ','')!=='{$globals}') blocked('R29','Unresolved Nuxt injected service');
          scriptBody.push('const $globals = { icons };'); continue;
        }
        if (name && ['ref','reactive','useAsyncData','useMealieAuth','watch','useRoute','useRouter'].includes(name)) blocked('R17',`Unimplemented reactive/async call ${name}`,variable.pos);
        // Literal records and injected useUserApi are the only remaining accepted variables.
        if (name && name!=='useUserApi') blocked('R01',`Unknown setup function ${name}`,variable.pos);
        if (!name && !ts.isObjectLiteralExpression(initializer) && !ts.isArrayLiteralExpression(initializer) && !ts.isLiteralExpression(initializer)) blocked('R01','Unsupported variable initializer',variable.pos);
        if ((ts.isObjectLiteralExpression(initializer) || ts.isArrayLiteralExpression(initializer)) && ts.isIdentifier(variable.name)) {
          scriptBody.push(`const [${variable.name.text}] = useState(() => (${print(initializer,file)}));`);
        } else scriptBody.push(print(statement,file));
        if (ts.isIdentifier(variable.name)) locals.add(variable.name.text);
        continue;
      }
      if (ts.isFunctionDeclaration(statement)) { scriptBody.push(print(statement,file)); locals.add(statement.name?.text); continue; }
      blocked('R01',`Unsupported setup statement ${ts.SyntaxKind[statement.kind]}`,statement.pos);
    }
    if (!descriptor.template) blocked('R01','No template');
    sourceBase = descriptor.template.loc.start.offset;
    const ast=baseParse(descriptor.template.content);
    const significant=ast.children.filter(n=>n.type===NodeTypes.ELEMENT||n.type===NodeTypes.INTERPOLATION||n.type===NodeTypes.TEXT&&n.content.trim());
    const jsx=ast.children.map(n=>template(n,new Map(),new Set(),significant.length===1&&n===significant[0])).join('');
    const eventProps=[...events].map(([name,types])=> { if(types===null) blocked('R03',`Event ${name} has no demonstrated payload contract`); return `${callbackName(name)}?: (${types.map((t,i)=>`arg${i}: ${t}`).join(',')}) => void;`; });
    const slotProps=[...templates].map(name=>`${name}?: ReactNode;`);
    const resolved=[...propTypes].map(([name])=>`${quote(name)}: ${defaults.has(name)?`withDefault(__input[${quote(name)}], ${defaults.get(name)})`:`__input[${quote(name)}]`}`);
    const consumed=[...propTypes.keys(),...[...events.keys()].map(callbackName),...templates];
    const output=`// Generated by WF4-R2 AST rules. Do not hand-edit. Source: ${path}\n`
      +`import { useState, type ReactNode } from "react";\nimport { withDefault, fallthrough } from "../infra/props";\nimport { LegacyChip, LegacyButton, LegacyIcon } from "../infra/ui";\nimport { useLegacyI18n } from "../infra/i18n";\nimport { icons } from "../reused/lib/icons";\n`
      +imports.join('\n')+'\n'+declarations.join('\n')+`\nexport type ${component}Props = Props & { ${[...eventProps,...slotProps].join('\n')} } & Record<string, unknown>;\n`
      +`export default function ${component}(__input: ${component}Props) {\nconst props = { ${resolved.join(',\n')} };\nconst attrs = fallthrough(__input, ${quote(consumed)});\n`
      +scriptBody.join('\n')+`\nreturn <>${jsx}</>;\n}\n`;
    const outFile=ts.createSourceFile(component+'.tsx',output,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    if(outFile.parseDiagnostics.length) blocked('R01','Generated TSX syntax validation failed');
    const used = new Set();
    function references(node) { if (ts.isIdentifier(node)) used.add(node.text); ts.forEachChild(node,references); }
    outFile.statements.filter(s=>!ts.isImportDeclaration(s)).forEach(references);
    const statements=[];
    for(const statement of outFile.statements) {
      if(!ts.isImportDeclaration(statement)||!statement.importClause) { statements.push(statement); continue; }
      const clause=statement.importClause;
      const defaultName=clause.name&&used.has(clause.name.text)?clause.name:undefined;
      let bindings=clause.namedBindings;
      if(bindings&&ts.isNamedImports(bindings)) { const elements=bindings.elements.filter(e=>used.has(e.name.text)); bindings=elements.length?ts.factory.updateNamedImports(bindings,elements):undefined; }
      if(bindings&&ts.isNamespaceImport(bindings)&&!used.has(bindings.name.text)) bindings=undefined;
      if(defaultName||bindings) statements.push(ts.factory.updateImportDeclaration(statement,statement.modifiers,ts.factory.updateImportClause(clause,clause.isTypeOnly,defaultName,bindings),statement.moduleSpecifier,statement.attributes));
    }
    let pruned=printer.printFile(ts.factory.updateSourceFile(outFile,statements));
    if(!pruned.startsWith('// Generated by WF4-R2')) pruned=`// Generated by WF4-R2 AST rules. Do not hand-edit. Source: ${path}\n`+pruned;
    use('R01');
    return { output:pruned, diagnostics, rules:[...applied].sort(), imports:importInventory };
  } catch(error) {
    if(!(error instanceof Blocked)) throw error;
    const offset=Math.max(0,error.offset+sourceBase);
    diagnostics.push({rule:error.rule,message:error.message,path,line:source.slice(0,offset).split('\n').length,offset,blocking:true});
    return { output:null, diagnostics, rules:[...applied].sort(), imports:importInventory };
  }
}

export function refineInMemory(files, operations) {
  const result={...files};
  for(const {file,anchor,replacement} of operations) {
    if(!(file in result)||!anchor || result[file].split(anchor).length!==2) throw new Error(`Refinement precondition failed: ${file}`);
    result[file]=result[file].replace(anchor,replacement);
  }
  return result;
}
