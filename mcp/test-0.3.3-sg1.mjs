// SG1 (0.3.3; the owner, D-1104-12: "we create a library of functions where a place calls them so if we need to fix
// something we fix it at the source"; D-1109-05; B-422): the reviewer's same-job finder listed 15 "same shape,
// different files" groups. 11 answer one question and now live in one shared place each; 4 are only alike in shape
// (mcp/work/SG1.md, "For the reviewer: allow list"). Nothing a tool answers, a page shows or a file holds changes.
//   P1-P11  the parity: each old copy (its base source, 8f5624e6, written below as it was) and the one shared place give
//           the same answer on every made-up input (the answers compared as JSON text, undefined kept apart)
//   S1-S11  one job, one place: no member file keeps its own copy, each reads the shared one
// Made-up inputs only.   node test-0.3.3-sg1.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const read = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const show = (v) => (v === undefined ? 'undefined' : JSON.stringify(v));
const old = (src, ...deps) => new Function(...deps.map((d) => d[0]), 'return (' + src + ');')(...deps.map((d) => d[1]));
// the old copy and the shared place on every input, one check per group
const parity = (id, name, oldFn, now, inputs) => {
  const off = [];
  for (const args of inputs) { let a, b; try { a = show(oldFn(...args)); } catch (e) { a = 'threw ' + e.constructor.name; } try { b = show(now()(...args)); } catch (e) { b = 'threw ' + e.constructor.name; } if (a !== b) off.push(show(args) + ': old ' + a + ', now ' + b); }
  chk(() => off.length === 0, () => `${id} ${name}: ${off.length} of ${inputs.length} inputs differ: ${off.slice(0, 3).join(' | ')}`);
};
const lazy = (f) => () => { const v = f(); if (typeof v !== 'function') throw new TypeError('not a function'); return v; };

// ---------- the base's copies (8f5624e6), as they were written ----------
const OLD = {
  text: "(v) => (Array.isArray(v) ? v.join('\\n') : v == null ? '' : String(v))",
  lit: '(p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined)',
  el: '(tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }',
  keyOf: "(s) => { const mk = String(s).trim().match(/^'?(.+?)'?\\[(.+)\\]$/); return mk ? { t: mk[1], m: mk[2] } : null; }",
  leaves: "function leaves(o, at = '') { return (o && typeof o === 'object' ? Object.keys(o).flatMap((k) => leaves(o[k], at + '/' + k)) : [at]); }",
  save: '() => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ } }',
  hexToRgb: '(h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))',
  entries: "(list) => (Array.isArray(list) ? list.filter((e) => e && typeof e === 'object') : [])",
  put: '(p, j) => { files[at.get(p)].data = JSON.stringify(j, null, 2); }',
};

// ---------- P1 an expression given as text or as lines ----------
const DAX = () => require('../assets/js/dax-reference-parser.js');
const TEXTS = [[undefined], [null], [''], ['a'], [['a', 'b']], [[]], [0], [12], [true], [false], [{}], [['x', null, 3]], ['a\nb'], [[['n']]]];
parity('P1', 'text: dax-reference-parser exprText', old(OLD.text), lazy(() => DAX().exprText), TEXTS);

// ---------- P2 a property's raw literal value ----------
const PV = () => require('../assets/js/pbir-values.js');
const L = (v) => ({ expr: { Literal: { Value: v } } });
const LITS = [[undefined], [null], [0], [''], ['x'], [12], [true], [{}], [{ expr: null }], [{ expr: 'x' }], [{ expr: {} }], [{ expr: { Literal: null } }], [{ expr: { Literal: {} } }],
  [L("'Sales'")], [L("'it''s'")], [L('12D')], [L(12)], [L(false)], [L(null)], [L(0)], [{ expr: { Literal: 0 } }], [{ expr: { Literal: 'x' } }], [[L('1')]]];
parity('P2', 'lit/litOf: pbir-values litValue', old(OLD.lit), lazy(() => PV().litValue), LITS);

