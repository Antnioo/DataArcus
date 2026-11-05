// 0.3.2 DD2X (mcp/work/DD2X.md): one XML escape. assets/js/svg-escape.js xmlEsc is the one home of CONTRACTS.md's
// family xml (a text safe inside an XML attribute or element); mcp/lib/flip-cards.mjs reads it and keeps the local
// name `xml` as a one-line alias. No answer changes. Made-up texts only.
//   X1-X10  the contract probe's 10 texts through xmlEsc and through the alias line read from flip-cards.mjs: each
//           answer pinned, one answer for both names
//   F1      the alias is the same function (xml === xmlEsc)
//   S1-S2   one place: flip-cards.mjs holds no escape chain of its own, and reads svg-escape.js
//   node test-0.3.2-dd2x.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const SvgEscape = require('../assets/js/svg-escape.js');
const { xmlEsc } = SvgEscape;
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const show = (s) => JSON.stringify(s);

const src = fs.readFileSync(path.join(HERE, 'lib', 'flip-cards.mjs'), 'utf8').replace(/\r\n/g, '\n');
const lines = src.split('\n').filter((l) => l.startsWith('const xml = '));
chk(() => lines.length === 1, () => `S0 ${lines.length} lines "const xml = " in flip-cards.mjs, 1 wanted`);
const xml = new Function('SvgEscape', '"use strict";\n' + (lines[0] || '') + '\nreturn xml;')(SvgEscape);

// [id, label, the text, its answer]: the probe's 10 (scripts/contracts-probe.mjs ESCAPES)
const TEXTS = [
  ['X1', "'' (empty)", '', ''],
  ['X2', 'a & b', 'a & b', 'a &amp; b'],
  ['X3', '<b>', '<b>', '&lt;b&gt;'],
  ['X4', '"q"', '"q"', '&quot;q&quot;'],
  ['X5', "it's", "it's", 'it&apos;s'],
  ['X6', '&amp; (escaped already)', '&amp;', '&amp;amp;'],
  ['X7', 'Arabic', 'المبيعات', 'المبيعات'],
  ['X8', 'null', null, 'null'],
  ['X9', 'undefined', undefined, 'undefined'],
  ['X10', '12 (a number)', 12, '12'],
];
for (const [id, label, t, want] of TEXTS) {
  const a = xmlEsc(t), b = xml(t);
  chk(() => a === want && b === want, () => `${id} (${label}): xmlEsc ${show(a)}, xml ${show(b)}, wanted ${show(want)}`);
}
chk(() => xml === xmlEsc, () => 'F1 xml is not the same function as svg-escape.js xmlEsc');

const chain = /\.replace\(\/&\/g, '&amp;'\)/;
chk(() => !chain.test(src), () => 'S1 flip-cards.mjs holds an XML escape chain of its own again: read svg-escape.js xmlEsc');
chk(() => /require\('\.\.\/\.\.\/assets\/js\/svg-escape\.js'\)/.test(src) && /^const xml = SvgEscape\.xmlEsc;$/m.test(src), () => 'S2 flip-cards.mjs must read svg-escape.js and keep `const xml = SvgEscape.xmlEsc;`');

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2x  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2x  ${checks} checks`);
