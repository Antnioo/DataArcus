// Every module the shipped code loads is named by a literal path (B-196; D5's page-preview.js broke the 0.3.0-rc.3
// build: require(file) with a variable passes every test, but the engine's packaging stages only the modules it can
// name, and refused it; fixed in 043844e).
//   node scripts/check-literal-requires.mjs                  the shipped code: assets/js/*.js (not .min.js),
//                                                             mcp/server.mjs, mcp/lib/**/*.mjs and mcp/tools/*.mjs (no tests,
//                                                             research)
//   node scripts/check-literal-requires.mjs <file|folder>...  those files (.js, .mjs, .cjs; folders walked)
// A call is require(...), import(...) or createRequire(...)(...); its argument must be one string literal ('x', "x",
// or `x` without ${}). Comments are not code. Exit code 1 and each file:line when one is not.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.name === 'node_modules' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const isCode = (f) => /\.(m|c)?js$/.test(f) && !/\.min\.js$/.test(f);
const shipped = () => fs.readdirSync(path.join(ROOT, 'assets/js')).filter((f) => isCode(f)).map((f) => path.join(ROOT, 'assets/js', f))
  .concat([path.join(ROOT, 'mcp/server.mjs')], walk(path.join(ROOT, 'mcp/lib')).filter((f) => f.endsWith('.mjs')))
  // (0.3.1 S9) each tool's module, which server.mjs imports
  .concat(fs.existsSync(path.join(ROOT, 'mcp/tools')) ? walk(path.join(ROOT, 'mcp/tools')).filter((f) => f.endsWith('.mjs')) : []);

// the code without its comments and the text of its strings, same length and lines (so a line number stays true):
// a comment, a string's or a regular expression's inside becomes spaces; quotes stay, so a literal argument still reads
// as one; a template's ${...} is code (scanned, nested templates too) and leaves a $ the argument test refuses
export function codeOnly(src) {
  const n = src.length, blank = (t) => t.replace(/[^\n]/g, ' ');
  let i = 0;
  const code = (inBraces) => {
    let out = '', depth = 0;
    while (i < n) {
      const c = src[i], d = src[i + 1];
      if (inBraces && c === '{') depth++;
      if (inBraces && c === '}') { if (!depth) { i++; return out + '}'; } depth--; }
      if (c === '/' && d === '/') { const j = src.indexOf('\n', i), e = j < 0 ? n : j; out += blank(src.slice(i, e)); i = e; continue; }
      if (c === '/' && d === '*') { const j = src.indexOf('*/', i + 2), e = j < 0 ? n : j + 2; out += blank(src.slice(i, e)); i = e; continue; }
      // a regular expression literal (its quotes are not strings: /[&<>"']/): a / where an expression starts
      if (c === '/' && /(^|[(,=:[!&|?{};+\-*%<>~^]|\breturn|\btypeof)\s*$/.test(out.slice(-40))) {
        let j = i + 1, cls = false;
        while (j < n && src[j] !== '\n' && (cls || src[j] !== '/')) { if (src[j] === '\\') j++; else if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; j++; }
        out += '/' + blank(src.slice(i + 1, j)) + (src[j] === '/' ? '/' : ''); i = j + 1; continue;
      }
      if (c === '\'' || c === '"') {
        let j = i + 1; while (j < n && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') j++; j++; }
        out += c + blank(src.slice(i + 1, j)) + (src[j] === c ? c : ''); i = j + 1; continue;
      }
      if (c === '`') {
        out += '`'; i++;
        while (i < n && src[i] !== '`') {
          if (src[i] === '\\') { out += blank(src.slice(i, i + 2)); i += 2; continue; }
          if (src[i] === '$' && src[i + 1] === '{') { out += '${'; i += 2; out += code(true); continue; }
          out += src[i] === '\n' ? '\n' : ' '; i++;
        }
        if (i < n) { out += '`'; i++; }
        continue;
      }
      out += c; i++;
    }
    return out;
  };
  return code(false);
}
// each load call whose argument is not one string literal: { line, call }
export function nonLiteral(src) {
  const code = codeOnly(src), hits = [];
  const lineOf = (k) => code.slice(0, k).split('\n').length;
  const LITERAL = /^\s*(['"`])[^'"`$]*\1\s*\)/;   // (a template with ${...} keeps its $)
  for (const m of code.matchAll(/(?<![\w$.])(require|import)\s*\(|\bcreateRequire\s*\([^()]*\)\s*\(/g)) {
    const at = m.index + m[0].length;
    if (!LITERAL.test(code.slice(at, at + 2000))) hits.push({ line: lineOf(m.index), call: m[1] || 'createRequire(...)' });
  }
  return hits;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const files = args.length ? args.flatMap((a) => (fs.statSync(a).isDirectory() ? walk(a) : [a])).filter(isCode) : shipped();
  const bad = files.flatMap((f) => nonLiteral(fs.readFileSync(f, 'utf8')).map((h) => `${path.relative(ROOT, f).split(path.sep).join('/')}:${h.line}: ${h.call}(...) with a path that is not one string literal`));
  if (bad.length) { console.error(`${bad.length} module load${bad.length === 1 ? '' : 's'} by a computed path (packaging stages only the modules it can name: write the path as a literal):\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`All module loads in ${files.length} files name a literal path.`);
}