// ---------- P3 an element with a class and a text (a made-up document) ----------
const fakeDoc = () => ({ createElement: (tag) => ({ tag, className: '(unset)', textContent: '(unset)' }) });
const PT = () => require('../assets/js/page-toast.js');
const ELS = [['div'], ['div', 'a b'], ['span', '', 'x'], ['span', null, ''], ['p', 'c', 0], ['p', 'c', null], ['p', 'c', undefined], ['a', 0, false], ['time', 'w', 12]];
{ const d = fakeDoc(); parity('P3', 'el: page-toast el', old(OLD.el, ['doc', d]), lazy(() => { const f = PT().el; return typeof f === 'function' ? (...a) => f(d, ...a) : f; }), ELS); }

// ---------- P4 a measure written 'T'[M] ----------
const MS = () => import('./lib/model-script.mjs');
const MSmod = await MS();
const KEYS = [["'Sales'[Total]"], ['Sales[Total]'], ["  'My Table'[A [b]]  "], ['[Total]'], ['Sales'], [''], [null], [undefined], [12], ["'Sales'[]"], ["Sales'[x]"], ["'a''b'[c]"]];
parity('P4', 'keyOf: model-script keyOf', old(OLD.keyOf), lazy(() => MSmod.keyOf), KEYS);

// ---------- P5 every leaf pointer of a value ----------
const RK = await import('./lib/redesign-kinds.mjs');
const LEAVES = [[{ a: 1 }], [{ a: { b: 1, c: [1, 2] } }], [{}], [[]], [null], [1], ['x'], [{ a: null }], [{ a: 1 }, '/x'], [{ a: { b: {} } }, '/visual'], [5, '/p'], [{ 'a/b': 1 }, '']];
parity('P5', 'leaves: redesign-kinds leaves', old(OLD.leaves), lazy(() => RK.leaves), LEAVES);

// ---------- P6 a page's state kept in this browser (a made-up storage) ----------
{
  const run = (fn) => (store, key, state) => { const log = []; const ls = store === 'refuses' ? { setItem: () => { throw new Error('quota'); } } : { setItem: (k, v) => log.push([k, v]) }; const r = fn(ls, key, state); return [r, log]; };
  const oldSave = run((ls, key, state) => old(OLD.save, ['localStorage', ls], ['STORE', key], ['state', state])());
  const g = globalThis;
  const nowSave = () => run((ls, key, state) => { const had = Object.getOwnPropertyDescriptor(g, 'localStorage'); Object.defineProperty(g, 'localStorage', { value: ls, configurable: true, writable: true }); try { return PT().saveState(key, state); } finally { if (had) Object.defineProperty(g, 'localStorage', had); else delete g.localStorage; } });
  const STATES = [['ok', 'k', { a: 1 }], ['ok', 'dataarcus-x', { currency: 'AED', users: [1, 2] }], ['ok', 'k', null], ['ok', 'k', 'text'], ['refuses', 'k', { a: 1 }], ['ok', 'k', {}]];
  parity('P6', 'save: page-toast saveState', oldSave, () => { if (typeof PT().saveState !== 'function') throw new TypeError('missing'); return nowSave(); }, STATES);
}

// ---------- P7 #rrggbb -> [r, g, b] ----------
const DC = () => require('../assets/js/design-colours.js');
const HEX = [['#000000'], ['#ffffff'], ['#FFFFFF'], ['#118DFF'], ['#12ab3'], ['#1'], [''], ['#gg0000'], ['118DFF'], ['#118dff80']];
parity('P7', 'hexToRgb / mixHex p: design-colours hexToRgb', old(OLD.hexToRgb), lazy(() => DC().hexToRgb), HEX);

