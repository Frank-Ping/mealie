// Balanced-delimiter call extraction — regex can't match nested parens/braces
// (root cause of the Phase C TS1xxx syntax-error family: ref(computed args were
// truncated at the first inner ')').
//
// extractCall(src, idx): idx points at an identifier (e.g. "ref"); optionally
// followed by a <generic> and then '('. Walks with string/template/comment
// awareness and returns the inner argument text plus the index after ')'.

const OPEN_TO_CLOSE = { "(": ")", "{": "}", "[": "]" };

export function extractCall(src, idx) {
  let i = idx;
  while (i < src.length && /[\w$]/.test(src[i])) i++; // identifier
  if (src[i] === "<") { // generic parameter list
    let angle = 0;
    while (i < src.length) {
      if (src[i] === "<") angle++;
      else if (src[i] === ">") { angle--; if (angle === 0) { i++; break; } }
      i++;
    }
  }
  while (i < src.length && /\s/.test(src[i])) i++;
  const opener = src[i];
  if (!OPEN_TO_CLOSE[opener]) return null; // works for ( … ) and { … } alike
  const argStart = i + 1;
  const stack = [opener];
  i++;
  let inStr = null, inLine = false, inBlock = false, inTpl = false;
  while (i < src.length && stack.length) {
    const ch = src[i], next = src[i + 1];
    if (inLine) { if (ch === "\n") inLine = false; i++; continue; }
    if (inBlock) { if (ch === "*" && next === "/") { inBlock = false; i += 2; continue; } i++; continue; }
    if (inStr) { if (ch === "\\") { i += 2; continue; } if (ch === inStr) inStr = null; i++; continue; }
    if (inTpl) {
      if (ch === "\\") { i += 2; continue; }
      if (ch === "`") { inTpl = false; i++; continue; }
      i++; continue; // template ${} nesting is rare here; braces inside are counted via stack anyway
    }
    if (ch === "/" && next === "/") { inLine = true; i += 2; continue; }
    if (ch === "/" && next === "*") { inBlock = true; i += 2; continue; }
    if (ch === '"' || ch === "'") { inStr = ch; i++; continue; }
    if (ch === "`") { inTpl = true; i++; continue; }
    if (OPEN_TO_CLOSE[ch]) stack.push(ch);
    else if (ch === ")" || ch === "}" || ch === "]") {
      const open = stack.pop();
      if (OPEN_TO_CLOSE[open] !== ch) return null; // unbalanced — bail out
      if (stack.length === 0) {
        return { args: src.slice(argStart, i), end: i + 1 };
      }
    }
    i++;
  }
  return null;
}

// Split a call-argument string on top-level commas (depth/string aware).
export function splitArgs(s) {
  const parts = [];
  let depth = 0, cur = "", inStr = null;
  for (let k = 0; k < s.length; k++) {
    const ch = s[k];
    if (inStr) {
      cur += ch;
      if (ch === "\\") { cur += s[++k] ?? ""; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; cur += ch; continue; }
    if (OPEN_TO_CLOSE[ch]) depth++;
    else if (ch === ")" || ch === "}" || ch === "]") depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim());
}
