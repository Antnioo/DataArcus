// The facts behind mcp/docs/MODULES.md "## Every module" (0.3.2 MD1), read from the code, never guessed. For every
// module file (assets/js/*.js without .min.js, mcp/lib/*.mjs, mcp/tools/*.mjs):
//   exports   what it exports (export ..., module.exports' keys) and the global it sets for the browser (root.X, window.X)
//   imports   what it imports or requires (modules by path; packages and node: built-ins by name), and the engines a
//             page script or worker loads by name (importScripts, a '<name>.min.js' string)
//   touches   DOM, storage (localStorage...), fs, net (fetch, http, sockets), worker, process (child_process, env), and
//             the globals it writes other than its export
//   used by   the reverse of imports, plus the HTML pages whose <script src> loads it; the tests and scripts that
//             load it are counted apart (they are not its callers)
// Comments and string contents are left out before a pattern is looked for (a page held in a string is not DOM use).
//   node scripts/modules-facts.mjs           the table, one row per file
//   node scripts/modules-facts.mjs --json    the same as JSON
// Imported by scripts/check-modules.mjs (moduleFiles, pageFiles).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(HERE, '..');
const posix = (p) => p.split(path.sep).join('/');

// the parts the map holds: the folder, the file pattern
export const PARTS = [
  { dir: 'assets/js', test: (f) => /\.js$/.test(f) && !/\.min\.js$/.test(f) },
  { dir: 'mcp/lib', test: (f) => /\.mjs$/.test(f) },
  { dir: 'mcp/tools', test: (f) => /\.mjs$/.test(f) },
];

export function moduleFiles(root = ROOT) {
  const out = [];
  for (const { dir, test } of PARTS) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).sort()) if (test(f) && fs.statSync(path.join(abs, f)).isFile()) out.push(dir + '/' + f);
  }
  return out;
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'lab', 'coverage']);
function walk(root, dir, pred, out = []) {
  if (!fs.existsSync(path.join(root, dir))) return out;
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
    const rel = dir ? dir + '/' + e.name : e.name;
    if (e.isDirectory()) walk(root, rel, pred, out);
    else if (pred(rel)) out.push(rel);
  }
  return out;
}
export const pageFiles = (root = ROOT) => walk(root, '', (f) => /\.html$/.test(f)).sort();

// one pass over JavaScript: code (comments out, string contents blanked: each string is '' / "" / `` in the code) and
// the string literals' values in the same order; a template's ${...} parts are skipped whole (nested strings included)
export function lex(src) {
  const n = src.length, strings = [];
  let code = '', prev = '';
  const regexCan = () => /^$|[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) || /\b(return|typeof|case|in|of|delete|void|throw|new|else|do|yield|await)$/.test(code.trimEnd());
  // from i (just after an opening quote q), to just after its closing quote; the value read
  function quoted(i, q) {
    let val = '';
    while (i < n) {
      const ch = src[i];
      if (ch === '\\') { val += src[i + 1] || ''; i += 2; continue; }
      if (q === '`' && ch === '$' && src[i + 1] === '{') { i = skipCode(i + 2); continue; }
      if (ch === q) return { i: i + 1, val };
      if (q !== '`' && ch === '\n') return { i, val };
      val += ch; i++;
    }
    return { i, val };
  }
  // from i on a regex's opening slash: to just after its flags (i + 1 when it is not one: no closing slash on the line)
  function regexEnd(i) {
    let j = i + 1, cls = false;
    while (j < n && src[j] !== '\n') {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; else if (src[j] === '/' && !cls) break;
      j++;
    }
    if (src[j] !== '/') return i + 1;
    j++; while (/[a-z]/i.test(src[j] || '')) j++;
    return j;
  }
  // from i inside a ${ ... }: to just after its closing brace
  function skipCode(i) {
    let depth = 0, before = '{';
    while (i < n) {
      const c = src[i];
      if (c === '\'' || c === '"' || c === '`') { i = quoted(i + 1, c).i; before = c; continue; }
      if (c === '/' && /[(,=:[!&|?{};]/.test(before) && src[i + 1] !== '/' && src[i + 1] !== '*') { i = regexEnd(i); before = '/'; continue; }
      if (!/\s/.test(c)) before = c;
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
      if (c === '{') depth++;
      if (c === '}') { if (!depth) return i + 1; depth--; }
      i++;
    }
    return i;
  }
  let i = 0;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? n : e + 2; code += src.slice(i, end).replace(/[^\n]/g, '') + ' '; i = end; continue; }
    if (c === '\'' || c === '"' || c === '`') {
      const r = quoted(i + 1, c);
      strings.push(r.val); code += c + c; prev = c; i = r.i; continue;
    }
    if (c === '/' && regexCan()) {
      const j = regexEnd(i);
      if (j > i + 1) { code += '/r/'; prev = '/'; i = j; continue; }
    }
    code += c; if (!/\s/.test(c)) prev = c; i++;
  }
  return { code, strings };
}