// ---------- P8 a list's object entries, the plain ones' properties, all their properties ----------
const OLDE = old(OLD.entries);
const OLDPLAIN = old("(list) => entries(list).filter((e) => e && !e.selector).reduce((a, e) => Object.assign(a, e.properties || {}), {})", ['entries', OLDE]);
const OLDANY = old("(list) => entries(list).reduce((a, e) => Object.assign(a, (e && e.properties) || {}), {})", ['entries', OLDE]);
const LISTS = [[undefined], [null], [{}], [[]], [[1, null, 'x', {}]], [[{ properties: { a: 1 } }, { selector: { metadata: 'x' }, properties: { a: 2, b: 3 } }]], [[{ properties: null }, { properties: { c: L('1') } }]], [[[1], { properties: { z: 0 } }]], ['abc']];
parity('P8a', 'entries: pbir-values entries', OLDE, lazy(() => PV().entries), LISTS);
parity('P8b', 'plain: pbir-values plain', OLDPLAIN, lazy(() => PV().plain), LISTS);
parity('P8c', 'anyOf: pbir-values anyOf', OLDANY, lazy(() => PV().anyOf), LISTS);

// ---------- P9 a JSON written back into the plan's file at that path ----------
{
  const run = (fn) => (paths, p, j) => { const files = paths.map((x) => ({ path: x, data: 'old' })); const at = new Map(files.map((f, i) => [f.path, i])); let r; try { r = fn(files, at, p, j); } catch (e) { r = 'threw ' + e.constructor.name; } return [r, files]; };
  const PUTS = [[['a.json', 'b.json'], 'b.json', { x: 1 }], [['a.json'], 'a.json', [1, 'two']], [['a.json'], 'a.json', null], [['a.json'], 'missing.json', { x: 1 }], [['a.json', 'a.json'], 'a.json', { y: 'ي' }]];
  parity('P9', 'put: model-script putJson', run((files, at, p, j) => old(OLD.put, ['files', files], ['at', at])(p, j)), () => { if (typeof MSmod.putJson !== 'function') throw new TypeError('missing'); return run(MSmod.putJson); }, PUTS);
}

// ---------- P10, P11 a path inside the working folder (the copies were the same text as the place they now read) ----------
chk(() => /export const pathOut = \(f\) => relRoot\(f\)\.split\('\/'\)\.map\(\(seg\) => \(seg === '\.\.' \|\| seg === '\.' \? seg : safeName\(seg\)\)\)\.join\('\/'\);/.test(read('mcp/lib/twin-read.mjs')), () => 'P10 pathOut: twin-read.mjs no longer holds the body native-copy.mjs had');
chk(() => /export const relOut = \(f\) => path\.relative\(ROOT, f\)\.split\(path\.sep\)\.map\(safeName\)\.join\('\/'\);/.test(read('mcp/lib/check-redact.mjs')), () => 'P11 relOut: check-redact.mjs no longer holds the body arabic-lens.mjs had');

// ---------- S one job, one place: no member keeps its own copy ----------
const none = (id, rel, re, what) => chk(() => !re.test(read(rel)), () => `${id} ${rel} still holds its own ${what}`);
const has = (id, rel, re, what) => chk(() => re.test(read(rel)), () => `${id} ${rel} does not read ${what}`);
const OWN_TEXT = /Array\.isArray\((\w+)\) \? \1\.join\('\\n'\) : \1 == null \? '' : String\(\1\)/;
for (const f of ['assets/js/confirm-memory.js', 'assets/js/gulf-health.js', 'assets/js/model-health-tmdl.js', 'assets/js/model-index.js', 'mcp/lib/shadow-model.mjs']) { none('S1', f, OWN_TEXT, 'text helper'); has('S1', f, /exprText/, 'exprText'); }
const OWN_LIT = /\.expr && \w+\.expr\.Literal \? \w+\.expr\.Literal\.Value : undefined/;
for (const f of ['assets/js/mirror-policy.js', 'assets/js/report-a11y.js', 'assets/js/report-rules.js', 'assets/js/visual-replace.js', 'mcp/lib/check-impact.mjs', 'mcp/lib/arabic-lens.mjs']) { none('S2', f, OWN_LIT, 'raw literal reader'); has('S2', f, /litValue/, 'litValue'); }
const OWN_EL = /createElement\(tag\); if \(cls\) e\.className = cls; if \(text != null\) e\.textContent = text/;
for (const f of ['assets/js/build-page.js', 'assets/js/build-usage.js', 'assets/js/theme-download-ui.js']) { none('S3', f, OWN_EL, 'element maker'); has('S3', f, /\.el\(/, 'page-toast el'); }
has('S3', 'build/index.html', /page-toast\.min\.js\?v=[0-9a-f]+"[^>]*><\/script>\s*(?:<[^>]*>\s*)*?<script[^>]*build-usage\.min\.js/, 'page-toast.min.js before build-usage');
for (const f of ['mcp/lib/metric-switcher.mjs', 'mcp/lib/status-icons.mjs']) { none('S4', f, /const keyOf = /, 'keyOf'); has('S4', f, /import \{[^}]*\bkeyOf\b[^}]*\} from '\.\/model-script\.mjs'/, 'keyOf from model-script.mjs'); }
none('S5', 'mcp/lib/redesign-patches.mjs', /const leaves = /, 'leaves'); has('S5', 'mcp/lib/redesign-patches.mjs', /Kinds\.leaves\(/, 'Kinds.leaves');
none('S6', 'mcp/lib/native-copy.mjs', /const (pathOut|relRoot) = /, 'pathOut or relRoot'); has('S6', 'mcp/lib/native-copy.mjs', /import \{[^}]*\bpathOut\b[^}]*\} from '\.\/twin-read\.mjs'/, 'pathOut from twin-read.mjs');
for (const f of ['assets/js/calendar-generator.js', 'assets/js/licensing-calculator.js', 'assets/js/measure-builder.js']) { none('S7', f, /localStorage\.setItem\(STORE, JSON\.stringify\(state\)\)/, 'save'); has('S7', f, /saveState\(STORE, state\)/, 'saveState'); }
has('S7', 'tools/power-bi-licensing-cost-calculator.html', /page-toast\.min\.js\?v=[0-9a-f]+"[^>]*><\/script>\s*(?:<[^>]*>\s*)*?<script[^>]*licensing-calculator\.min\.js/, 'page-toast.min.js before licensing-calculator');
none('S8', 'assets/js/pbip-query.js', /parseInt\(h\.slice\(i, i \+ 2\), 16\)/, 'hex parse');
has('S8', 'assets/js/pbip-query.js', /require\('\.\/design-colours\.js'\) : root\.DAColours\)\.hexToRgb/, 'design-colours hexToRgb');
for (const f of ['assets/js/layout-check.js', 'mcp/lib/report-inventory.mjs']) { none('S9', f, /const entries = \(list\) =>/, 'entries'); has('S9', f, /const entries = PV\.entries, plain = PV\.plain, anyOf = PV\.anyOf;/, 'pbir-values entries, plain, anyOf'); }
none('S10', 'mcp/lib/arabic-lens.mjs', /const relOut = /, 'relOut'); has('S10', 'mcp/lib/arabic-lens.mjs', /import \{[^}]*\brelOut\b[^}]*\} from '\.\/check-redact\.mjs'/, 'relOut from check-redact.mjs');
for (const f of ['mcp/lib/dax-functions.mjs', 'mcp/lib/status-icons.mjs']) { none('S11', f, /files\[at\.get\(p\)\]\.data = JSON\.stringify\(j, null, 2\)/, 'put'); has('S11', f, /putJson\(files, at, /, 'putJson'); }

if (problems.length) { console.log(`FAIL script=test-0.3.3-sg1.mjs cause=${problems[0].slice(0, 300)}`); for (const p of problems) console.log('  - ' + p); console.log(`FAIL  sg1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sg1  ${checks} checks`);