// the top-level keys of an object literal starting at text[at] === '{'
function objectKeys(text, at) {
  const keys = []; let depth = 0, tok = '', i = at;
  for (; i < text.length; i++) {
    const c = text[i];
    if ('{[('.includes(c)) { depth++; if (depth === 1) continue; }
    if ('}])'.includes(c)) { depth--; if (depth === 0) { keys.push(tok); break; } }
    if (depth === 1 && c === ',') { keys.push(tok); tok = ''; continue; }
    if (depth === 1) tok += c;
  }
  return keys.map((k) => (/^\s*(?:\.\.\.)?\s*([A-Za-z_$][\w$]*)/.exec(k) || [])[1]).filter(Boolean);
}

function exportsOf(root, file, code, raw) {
  const names = [];
  if (file.endsWith('.mjs')) {
    for (const m of code.matchAll(/\bexport\s+(?:async\s+)?(?:function\s*\*?|class)\s*([A-Za-z_$][\w$]*)/g)) names.push(m[1]);
    for (const m of code.matchAll(/\bexport\s+(?:const|let|var)\s+([^=;]+?)=/g)) {
      const lhs = m[1].trim();
      if (/^[{[]/.test(lhs)) names.push(...lhs.replace(/[{}[\]]/g, '').split(',').map((s) => s.split(':').pop().trim()).filter(Boolean));
      else names.push(lhs);
    }
    for (const m of code.matchAll(/\bexport\s*\{([^}]*)\}/g)) names.push(...m[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()).filter(Boolean));
    for (const m of raw.matchAll(/\bexport\s*\*\s*(?:as\s+(\w+)\s*)?from\s*['"]([^'"]+)['"]/g)) names.push(m[1] ? m[1] : '* from ' + path.basename(m[2]));
    if (/\bexport\s+default\b/.test(code)) names.push('default');
  } else {
    // an engine that exports for Node is loaded (they are the MCP's own, side-effect free in Node) and its keys read;
    // one that does not is read from its text
    if (/module\.exports/.test(code)) {
      try { const api = createRequire(path.join(root, file))(path.join(root, file)); if (api && typeof api === 'object') return Object.keys(api); } catch { /* read from the text below */ }
    }
    for (const m of code.matchAll(/\b(?:root|window|self)\.[A-Z][\w$]*\s*=\s*(?:Object\.freeze\(\s*)?\{/g)) names.push(...objectKeys(code, m.index + m[0].length - 1));
    const me = /module\.exports\s*=\s*(\{|[A-Za-z_$][\w$]*)/.exec(code);
    if (me) {
      if (me[1] === '{') names.push(...objectKeys(code, me.index + me[0].length - 1));
      else {
        const def = new RegExp('(?:const|let|var)\\s+' + me[1].replace(/\$/g, '\\$') + '\\s*=\\s*\\{').exec(code);
        if (def) names.push(...objectKeys(code, def.index + def[0].length - 1));
        else names.push(me[1]);
      }
    }
    for (const m of code.matchAll(/\bmodule\.exports\.([A-Za-z_$][\w$]*)\s*=/g)) names.push(m[1]);
  }
  return [...new Set(names)];
}

// a global written: root.X / window.X / self.X / globalThis.X = (not ==)
function globalsOf(file, code) {
  const out = [];
  const re = file.endsWith('.js') ? /(?<![.$\w])(root|window|self|globalThis)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g : /(?<![.$\w])(window|globalThis)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g;
  for (const m of code.matchAll(re)) {
    if (m[1] === 'self' && /^on/.test(m[2])) continue;   // a worker's onmessage: its worker use
    out.push(m[2]);
  }
  return [...new Set(out)];
}

const TOUCH = {
  DOM: /(?<![.$\w])document\s*\.|\bnew\s+Image\b|(?<![.$\w])window\.(?:addEventListener|location|getComputedStyle|matchMedia|scroll\w*|innerWidth|innerHeight|open|print|history|requestAnimationFrame)\b|(?<![.$\w])navigator\s*\.|\b(?:Mutation|Intersection|Resize)Observer\b|\bHTML\w*Element\b|\bshowDirectoryPicker\b|\.(?:addEventListener|removeEventListener|appendChild|setAttribute|innerHTML|classList|querySelector(?:All)?|getBoundingClientRect|setPointerCapture)\b/,   // the last: an element it is given
  'browser files': /\bnew\s+(?:FileReader|Blob|File)\b|\bURL\.createObjectURL\b|\bDecompressionStream\b/,
  storage: /(?<![.$\w])(?:window\.)?(?:localStorage|sessionStorage|indexedDB)\b/,
  net: /(?<![.$\w])fetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bsendBeacon\b/,
  worker: /\bnew\s+Worker\s*\(|\bimportScripts\s*\(|\bpostMessage\s*\(|\bself\.onmessage\b/,
  env: /(?<![.$\w])process\.(?:env|argv|cwd|platform)\b/,
};
const IMPORT_TOUCH = { fs: /^(?:node:)?fs(?:\/promises)?$/, net: /^(?:node:)?(?:http|https|net|dgram|tls)$/, process: /^(?:node:)?child_process$/, worker: /^(?:node:)?worker_threads$/ };

// what a file loads: [{ spec, kind }] with spec as written
function loadsOf(file, code, raw, strings) {
  const out = [];
  const add = (spec, kind) => out.push({ spec, kind });
  for (const m of raw.matchAll(/^\s*(?:import|export)\s[^'";]*?from\s*['"]([^'"]+)['"]/gm)) add(m[1], 'import');
  for (const m of raw.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm)) add(m[1], 'import');
  // require('x'), createRequire(...)('x'), import('x'): found on the code with each '' matched to its string, in order
  let si = 0;
  const re = /(''|""|``)|\b(require\s*\(\s*$|import\s*\(\s*$|\)\s*\(\s*$)/;
  // walk the code: every quote pair is the next string; the text before it says how it is used
  let acc = '';
  for (let i = 0; i < code.length; i++) {
    const two = code.slice(i, i + 2);
    if (two === '\'\'' || two === '""' || two === '``') {
      const val = strings[si++];
      const before = acc.slice(-40);
      if (/\brequire\s*\(\s*$/.test(before) || /\bcreateRequire\([^)]*\)\s*\(\s*$/.test(before) || /\)\s*\(\s*$/.test(before) && /createRequire/.test(acc.slice(-120))) add(val, 'require');
      else if (/\bimport\s*\(\s*$/.test(before)) add(val, 'import()');
      else if (/importScripts\s*\([^)]*$/.test(acc.slice(-400))) add(val, 'importScripts');
      else if (/^[^\s'"]*\.min\.js(\?.*)?$/.test(val)) add(val, 'loads');
      acc += two; i++; continue;
    }
    acc += code[i];
  }
  void re;
  return out;
}

const MOD_SET = (root) => new Set(moduleFiles(root));
// a spec to a repo path (a module or another file), or the package name
function resolveSpec(fromFile, spec, root, mods) {
  const clean = spec.replace(/[?#].*$/, '');
  if (/^(?:node:|[a-z@])/.test(clean) && !clean.includes('.js') && !/^\.?\.?\//.test(clean)) return { pkg: clean };
  let rel;
  if (clean.startsWith('/')) rel = clean.slice(1);
  else if (/^\.\.?\//.test(clean)) rel = posix(path.normalize(path.join(path.dirname(fromFile), clean)));
  else rel = posix(path.join(path.dirname(fromFile), clean));   // a bare 'x.min.js' (importScripts) is the file's folder
  rel = rel.replace(/\.min\.js$/, '.js');
  if (mods.has(rel)) return { file: rel };
  // a '/assets/js/x.js' string in a file elsewhere
  const m = /(?:^|\/)(assets\/js\/[^/]+\.js)$/.exec(rel);
  if (m && mods.has(m[1])) return { file: m[1] };
  return { other: rel };
}

const isTest = (f) => /(^|\/)(test[^/]*|[^/]*\.test)\.m?js$/.test(f) || /^scripts\/tests\//.test(f) || /^mcp\/(tests|fixtures)\//.test(f) || /^lab\//.test(f);

export function facts(root = ROOT) {
  const mods = moduleFiles(root), set = MOD_SET(root);
  const rows = new Map(mods.map((f) => [f, { file: f, exports: [], global: [], imports: [], packages: [], touches: [], usedBy: new Set(), pages: new Set(), testsAndScripts: new Set() }]));
  const scan = (file, into) => {
    const raw = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
    const { code, strings } = lex(raw);
    const loads = loadsOf(file, code, raw, strings);
    const targets = [];
    for (const { spec, kind } of loads) {
      const r = resolveSpec(file, spec, root, set);
      if (r.file && r.file !== file) targets.push({ file: r.file, kind });
      else if (r.pkg && into) into.packages.push(r.pkg);
    }
    if (into) {
      into.exports = exportsOf(root, file, code, raw);
      const g = globalsOf(file, code);
      const exp = g.filter((x) => /^(DA|DataArcus|MH|Tmdl)|^[A-Z]/.test(x) && (/root\.|window\.|self\./.test(code)));
      into.global = exp;
      const t = Object.keys(TOUCH).filter((k) => TOUCH[k].test(code));
      for (const [k, re] of Object.entries(IMPORT_TOUCH)) if (into.packages.some((p) => re.test(p)) && !t.includes(k)) t.push(k);
      const written = g.filter((x) => !exp.includes(x));
      if (written.length) t.push('globals ' + written.join(' '));
      if (file.endsWith('.js') && !/module\.exports/.test(code) && !g.length && /^\s*(?:class|function|const|let|var)\s/m.test(code) && !/^\s*\(function|^\s*\(\(\)|^document\.addEventListener/m.test(raw)) t.push('script scope');
      into.touches = t;
      into.imports = [...new Set(targets.map((x) => x.kind === 'import' || x.kind === 'require' ? x.file : x.file + ' (' + x.kind + ')'))];
    }
    return targets;
  };
  for (const f of mods) for (const t of scan(f, rows.get(f))) rows.get(t.file).usedBy.add(f);
  // the server, the tests and the repo scripts
  const others = [...walk(root, 'mcp', (f) => /\.mjs$/.test(f) && !/^mcp\/(lib|tools)\//.test(f)), ...walk(root, 'scripts', (f) => /\.m?js$/.test(f))];
  for (const f of others) {
    for (const t of scan(f, null)) {
      if (f === 'mcp/server.mjs') rows.get(t.file).usedBy.add(f);
      else rows.get(t.file).testsAndScripts.add(f);
    }
  }
  for (const page of pageFiles(root)) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) {
      const r = resolveSpec(page, m[1], root, set);
      if (r.file) rows.get(r.file).pages.add(page);
    }
  }
  return [...rows.values()].map((r) => ({ ...r, usedBy: [...r.usedBy].sort(), pages: [...r.pages].sort(), testsAndScripts: [...r.testsAndScripts].sort(),
    pure: !r.touches.length }));
}

const cut = (list, n = 6) => (list.length > n ? list.slice(0, n).join(', ') + ` (+${list.length - n})` : list.join(', '));
const short = (f) => f.replace(/^assets\/js\//, '').replace(/^mcp\//, '');

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const all = facts();
  if (process.argv.includes('--json')) { console.log(JSON.stringify(all, null, 1)); process.exit(0); }
  console.log('| file | exports (global) | imports | touches | used by (modules, server) | pages | tests+scripts | pure |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const r of all) {
    const pagesSaid = r.pages.length > 6 ? `${r.pages.length} pages` : r.pages.join(', ');
    console.log(`| ${r.file} | ${cut(r.exports, 8)}${r.global.length ? ' (' + r.global.join(' ') + ')' : ''} | ${cut(r.imports.map(short).concat(r.packages.filter((p) => !/^node:/.test(p))), 8)} | ${r.touches.join(', ')} | ${cut(r.usedBy.map(short), 8)} | ${pagesSaid} | ${r.testsAndScripts.length} | ${r.pure ? 'yes' : 'no'} |`);
  }
  const by = (d) => all.filter((r) => r.file.startsWith(d)).length;
  console.log(`\n${all.length} module files: assets/js ${by('assets/js/')}, mcp/lib ${by('mcp/lib/')}, mcp/tools ${by('mcp/tools/')}; ${pageFiles().length} HTML pages read`);
}
